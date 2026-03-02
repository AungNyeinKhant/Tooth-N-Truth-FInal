"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores";
import {
  getWalkInQueue,
  createWalkIn,
  updateWalkInStatus,
  convertWalkInToAppointment,
  WalkIn,
  WalkInStatus,
  CreateWalkInRequest,
  UpdateWalkInStatusRequest,
  ConvertToAppointmentRequest,
  formatWaitTime,
  getWaitTimeColor,
  getStatusColor,
} from "@/lib/api/walkins.api";
import { slotsApi, Doctor } from "@/lib/api/slots.api";
import { servicesApi, Service } from "@/lib/api/services.api";
import {
  Plus,
  Users,
  Clock,
  Loader2,
  ChevronDown,
  RefreshCw,
  UserPlus,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { RegisterWalkInModal } from "./components/register-walkin-modal";
import { UpdateStatusModal } from "./components/update-status-modal";
import { ConvertToAppointmentModal } from "./components/convert-to-appointment-modal";

export default function WalkInsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  // Get branch ID from user
  const branchId = (user as any)?.branchManager?.branch?.id;
  const branchName = (user as any)?.branchManager?.branch?.name || "Your Branch";

  // Data state
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filter state
  const statusFilterRef = useRef<WalkInStatus | "">("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dateFilterRef = useRef<string>("all");
  const [statusFilter, setStatusFilter] = useState<WalkInStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedWalkIn, setSelectedWalkIn] = useState<WalkIn | null>(null);
  const [statusAction, setStatusAction] = useState<WalkInStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-refresh interval (only for today's data)
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [walkInsRes, doctorsData, servicesData] = await Promise.all([
        getWalkInQueue({
          status: statusFilterRef.current || undefined,
          date: dateFilterRef.current,
          search: searchQuery || undefined,
          page,
          limit,
        }),
        slotsApi.getDoctors(),
        servicesApi.getAll({ status: "active", limit: 50 }),
      ]);

      setWalkIns(walkInsRes.data);
      setTotal(walkInsRes.meta.total);

      // Set doctors from slots API (already filtered by branch)
      setDoctors(doctorsData || []);

      // Extract services from response
      const servicesPayload = (servicesData.data as any)?.data;
      const servicesDataArray = Array.isArray(servicesPayload?.data)
        ? servicesPayload.data
        : Array.isArray(servicesPayload)
        ? servicesPayload
        : [];
      setServices(servicesDataArray);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      addToast("Failed to load walk-ins", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, page, limit, searchQuery]);

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 30 seconds (only when viewing today)
    if (dateFilter === "today") {
      autoRefreshInterval.current = setInterval(() => {
        fetchData();
      }, 30000);
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [fetchData, dateFilter]);

  // Update refs when filter changes
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  useEffect(() => {
    dateFilterRef.current = dateFilter;
    setPage(1); // Reset to page 1 when date changes
  }, [dateFilter]);

  // Handlers
  const handleRegisterWalkIn = async (data: CreateWalkInRequest) => {
    setIsSubmitting(true);
    try {
      const result = await createWalkIn(data);
      addToast(
        `Walk-in registered! Token: ${result.tokenNumber}`,
        "success"
      );
      fetchData();
      setIsRegisterModalOpen(false);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to register walk-in";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (data: UpdateWalkInStatusRequest) => {
    if (!selectedWalkIn) return;
    setIsSubmitting(true);
    try {
      await updateWalkInStatus(selectedWalkIn.id, data);
      addToast("Status updated successfully", "success");
      fetchData();
      setIsStatusModalOpen(false);
      setSelectedWalkIn(null);
      setStatusAction(null);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update status";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToAppointment = async (data: ConvertToAppointmentRequest) => {
    if (!selectedWalkIn) return;
    setIsSubmitting(true);
    try {
      const result = await convertWalkInToAppointment(selectedWalkIn.id, data);
      addToast(result.message || "Converted to appointment", "success");
      fetchData();
      setIsConvertModalOpen(false);
      setSelectedWalkIn(null);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to convert to appointment";
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStatusModal = (walkIn: WalkIn, action: WalkInStatus) => {
    setSelectedWalkIn(walkIn);
    setStatusAction(action);
    setIsStatusModalOpen(true);
  };

  const openConvertModal = (walkIn: WalkIn) => {
    setSelectedWalkIn(walkIn);
    setIsConvertModalOpen(true);
  };

  const handleSearch = () => {
    const searchValue = searchRef.current?.value || "";
    setSearchQuery(searchValue);
    setPage(1);
  };

  // Stats (only for today)
  const waitingCount = walkIns.filter((w) => w.displayStatus === "WAITING").length;
  const inProgressCount = walkIns.filter((w) => w.displayStatus === "IN_PROGRESS").length;
  const completedCount = walkIns.filter((w) => w.displayStatus === "COMPLETED").length;
  const cancelledCount = walkIns.filter((w) => w.displayStatus === "CANCELLED").length;

  // Status tabs
  const statusTabs = [
    { key: "", label: "All" },
    { key: "WAITING", label: "Waiting" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk-in Queue</h1>
          <p className="text-sm text-gray-500">{branchName}</p>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BCD4] rounded-lg text-sm font-medium text-white hover:bg-[#00A5BA] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Register Walk-in
        </button>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              dateFilter === "today"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              dateFilter === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All History
          </button>
        </div>
        
        {dateFilter === "today" && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Auto-refreshes every 30 seconds
          </p>
        )}
      </div>

      {/* Stats Cards - Only show for today view */}
      {dateFilter === "today" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{waitingCount}</p>
                <p className="text-xs text-gray-500">Waiting</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Play className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name or token..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
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

        {/* Status Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key as WalkInStatus | "");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading && walkIns.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#00BCD4]" />
        </div>
      ) : walkIns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No walk-ins today
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Register a new walk-in patient to get started
          </p>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BCD4] rounded-lg text-sm font-medium text-white hover:bg-[#00A5BA] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Register Walk-in
          </button>
        </div>
      ) : (
        /* Queue Table */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wait Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {walkIns.map((walkIn) => (
                  <tr key={walkIn.id} className="hover:bg-gray-50">
                    {/* Token */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-[#00BCD4] text-white font-bold rounded-lg text-sm">
                        {walkIn.tokenNumber}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {walkIn.patient.user.firstName}{" "}
                          {walkIn.patient.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {walkIn.patient.user.phone || "No phone"}
                        </p>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          Dr. {walkIn.doctor.firstName} {walkIn.doctor.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {walkIn.doctor.specialization}
                        </p>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">
                        {walkIn.service.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {walkIn.service.duration} min
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          walkIn.displayStatus
                        )}`}
                      >
                        {walkIn.displayStatus.replace("_", " ")}
                      </span>
                    </td>

                    {/* Wait Time */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getWaitTimeColor(
                          walkIn.waitTime
                        )}`}
                      >
                        {formatWaitTime(walkIn.waitTime)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {walkIn.displayStatus === "WAITING" && (
                          <>
                            <button
                              onClick={() =>
                                openStatusModal(walkIn, "IN_PROGRESS")
                              }
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                              title="Start Treatment"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConvertModal(walkIn)}
                              className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded"
                              title="Convert to Appointment"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                openStatusModal(walkIn, "CANCELLED")
                              }
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {walkIn.displayStatus === "IN_PROGRESS" && (
                          <>
                            <button
                              onClick={() =>
                                openStatusModal(walkIn, "COMPLETED")
                              }
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                openStatusModal(walkIn, "CANCELLED")
                              }
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {walkIn.displayStatus === "COMPLETED" && (
                          <span className="text-xs text-gray-400">Done</span>
                        )}
                        {walkIn.displayStatus === "CANCELLED" && (
                          <span className="text-xs text-gray-400">
                            Cancelled
                          </span>
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
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <RegisterWalkInModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleRegisterWalkIn}
        doctors={doctors}
        services={services}
        isLoading={isSubmitting}
      />

      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedWalkIn(null);
          setStatusAction(null);
        }}
        onSubmit={handleUpdateStatus}
        walkIn={selectedWalkIn}
        action={statusAction}
        doctors={doctors}
        isLoading={isSubmitting}
      />

      <ConvertToAppointmentModal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setSelectedWalkIn(null);
        }}
        onSubmit={handleConvertToAppointment}
        walkIn={selectedWalkIn}
        doctors={doctors}
        isLoading={isSubmitting}
      />
    </div>
  );
}
