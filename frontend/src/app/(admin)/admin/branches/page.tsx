"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { branchesApi } from "@/lib/api/branches.api";
import { useUIStore } from "@/stores";
import { Branch, BranchQuery, PaginationMeta } from "@/types";
import { Button, Input, Badge } from "@/components/ui";
import { DeleteBranchModal } from "./components/delete-branch-modal";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function BranchesPage() {
  const router = useRouter();
  const { addToast } = useUIStore();

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

  // Delete modal state
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchBranches = useCallback(async () => {
    console.log('[Branches] Starting fetch...');
    setIsLoading(true);
    setError(null);
    
    try {
      const query: BranchQuery = {
        page: meta.page,
        limit: meta.limit,
        status: statusFilter,
      };

      if (searchQuery.trim()) {
        query.search = searchQuery.trim();
      }

      console.log('[Branches] Query:', query);
      const response = await branchesApi.getAll(query);
      
      console.log('[Branches] Full response:', response);
      console.log('[Branches] Response data:', response.data);
      console.log('[Branches] Response data type:', typeof response.data);

      // Handle different response structures
      let responseData = response.data;
      
      // If data is wrapped in a data property (common NestJS pattern)
      if (responseData && typeof responseData === 'object' && 'data' in responseData && !Array.isArray(responseData.data)) {
        responseData = responseData.data;
      }
      
      console.log('[Branches] Processed responseData:', responseData);

      // Validate response structure
      if (!responseData) {
        console.error('[Branches] No response data');
        setError('No data received from server');
        setBranches([]);
        return;
      }

      // Check if response has the expected structure
      let branchesData: Branch[] = [];
      let metaData: PaginationMeta | null = null;

      if (Array.isArray(responseData)) {
        // API returned array directly (old format)
        console.log('[Branches] Response is array, using directly');
        branchesData = responseData;
        metaData = {
          total: responseData.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // API returned { data: [...], meta: {...} }
        console.log('[Branches] Response has data property');
        branchesData = responseData.data;
        metaData = responseData.meta || {
          total: branchesData.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
      } else {
        console.error('[Branches] Unexpected response format:', responseData);
        setError('Invalid data format received from server');
        setBranches([]);
        return;
      }

      console.log('[Branches] Branches data:', branchesData);
      console.log('[Branches] Meta data:', metaData);
      console.log('[Branches] Number of branches:', branchesData.length);

      setBranches(branchesData);
      setMeta(metaData);
      
    } catch (err: any) {
      console.error('[Branches] Error fetching branches:', err);
      console.error('[Branches] Error response:', err.response);
      console.error('[Branches] Error status:', err.response?.status);
      console.error('[Branches] Error data:', err.response?.data);
      
      if (err.response?.status === 401) {
        setError('Unauthorized - Please login');
        addToast("Please login to view branches", "error");
        router.push("/login");
      } else if (err.response?.status === 403) {
        setError('Access denied - Admin permissions required');
        addToast("Admin access required", "error");
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load branches';
        setError(errorMessage);
        addToast(errorMessage, "error");
      }
      
      setBranches([]);
    } finally {
      setIsLoading(false);
      console.log('[Branches] Fetch complete');
    }
  }, [meta.page, meta.limit, statusFilter, searchQuery, addToast, router]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchBranches();
  };

  const openDeleteModal = (branch: Branch) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBranchToDelete(null);
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;

    try {
      await branchesApi.delete(branchToDelete.id);
      addToast("Branch and manager deleted successfully", "success");
      fetchBranches();
    } catch (error: any) {
      console.error("Failed to delete branch:", error);
      // Error is handled in the modal component
      throw error;
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setMeta((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getManagerName = (branch: Branch) => {
    if (branch.managers && branch.managers.length > 0) {
      const manager = branch.managers[0].user;
      return `${manager.firstName} ${manager.lastName}`;
    }
    return "Not assigned";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500">Manage clinic locations</p>
        </div>
        <Link href="/admin/branches/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Branch
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading branches</p>
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
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "inactive");
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono">
          <p><strong>Debug Info:</strong></p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {error || 'None'}</p>
          <p>Branches count: {Array.isArray(branches) ? branches.length : 'Invalid'}</p>
          <p>Total in meta: {meta.total}</p>
          <p>Page: {meta.page}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
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
                    <p className="mt-2 text-sm text-gray-500">Loading branches...</p>
                  </td>
                </tr>
              ) : !Array.isArray(branches) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                    <p>Error: Branches data is not an array</p>
                    <p className="text-sm">Check console for details</p>
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No branches found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "Get started by adding a new branch"}
                    </p>
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-[#00BCD4]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {branch.name}
                          </div>
                          {branch.email && (
                            <div className="text-sm text-gray-500">
                              {branch.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {branch.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{branch.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getManagerName(branch)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={branch.isActive ? "success" : "secondary"}
                        size="sm"
                      >
                        {branch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/branches/${branch.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-[#00BCD4] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(branch)}
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
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} branches
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

      {/* Delete Branch Modal */}
      <DeleteBranchModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        branch={branchToDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
