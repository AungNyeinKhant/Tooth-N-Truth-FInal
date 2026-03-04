"use client";

import { useEffect, useState, useCallback } from "react";
import { branchesApi, appointmentsApi as adminAppointmentsApi, doctorsApi } from "@/lib/api";
import { appointmentsApi } from "@/lib/api/appointments-manager.api";
import { useUIStore } from "@/stores";
import { Button, Badge, Input } from "@/components/ui";
import { unwrapApiResponse, getErrorMessage } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  User,
  Clock,
  Building2,
  Stethoscope,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type AppointmentStatus = "ALL" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  cancelReason?: string;
  isWalkIn: boolean;
  tokenNumber?: string | null;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  branch: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BranchOption { id: string; name: string; }
interface DoctorOption { id: string; firstName: string; lastName: string; }

const statusTabs: { value: AppointmentStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

const STATUS_COLORS: Record<string, "warning" | "success" | "info" | "error" | "secondary"> = {
  CONFIRMED: "info",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "secondary",
};

// Confirm dialog state
interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function AdminAppointmentsPage() {
  const { addToast } = useUIStore();

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null); // tracks which appointment is being actioned

  // Filters
  const [activeTab, setActiveTab] = useState<AppointmentStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Options
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  // Confirm dialog
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false, title: "", message: "", onConfirm: () => {},
  });

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [branchesRes, doctorsRes] = await Promise.all([
          branchesApi.getAll(),
          doctorsApi.getAll(),
        ]);
        const branchesData = unwrapApiResponse<BranchOption[]>(branchesRes.data);
        setBranches(Array.isArray(branchesData) ? branchesData : []);
        const doctorsData = unwrapApiResponse<DoctorOption[]>(doctorsRes.data);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };
    loadOptions();
  }, []);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminAppointmentsApi.getAdmin({
        status: activeTab === "ALL" ? undefined : activeTab,
        branchId: selectedBranch || undefined,
        doctorId: selectedDoctor || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchQuery || undefined,
        page: meta.page,
        limit: meta.limit,
      });

      const raw: any = response.data;
      // Handle { data: { data: [...], meta: {...} } } double-nesting from formatList
      const inner = raw?.data ?? raw;
      if (inner?.data && Array.isArray(inner.data)) {
        setAppointments(inner.data);
        setMeta(inner.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 });
      } else if (Array.isArray(inner)) {
        setAppointments(inner);
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      addToast(getErrorMessage(err) || "Failed to load appointments", "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedBranch, selectedDoctor, startDate, endDate, searchQuery, meta.page, meta.limit, addToast]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleUpdateStatus = (appointment: Appointment, status: "COMPLETED" | "NO_SHOW" | "CANCELLED") => {
    const labels: Record<string, string> = {
      COMPLETED: "mark as Completed",
      NO_SHOW: "mark as No Show",
      CANCELLED: "cancel",
    };
    setConfirm({
      open: true,
      title: `Confirm ${labels[status]}`,
      message: `Are you sure you want to ${labels[status]} this appointment for ${appointment.patient.user.firstName} ${appointment.patient.user.lastName}?`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        setIsActionLoading(appointment.id);
        try {
          await appointmentsApi.updateStatus(appointment.id, { status });
          addToast("Status updated successfully", "success");
          fetchAppointments();
        } catch (err: any) {
          addToast(getErrorMessage(err) || "Failed to update status", "error");
        } finally {
          setIsActionLoading(null);
        }
      },
    });
  };

  const handleDelete = (appointment: Appointment) => {
    setConfirm({
      open: true,
      title: "Delete Appointment",
      message: `Permanently delete this appointment for ${appointment.patient.user.firstName} ${appointment.patient.user.lastName}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        setIsActionLoading(appointment.id);
        try {
          await adminAppointmentsApi.delete(appointment.id);
          addToast("Appointment deleted", "success");
          fetchAppointments();
        } catch (err: any) {
          addToast(getErrorMessage(err) || "Failed to delete appointment", "error");
        } finally {
          setIsActionLoading(null);
        }
      },
    });
  };

  const clearFilters = () => {
    setSearchQuery(""); setSelectedBranch(""); setSelectedDoctor("");
    setStartDate(""); setEndDate("");
    setMeta(p => ({ ...p, page: 1 }));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const formatPrice = (price: number) =>
    Number(price).toLocaleString("en-US") + " MMK";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">Manage all appointments across all branches</p>
        </div>
        <button
          onClick={fetchAppointments}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setMeta(p => ({ ...p, page: 1 })); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.value ? "bg-[#00BCD4] text-white shadow" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search patient name or email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
              className="pl-10"
            />
          </div>

          {/* Branch */}
          <select
            value={selectedBranch}
            onChange={(e) => { setSelectedBranch(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Doctor */}
          <select
            value={selectedDoctor}
            onChange={(e) => { setSelectedDoctor(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
          >
            <option value="">All Doctors</option>
            {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            />
          </div>

          {(searchQuery || selectedBranch || selectedDoctor || startDate || endDate) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00BCD4]" />
                    <p className="mt-2 text-sm text-gray-500">Loading appointments...</p>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No appointments found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const isActioning = isActionLoading === apt.id;
                  return (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#00BCD4]/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-[#00BCD4]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {apt.patient.user.firstName} {apt.patient.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{apt.patient.user.phone || apt.patient.user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{apt.service.name}</p>
                        <p className="text-xs text-gray-500">{apt.service.duration} min</p>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{apt.doctor.specialization}</p>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-900">{apt.branch.name}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatDate(apt.appointmentDate)}</p>
                            <p className="text-xs text-gray-500">{apt.startTime} – {apt.endTime}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_COLORS[apt.status] || "secondary"} size="sm">
                          {apt.status.replace("_", " ")}
                        </Badge>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3">
                        <p className={`text-sm font-semibold ${
                          apt.status === "COMPLETED" ? "text-green-600"
                          : apt.status === "CANCELLED" || apt.status === "NO_SHOW" ? "text-gray-400 line-through"
                          : "text-gray-700"
                        }`}>
                          {formatPrice(apt.service.price)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {apt.status === "COMPLETED" ? "Earned"
                          : apt.status === "CANCELLED" || apt.status === "NO_SHOW" ? "Lost"
                          : "Expected"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isActioning ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {apt.status === "CONFIRMED" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(apt, "COMPLETED")}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Mark Completed"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(apt, "NO_SHOW")}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                    title="Mark No Show"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(apt, "CANCELLED")}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(apt)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Delete permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMeta(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={meta.page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {meta.page} of {meta.totalPages}</span>
              <button
                onClick={() => setMeta(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={meta.page === meta.totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirm.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{confirm.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirm(c => ({ ...c, open: false }))}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirm.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
