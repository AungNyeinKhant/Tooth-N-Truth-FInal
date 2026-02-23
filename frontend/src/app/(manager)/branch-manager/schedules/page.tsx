"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores";
import {
  schedulesApi,
  Schedule,
  Doctor,
  DAY_NAMES,
  DAY_NAMES_SHORT,
  CreateScheduleData,
  UpdateScheduleData,
  BulkScheduleData,
} from "@/lib/api/schedules.api";
import {
  Plus,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Loader2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { ScheduleModal } from "./components/schedule-modal";
import { BulkScheduleModal } from "./components/bulk-schedule-modal";
import { DeleteScheduleModal } from "./components/delete-schedule-modal";

// Color palette for doctors
const DOCTOR_COLORS = [
  { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-700" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-700" },
  { bg: "bg-green-100", border: "border-green-300", text: "text-green-700" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700" },
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-700" },
];

export default function SchedulesPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  // Data state
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  // Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schedulesRes, doctorsData] = await Promise.all([
        schedulesApi.getSchedules({ limit: 100 }),
        schedulesApi.getDoctors(),
      ]);
      setSchedules(schedulesRes.items);
      setDoctors(doctorsData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      addToast("Failed to load schedules", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter schedules by doctor
  const filteredSchedules = selectedDoctorId
    ? schedules.filter((s) => s.doctorId === selectedDoctorId)
    : schedules;

  // Group schedules by day
  const schedulesByDay = DAY_NAMES.map((day, index) => ({
    day,
    dayIndex: index,
    schedules: filteredSchedules
      .filter((s) => s.dayOfWeek === index)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  // Get color for doctor
  const getDoctorColor = (doctorId: string) => {
    const index = doctors.findIndex((d) => d.id === doctorId);
    return DOCTOR_COLORS[index % DOCTOR_COLORS.length];
  };

  // Handlers
  const handleCreateSchedule = async (data: CreateScheduleData) => {
    setIsSubmitting(true);
    try {
      await schedulesApi.createSchedule(data);
      addToast("Schedule created successfully", "success");
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create schedule";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSchedule = async (data: UpdateScheduleData & { doctorId: string; dayOfWeek: number }) => {
    if (!editingSchedule) return;
    setIsSubmitting(true);
    try {
      await schedulesApi.updateSchedule(editingSchedule.id, data);
      addToast("Schedule updated successfully", "success");
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update schedule";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;
    setIsSubmitting(true);
    try {
      await schedulesApi.deleteSchedule(deletingSchedule.id);
      addToast("Schedule deleted successfully", "success");
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete schedule";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
      setIsDeleteModalOpen(false);
      setDeletingSchedule(null);
    }
  };

  const handleBulkCreate = async (data: BulkScheduleData) => {
    setIsSubmitting(true);
    try {
      const result = await schedulesApi.bulkCreateSchedules(data);
      addToast(result.message || "Schedules created successfully", "success");
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create schedules";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const openDeleteModal = (schedule: Schedule) => {
    setDeletingSchedule(schedule);
    setIsDeleteModalOpen(true);
  };

  const branchName = (user as any)?.branchManager?.branch?.name || "Your Branch";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-sm text-gray-500">{branchName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Bulk Create
          </button>
          <button
            onClick={() => {
              setEditingSchedule(null);
              setIsScheduleModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BCD4] rounded-lg text-sm font-medium text-white hover:bg-[#00A5BA] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Doctor
          </label>
          <div className="relative">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            >
              <option value="">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mt-5"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#00BCD4]" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Get started by creating schedules for your doctors
          </p>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BCD4] rounded-lg text-sm font-medium text-white hover:bg-[#00A5BA] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Week Schedule
          </button>
        </div>
      ) : (
        /* Weekly Calendar View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {schedulesByDay.map(({ day, dayIndex, schedules: daySchedules }) => (
              <div key={dayIndex} className="min-h-[400px]">
                {/* Day Header */}
                <div className="px-2 py-3 bg-gray-50 border-b border-gray-200 text-center">
                  <p className="text-sm font-medium text-gray-900">{DAY_NAMES_SHORT[dayIndex]}</p>
                  <p className="text-xs text-gray-500">{day}</p>
                </div>

                {/* Schedules */}
                <div className="p-2 space-y-2">
                  {daySchedules.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">No schedule</p>
                    </div>
                  ) : (
                    daySchedules.map((schedule) => {
                      const color = getDoctorColor(schedule.doctorId);
                      return (
                        <div
                          key={schedule.id}
                          className={`p-2 rounded-lg border ${color.bg} ${color.border} group relative`}
                        >
                          <p className={`text-xs font-medium ${color.text} truncate`}>
                            Dr. {schedule.doctor.firstName} {schedule.doctor.lastName.charAt(0)}.
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <p className="text-xs text-gray-600">
                              {schedule.startTime} - {schedule.endTime}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {schedule.slotDuration}min slots
                          </p>

                          {/* Action buttons on hover */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={() => openEditModal(schedule)}
                              className="p-1 bg-white rounded shadow hover:bg-gray-50"
                            >
                              <Edit2 className="w-3 h-3 text-gray-600" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(schedule)}
                              className="p-1 bg-white rounded shadow hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule List View (Alternative) */}
      {schedules.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">All Schedules</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredSchedules.map((schedule) => {
              const color = getDoctorColor(schedule.doctorId);
              return (
                <div
                  key={schedule.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-10 rounded ${color.bg}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {schedule.doctor.firstName} {schedule.doctor.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {DAY_NAMES[schedule.dayOfWeek]} • {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {schedule.slotDuration}min / {schedule.bufferTime}min buffer
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        schedule.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {schedule.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => openEditModal(schedule)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(schedule)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
        schedule={editingSchedule}
        doctors={doctors}
        isLoading={isSubmitting}
      />

      <BulkScheduleModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSubmit={handleBulkCreate}
        doctors={doctors}
        isLoading={isSubmitting}
      />

      <DeleteScheduleModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingSchedule(null);
        }}
        onConfirm={handleDeleteSchedule}
        scheduleInfo={
          deletingSchedule
            ? `${DAY_NAMES[deletingSchedule.dayOfWeek]} • ${deletingSchedule.startTime} - ${deletingSchedule.endTime} (Dr. ${deletingSchedule.doctor.firstName} ${deletingSchedule.doctor.lastName})`
            : ""
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}
