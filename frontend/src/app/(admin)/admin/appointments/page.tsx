"use client";

import { useEffect, useState, useCallback } from "react";
import { branchesApi, appointmentsApi as adminAppointmentsApi } from "@/lib/api";
import { doctorsApi } from "@/lib/api/doctors.api";
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
  ArrowUpDown,
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
    user: { firstName: string; lastName: string; email: string; phone: string };
  };
  doctor: { id: string; firstName: string; lastName: string; specialization: string };
  branch: { id: string; name: string };
  service: { id: string; name: string; duration: number; price: number };
}

interface PaginationMeta { total: number; page: number; limit: number; totalPages: number; }
interface BranchOption { id: string; name: string; }
interface DoctorOption { id: string; firstName: string; lastName: string; branchId?: string; }

const statusTabs: { value: AppointmentStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

const STATUS_COLORS: Record<string, "warning" | "success" | "info" | "error" | "secondary"> = {
  CONFIRMED: "info", COMPLETED: "success", CANCELLED: "error", NO_SHOW: "secondary",
};

const ORDER_OPTIONS = [
  { value: "appointmentDate_desc", label: "Date: Newest First" },
  { value: "appointmentDate_asc", label: "Date: Oldest First" },
  { value: "createdAt_desc", label: "Created: Newest First" },
];

interface ConfirmState { open: boolean; title: string; message: string; onConfirm: () => void; }

export default function AdminAppointmentsPage() {
  const { addToast } = useUIStore();

  // Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<AppointmentStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState(""); // controlled input, committed on Enter/button
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderBy, setOrderBy] = useState("appointmentDate_desc");

  // Options
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorOption[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorOption[]>([]);

  // Confirm dialog
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Load branches and all doctors once on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [branchesRes, doctorsRes] = await Promise.all([
          branchesApi.getAll(),
          doctorsApi.getAll({ limit: 200 }),
        ]);

        // Backend wraps lists as { success, data: { data: [...], meta } }
        // axios gives us res.data = the body, so the array is at res.data.data.data
        const branchBody: any = branchesRes.data;
        const branchList: BranchOption[] =
          Array.isArray(branchBody?.data?.data) ? branchBody.data.data :
          Array.isArray(branchBody?.data) ? branchBody.data :
          Array.isArray(branchBody) ? branchBody : [];
        setBranches(branchList);

        const doctorBody: any = doctorsRes.data;
        const docList: DoctorOption[] =
          Array.isArray(doctorBody?.data?.data) ? doctorBody.data.data :
          Array.isArray(doctorBody?.data) ? doctorBody.data :
          Array.isArray(doctorBody) ? doctorBody : [];
        setAllDoctors(docList);
        setFilteredDoctors(docList);
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };
    loadOptions();
  }, []);

  // When branch changes: reset doctor & fetch that branch's doctors
  useEffect(() => {
    setSelectedDoctor("");
    if (!selectedBranch) {
      setFilteredDoctors(allDoctors);
      return;
    }
    // Use the dedicated endpoint: GET /branches/:id/doctors
    const fetchBranchDoctors = async () => {
      try {
        const res = await branchesApi.getDoctors(selectedBranch);
        const body: any = res.data;
        const docs: DoctorOption[] =
          Array.isArray(body?.data?.data) ? body.data.data :
          Array.isArray(body?.data) ? body.data :
          Array.isArray(body) ? body : [];
        setFilteredDoctors(docs);
      } catch {
        setFilteredDoctors([]);
      }
    };
    fetchBranchDoctors();
  }, [selectedBranch, allDoctors]);

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
        orderBy,
        page: meta.page,
        limit: meta.limit,
      });

      const raw: any = response.data;
      // Backend: { success, data: { data: [...], meta } }  ← two levels of wrapping
      const body = raw?.data ?? raw; // unwrap outer { data: ... }
      if (body?.data && Array.isArray(body.data)) {
        setAppointments(body.data);
        setMeta(prev => ({
          ...prev,
          ...(body.meta ?? {}),
        }));
      } else if (Array.isArray(body)) {
        setAppointments(body);
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      addToast(getErrorMessage(err) || "Failed to load appointments", "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedBranch, selectedDoctor, startDate, endDate, searchQuery, orderBy, meta.page, meta.limit, addToast]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Helpers ──────────────────────────────────────────────────────
  const commitSearch = () => {
    setSearchQuery(searchInput);
    setMeta(p => ({ ...p, page: 1 }));
  };

  // ── Actions ──────────────────────────────────────────────────────
  const handleUpdateStatus = (appointment: Appointment, status: "COMPLETED" | "NO_SHOW" | "CANCELLED") => {
    const labels: Record<string, string> = { COMPLETED: "mark as Completed", NO_SHOW: "mark as No Show", CANCELLED: "cancel" };
    setConfirm({
      open: true,
      title: `Confirm ${labels[status]}`,
      message: `Are you sure you want to ${labels[status]} the appointment for ${appointment.patient.user.firstName} ${appointment.patient.user.lastName}?`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        setIsActionLoading(appointment.id);
        try {
          await appointmentsApi.updateStatus(appointment.id, { status });
          addToast("Status updated successfully", "success");
          fetchAppointments();
        } catch (err: any) {
          addToast(getErrorMessage(err) || "Failed to update status", "error");
        } finally { setIsActionLoading(null); }
      },
    });
  };

  const handleDelete = (appointment: Appointment) => {
    setConfirm({
      open: true,
      title: "Delete Appointment",
      message: `Permanently delete the appointment for ${appointment.patient.user.firstName} ${appointment.patient.user.lastName}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(c => ({ ...c, open: false }));
        setIsActionLoading(appointment.id);
        try {
          await adminAppointmentsApi.delete(appointment.id);
          addToast("Appointment deleted", "success");
          fetchAppointments();
        } catch (err: any) {
          addToast(getErrorMessage(err) || "Failed to delete appointment", "error");
        } finally { setIsActionLoading(null); }
      },
    });
  };

  const clearFilters = () => {
    setSearchInput(""); setSearchQuery(""); setSelectedBranch(""); setSelectedDoctor("");
    setStartDate(""); setEndDate(""); setOrderBy("appointmentDate_desc");
    setMeta(p => ({ ...p, page: 1 }));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const formatPrice = (price: number) => Number(price).toLocaleString("en-US") + " MMK";

  const hasFilters = searchQuery || selectedBranch || selectedDoctor || startDate || endDate || orderBy !== "appointmentDate_desc";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">Manage all appointments across all branches</p>
        </div>
        <button
          onClick={fetchAppointments} disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {statusTabs.map((tab) => (
          <button key={tab.value}
            onClick={() => { setActiveTab(tab.value); setMeta(p => ({ ...p, page: 1 })); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.value ? "bg-[#00BCD4] text-white shadow" : "text-gray-600 hover:bg-gray-200"
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        {/* Row 1: Search + Order By */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient name, phone or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitSearch(); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              />
            </div>
            <button
              onClick={commitSearch}
              className="px-3 py-2 bg-[#00BCD4] text-white rounded-lg text-sm hover:bg-[#00A5BA] transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>

          {/* Order By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={orderBy}
              onChange={(e) => { setOrderBy(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            >
              {ORDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Branch → Doctor → Date Range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch (comes first) */}
          <select
            value={selectedBranch}
            onChange={(e) => { setSelectedBranch(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Doctor (disabled until branch is selected; shows all if no branch) */}
          <select
            value={selectedDoctor}
            onChange={(e) => { setSelectedDoctor(e.target.value); setMeta(p => ({ ...p, page: 1 })); }}
            disabled={!selectedBranch}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4] transition-opacity ${!selectedBranch ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
            title={!selectedBranch ? "Select a branch first to filter by doctor" : ""}
          >
            <option value="">{selectedBranch ? "All Doctors (this branch)" : "Select branch first"}</option>
            {selectedBranch && filteredDoctors.map(d => (
              <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
            ))}
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

          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>Clear All</Button>
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
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00BCD4]" />
                  <p className="mt-2 text-sm text-gray-500">Loading appointments...</p>
                </td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No appointments found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </td></tr>
              ) : (
                appointments.map((apt) => {
                  const isActioning = isActionLoading === apt.id;
                  return (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#00BCD4]/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-[#00BCD4]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{apt.patient.user.firstName} {apt.patient.user.lastName}</p>
                            <p className="text-xs text-gray-500">{apt.patient.user.phone || apt.patient.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{apt.service.name}</p>
                        <p className="text-xs text-gray-500">{apt.service.duration} min</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Dr. {apt.doctor.firstName} {apt.doctor.lastName}</p>
                            <p className="text-xs text-gray-500">{apt.doctor.specialization}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-900">{apt.branch.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatDate(apt.appointmentDate)}</p>
                            <p className="text-xs text-gray-500">{apt.startTime} – {apt.endTime}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_COLORS[apt.status] || "secondary"} size="sm">
                          {apt.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm font-semibold ${
                          apt.status === "COMPLETED" ? "text-green-600"
                          : apt.status === "CANCELLED" || apt.status === "NO_SHOW" ? "text-gray-400 line-through"
                          : "text-gray-700"
                        }`}>{formatPrice(apt.service.price)}</p>
                        <p className="text-xs text-gray-400">
                          {apt.status === "COMPLETED" ? "Earned"
                          : apt.status === "CANCELLED" || apt.status === "NO_SHOW" ? "Lost" : "Expected"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isActioning ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <>
                              {apt.status === "CONFIRMED" && (
                                <>
                                  <button onClick={() => handleUpdateStatus(apt, "COMPLETED")}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Mark Completed">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleUpdateStatus(apt, "NO_SHOW")}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Mark No Show">
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleUpdateStatus(apt, "CANCELLED")}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Cancel">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDelete(apt)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete permanently">
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
              <button onClick={() => setMeta(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={meta.page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {meta.page} of {meta.totalPages}</span>
              <button onClick={() => setMeta(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={meta.page === meta.totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
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
              <button onClick={() => setConfirm(c => ({ ...c, open: false }))}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirm.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
