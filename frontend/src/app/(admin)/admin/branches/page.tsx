"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { branchesApi } from "@/lib/api/branches.api";
import { useUIStore } from "@/stores";
import { Branch, BranchQuery, PaginationMeta } from "@/types";
import { Button, Input, Badge } from "@/components/ui";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: BranchQuery = {
        page: meta.page,
        limit: meta.limit,
        status: statusFilter,
      };
      
      if (searchQuery.trim()) {
        query.search = searchQuery.trim();
      }

      const response = await branchesApi.getAll(query);
      setBranches(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      addToast("Failed to load branches", "error");
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.limit, statusFilter, searchQuery, addToast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchBranches();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await branchesApi.delete(id);
      addToast("Branch deleted successfully", "success");
      fetchBranches();
    } catch (error) {
      console.error("Failed to delete branch:", error);
      addToast("Failed to delete branch", "error");
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
                          onClick={() => handleDelete(branch.id, branch.name)}
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
    </div>
  );
}
