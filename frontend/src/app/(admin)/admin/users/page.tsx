"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usersApi, User, UserQuery, UserRole } from "@/lib/api/users.api";
import { useUIStore } from "@/stores";
import { Button, Input, Badge } from "@/components/ui";
import {
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  KeyRound,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  BRANCH_MANAGER: "Branch Manager",
  PATIENT: "Patient",
};

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  BRANCH_MANAGER: "bg-blue-100 text-blue-700",
  PATIENT: "bg-green-100 text-green-700",
};

export default function UsersPage() {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [users, setUsers] = useState<User[]>([]);
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
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");

  // Use refs to always get current values in fetchUsers
  const pageRef = useRef(1);
  const limitRef = useRef(10);
  const statusRef = useRef<"all" | "active" | "inactive">("all");
  const searchRef = useRef("");
  const roleRef = useRef<UserRole | "">("");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query: UserQuery = {
        page: pageRef.current,
        limit: limitRef.current,
        status: statusRef.current,
      };

      if (searchRef.current.trim()) {
        query.search = searchRef.current.trim();
      }

      if (roleRef.current) {
        query.role = roleRef.current;
      }

      const response = await usersApi.getAll(query);
      // TransformInterceptor wraps: { success, data: { data: [], meta: {} } }
      const payload = (response.data as any)?.data;
      const usersData = Array.isArray(payload?.data) ? payload.data : [];
      const metaData = payload?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 };

      setUsers(usersData);
      setMeta(metaData);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Unauthorized - Please login");
        addToast("Please login to view users", "error");
        router.push("/login");
      } else if (err.response?.status === 403) {
        setError("Access denied - Admin permissions required");
        addToast("Admin access required", "error");
      } else {
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to load users";
        setError(errorMessage);
        addToast(errorMessage, "error");
      }

      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [addToast, router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pageRef.current = 1;
    searchRef.current = searchQuery;
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleStatusChange = (status: "all" | "active" | "inactive") => {
    statusRef.current = status;
    pageRef.current = 1;
    setStatusFilter(status);
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleRoleChange = (role: UserRole | "") => {
    roleRef.current = role;
    pageRef.current = 1;
    setRoleFilter(role);
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      pageRef.current = newPage;
      setMeta((prev) => ({ ...prev, page: newPage }));
      fetchUsers();
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.isActive;
    const action = newStatus ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} "${user.firstName} ${user.lastName}"?`)) {
      return;
    }

    try {
      await usersApi.changeStatus(user.id, newStatus);
      addToast(`User ${action}d successfully`, "success");
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || getErrorMessage(error);
      addToast(errorMessage, "error");
    }
  };

  const getUserName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage system users</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading users</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value as UserRole | "")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="PATIENT">Patient</option>
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

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00BCD4]" />
                    <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                  </td>
                </tr>
              ) : !Array.isArray(users) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                    <p>Error: Users data is not an array</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No users found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery || roleFilter || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Users will appear here"}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-[#00BCD4]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(user)}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          roleColors[user.role]
                        }`}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.branch?.name || (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.isActive ? "success" : "secondary"} size="sm">
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-[#00BCD4] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 transition-colors ${
                            user.isActive
                              ? "text-gray-400 hover:text-red-500"
                              : "text-gray-400 hover:text-green-500"
                          }`}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          <KeyRound className="w-4 h-4" />
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
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} users
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
