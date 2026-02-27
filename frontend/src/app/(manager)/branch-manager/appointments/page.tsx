"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores";
import {
  appointmentsApi,
  appointmentsApi as api,
  Appointment,
  AppointmentStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/api/appointments-manager.api";
import { slotsApi, Doctor, DAY_NAMES } from "@/lib/api/slots.api";
import { servicesApi, Service } from "@/lib/api/services.api";
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  CalendarClock,
  Edit,
  FileText,
  User,
} from "lucide-react";
import { RescheduleModal } from "./components/reschedule-modal";
import { StatusModal } from "./components/status-modal";
import { NotesModal } from "./components/notes-modal";

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const branchId = user?.branchId || user?.branchManager?.branchId;
  const branchName = user?.branchManager?.branch?.name || "Your Branch";

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filter state
  const statusFilterRef = useRef<AppointmentStatus | "">("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dateFilterRef = useRef<string>("");
  const doctorFilterRef = useRef<string>("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");

  // Modal state
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [statusAction, setStatusAction] = useState<AppointmentStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!branchId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [appointmentsRes, doctorsData, servicesData] = await Promise.all([
        api.getManagerAppointments({
          status: statusFilter || undefined,
          date: dateFilter || undefined,
          doctorId: doctorFilter || undefined,
          search: searchQuery || undefined,
          page,
          limit,
        }),
        slotsApi.getDoctors(),
        servicesApi.getAll({ status: "active", limit: 50 }),
      ]);

      setAppointments(appointmentsRes.data);
      setTotal(appointmentsRes.meta.total);
      setDoctors(doctorsData || []);
      
      const servicesPayload = (servicesData.data as any)?.data;
      const servicesDataArray = Array.isArray(servicesPayload?.data)
        ? servicesPayload.data
        : Array.isArray(servicesPayload)
        ? servicesPayload
        : [];
      setServices(servicesDataArray);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      addToast("Failed to load appointments", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, page, limit, searchQuery, branchId, statusFilter, dateFilter, doctorFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update refs
  useEffect(() => {
    statusFilterRef.current = statusFilter;
    dateFilterRef.current = dateFilter;
    doctorFilterRef.current = doctorFilter;
  }, [statusFilter, dateFilter, doctorFilter]);

  // Handlers
  const handleSearch = () => {
    const searchValue = searchRef.current?.value || "";
    setSearchQuery(searchValue);
    setPage(1);
  };

  const handleReschedule = async (data: any) => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      await appointmentsApi.reschedule(selectedAppointment.id, data);
      addToast("Appointment rescheduled successfully", "success");
      fetchData();
      setIsRescheduleModalOpen(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reschedule";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (data: any) => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      await appointmentsApi.updateStatus(selectedAppointment.id, data);
      addToast("Status updated successfully", "success");
      fetchData();
      setIsStatusModalOpen(false);
      setSelectedAppointment(null);
      setStatusAction(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update status";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    try {
      await appointmentsApi.updateStatus(selectedAppointment.id, {
        status: selectedAppointment.status,
        notes,
      });
      addToast("Notes updated successfully", "success");
      fetchData();
      setIsNotesModalOpen(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update notes";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduleModalOpen(true);
  };

  const openStatusModal = (appointment: Appointment, status: AppointmentStatus) => {
    setSelectedAppointment(appointment);
    setStatusAction(status);
    setIsStatusModalOpen(true);
  };

  const openNotesModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsNotesModalOpen(true);
  };

  // Status tabs
  const statusTabs = [
    { key: "", label: "All" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "COMPLETED", label: "Completed" },
    { key: "NO_SHOW", label: "No Show" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">{branchName}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by patient name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
            >
              Search
            </button>
          </div>
        </div>

        {/* Doctor Filter */}
        <select
          value={doctorFilter}
          onChange={(e) => {
            setDoctorFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
        >
          <option value="">All Doctors</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {doctor.firstName} {doctor.lastName}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
        />

        {/* Refresh */}
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key as AppointmentStatus | "");
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              statusFilter === tab.key
                ? "bg-[#00BCD4] text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && appointments.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#00BCD4]" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-sm text-gray-500">
            Try adjusting your filters or create a new appointment
          </p>
        </div>
      ) : (
        /* Appointments Table */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.patient.user.phone || appointment.patient.user.email}
                        </p>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{appointment.service.name}</p>
                      <p className="text-xs text-gray-500">{appointment.service.duration} min</p>
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">
                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{appointment.doctor.specialization}</p>
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                      <p className="text-xs text-gray-500">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[appointment.status]}`}
                      >
                        {STATUS_LABELS[appointment.status]}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      {appointment.isWalkIn ? (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                          <User className="w-3 h-3" />
                          Walk-in {appointment.tokenNumber && `(${appointment.tokenNumber})`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Booked</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {appointment.status === "CONFIRMED" && (
                          <>
                            <button
                              onClick={() => openRescheduleModal(appointment)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Reschedule"
                            >
                              <CalendarClock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(appointment, "COMPLETED")}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Mark Completed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(appointment, "NO_SHOW")}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="No Show"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openNotesModal(appointment)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                          title="Add Notes"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {appointment.status === "CONFIRMED" && (
                          <button
                            onClick={() => openStatusModal(appointment, "CANCELLED")}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => {
          setIsRescheduleModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSubmit={handleReschedule}
        appointment={selectedAppointment}
        doctors={doctors}
        isLoading={isSubmitting}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedAppointment(null);
          setStatusAction(null);
        }}
        onSubmit={handleUpdateStatus}
        appointment={selectedAppointment}
        action={statusAction}
        isLoading={isSubmitting}
      />

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSubmit={handleUpdateNotes}
        appointment={selectedAppointment}
        isLoading={isSubmitting}
      />
    </div>
  );
}
