"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doctorsApi, Doctor, DoctorQuery } from "@/lib/api/doctors.api";
import { branchesApi } from "@/lib/api/branches.api";
import { useUIStore } from "@/stores";
import { Button, Input, Badge } from "@/components/ui";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserRound,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Branch {
  id: string;
  name: string;
}

export default function DoctorsPage() {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [branchFilter, setBranchFilter] = useState<string>("");

  // Use refs to always get current values in fetchDoctors
  const pageRef = useRef(1);
  const limitRef = useRef(10);
  const statusRef = useRef<"all" | "active" | "inactive">("all");
  const searchRef = useRef("");
  const branchRef = useRef("");

  const fetchBranches = useCallback(async () => {
    console.log('[Doctors] Fetching branches...');
    try {
      const response = await branchesApi.getAll({ status: "active", limit: 100 });
      console.log('[Doctors] Branches response:', response.data);
      
      // Handle different response structures (same pattern as branches page)
      let responseData = response.data;
      
      // If data is wrapped in a data property (common NestJS pattern)
      if (responseData && typeof responseData === 'object' && 'data' in responseData && !Array.isArray(responseData.data)) {
        responseData = responseData.data;
      }
      
      let branchesData: Branch[] = [];
      
      if (Array.isArray(responseData)) {
        branchesData = responseData;
      } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        branchesData = responseData.data;
      }
      
      console.log('[Doctors] Branches data:', branchesData);
      setBranches(branchesData);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    console.log('[Doctors] Starting fetch...');
    setIsLoading(true);
    setError(null);
    
    try {
      const query: DoctorQuery = {
        page: pageRef.current,
        limit: limitRef.current,
        status: statusRef.current,
      };

      if (searchRef.current.trim()) {
        query.search = searchRef.current.trim();
      }

      if (branchRef.current) {
        query.branchId = branchRef.current;
      }

      console.log('[Doctors] Query:', query);
      const response = await doctorsApi.getAll(query);
      
      console.log('[Doctors] Full response:', response);
      console.log('[Doctors] Response data:', response.data);
      console.log('[Doctors] Response data type:', typeof response.data);

      // Handle different response structures (same pattern as branches)
      let responseData = response.data;
      
      // If data is wrapped in a data property (common NestJS pattern)
      if (responseData && typeof responseData === 'object' && 'data' in responseData && !Array.isArray(responseData.data)) {
        responseData = responseData.data;
      }
      
      console.log('[Doctors] Processed responseData:', responseData);

      // Validate response structure
      if (!responseData) {
        console.error('[Doctors] No response data');
        setError('No data received from server');
        setDoctors([]);
        return;
      }

      // Check if response has the expected structure
      let doctorsData: Doctor[] = [];
      let metaData: PaginationMeta | null = null;

      if (Array.isArray(responseData)) {
        // API returned array directly (old format)
        console.log('[Doctors] Response is array, using directly');
        doctorsData = responseData;
        metaData = {
          total: responseData.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // API returned { data: [...], meta: {...} }
        console.log('[Doctors] Response has data property');
        doctorsData = responseData.data;
        metaData = responseData.meta || {
          total: doctorsData.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
      } else {
        console.error('[Doctors] Unexpected response format:', responseData);
        setError('Invalid data format received from server');
        setDoctors([]);
        return;
      }

      console.log('[Doctors] Doctors data:', doctorsData);
      console.log('[Doctors] Meta data:', metaData);
      console.log('[Doctors] Number of doctors:', doctorsData.length);

      setDoctors(doctorsData);
      setMeta(metaData);
      
    } catch (err: any) {
      console.error('[Doctors] Error fetching doctors:', err);
      console.error('[Doctors] Error response:', err.response);
      console.error('[Doctors] Error status:', err.response?.status);
      console.error('[Doctors] Error data:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Unauthorized - Please login');
        addToast("Please login to view doctors", "error");
        router.push("/login");
      } else if (err.response?.status === 403) {
        setError('Access denied - Admin permissions required');
        addToast("Admin access required", "error");
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load doctors';
        setError(errorMessage);
        addToast(errorMessage, "error");
      }
      
      setDoctors([]);
    } finally {
      setIsLoading(false);
      console.log('[Doctors] Fetch complete');
    }
  }, [addToast, router]);

  // Initial fetch on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pageRef.current = 1;
    searchRef.current = searchQuery;
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchDoctors();
  };

  const handleDelete = async (id: string, name: string) => {
    console.log('[Doctors] Delete clicked for:', id, name);
    
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      console.log('[Doctors] Delete cancelled by user');
      return;
    }

    console.log('[Doctors] Proceeding with delete for:', id);
    
    try {
      const response = await doctorsApi.delete(id);
      console.log('[Doctors] Delete response:', response);
      addToast("Doctor deleted successfully", "success");
      fetchDoctors();
    } catch (error: any) {
      console.error("[Doctors] Delete failed:", error);
      console.error("[Doctors] Error response:", error.response);
      console.error("[Doctors] Error status:", error.response?.status);
      console.error("[Doctors] Error data:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || getErrorMessage(error);
      addToast(errorMessage, "error");
    }
  };

  const handleStatusChange = (status: "all" | "active" | "inactive") => {
    statusRef.current = status;
    pageRef.current = 1;
    setStatusFilter(status);
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchDoctors();
  };

  const handleBranchChange = (branchId: string) => {
    branchRef.current = branchId;
    pageRef.current = 1;
    setBranchFilter(branchId);
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchDoctors();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      pageRef.current = newPage;
      setMeta((prev) => ({ ...prev, page: newPage }));
      fetchDoctors();
    }
  };

  const getDoctorName = (doctor: Doctor) => {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500">Manage healthcare professionals</p>
        </div>
        <Link href="/admin/doctors/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Doctor
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading doctors</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1">Check browser console for details</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Branch:</label>
            <select
              value={branchFilter}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as "all" | "active" | "inactive")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono">
          <p><strong>Debug Info:</strong></p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {error || 'None'}</p>
          <p>Doctors count: {Array.isArray(doctors) ? doctors.length : 'Invalid'}</p>
          <p>Total in meta: {meta.total}</p>
          <p>Page: {meta.page}</p>
        </div>
      )}

      {/* Doctors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00BCD4]" />
                    <p className="mt-2 text-sm text-gray-500">Loading doctors...</p>
                  </td>
                </tr>
              ) : !Array.isArray(doctors) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                    <p>Error: Doctors data is not an array</p>
                    <p className="text-sm">Check console for details</p>
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <UserRound className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No doctors found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery || branchFilter || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Get started by adding a new doctor"}
                    </p>
                    {!searchQuery && !branchFilter && statusFilter === "all" && (
                      <Link href="/admin/doctors/new" className="mt-4 inline-block">
                        <Button variant="outline" className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add Doctor
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                          <UserRound className="h-5 w-5 text-[#00BCD4]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getDoctorName(doctor)}
                          </div>
                          {doctor.email && (
                            <div className="text-sm text-gray-500">
                              {doctor.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doctor.specialization}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doctor.branch?.name || "Not assigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doctor.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={doctor.isActive ? "success" : "secondary"}
                        size="sm"
                      >
                        {doctor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/doctors/${doctor.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-[#00BCD4] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id, getDoctorName(doctor))}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(meta.page - 1) * meta.limit + 1} to{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} doctors
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page === meta.totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
