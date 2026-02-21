"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { servicesApi, Service, ServiceQuery } from "@/lib/api/services.api";
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
  Stethoscope,
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ServicesPage() {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [services, setServices] = useState<Service[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Use refs to always get current values in fetchServices
  const pageRef = useRef(1);
  const limitRef = useRef(10);
  const statusRef = useRef<"all" | "active" | "inactive">("all");
  const searchRef = useRef("");

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query: ServiceQuery = {
        page: pageRef.current,
        limit: limitRef.current,
        status: statusRef.current,
      };

      if (searchRef.current.trim()) {
        query.search = searchRef.current.trim();
      }

      const response = await servicesApi.getAll(query);
      // TransformInterceptor wraps: { success, data: { data: [], meta: {} } }
      const payload = (response.data as any)?.data;
      const servicesData = Array.isArray(payload?.data) ? payload.data : [];
      const metaData = payload?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 };

      setServices(servicesData);
      setMeta(metaData);
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Unauthorized - Please login');
        addToast("Please login to view services", "error");
        router.push("/login");
      } else if (err.response?.status === 403) {
        setError('Access denied - Admin permissions required');
        addToast("Admin access required", "error");
      } else {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        addToast(errorMessage, "error");
      }
      
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [addToast, router]);

  // Initial fetch on mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pageRef.current = 1;
    searchRef.current = searchQuery;
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchServices();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await servicesApi.delete(id);
      addToast("Service deleted successfully", "success");
      fetchServices();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || getErrorMessage(error);
      addToast(errorMessage, "error");
    }
  };

  const handleStatusChange = (status: "all" | "active" | "inactive") => {
    statusRef.current = status;
    pageRef.current = 1;
    setStatusFilter(status);
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchServices();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      pageRef.current = newPage;
      setMeta((prev) => ({ ...prev, page: newPage }));
      fetchServices();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US").format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500">Manage dental clinic services</p>
        </div>
        <Link href="/admin/services/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading services</p>
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
              placeholder="Search services..."
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
              handleStatusChange(e.target.value as "all" | "active" | "inactive");
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>


      {/* Services Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (MMK)
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
                    <p className="mt-2 text-sm text-gray-500">Loading services...</p>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Stethoscope className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No services found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "Get started by adding a new service"}
                    </p>
                    {!searchQuery && statusFilter === "all" && (
                      <Link href="/admin/services/new" className="mt-4 inline-block">
                        <Button variant="outline" className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add Service
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-[#00BCD4]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.duration} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(service.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={service.isActive ? "success" : "secondary"}
                        size="sm"
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/services/${service.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-[#00BCD4] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
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
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} services
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
