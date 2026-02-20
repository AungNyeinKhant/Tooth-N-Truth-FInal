"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
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

export default function ServicesPage() {
  const { addToast } = useUIStore();

  const [services, setServices] = useState<Service[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Use refs for values that shouldn't trigger re-renders in useCallback
  const searchRef = useRef("");
  const statusRef = useRef<"all" | "active" | "inactive">("all");
  const pageRef = useRef(1);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: ServiceQuery = {
        search: searchRef.current || undefined,
        status: statusRef.current,
        page: pageRef.current,
        limit: 10,
      };

      const response = await servicesApi.getAll(query);

      // Backend response format: { data: [...], meta: {...} }
      // Access via response.data.data for the array, response.data.meta for pagination
      const servicesData = response.data.data || [];
      const metaData = response.data.meta || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      setServices(Array.isArray(servicesData) ? servicesData : []);
      var serviceTest = Array.isArray(servicesData) ? servicesData : [];
      console.log("Fetched services:", typeof servicesData);
      setMeta(metaData);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      addToast(getErrorMessage(error), "error");
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await servicesApi.delete(id);
      addToast("Service deleted successfully", "success");
      fetchServices();
    } catch (error) {
      console.error("Failed to delete service:", error);
      addToast(getErrorMessage(error), "error");
    }
  };

  const handleSearch = () => {
    searchRef.current = searchQuery;
    pageRef.current = 1;
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchServices();
  };

  const handleStatusChange = (status: "all" | "active" | "inactive") => {
    statusRef.current = status;
    setStatusFilter(status);
    pageRef.current = 1;
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
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Services</h1>
          <p className='text-sm text-gray-500'>Manage dental clinic services</p>
        </div>
        <Link href='/admin/services/new'>
          <Button className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Add Service
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex-1 flex gap-2'>
          <Input
            placeholder='Search services...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className='max-w-sm'
          />
          <Button variant='outline' onClick={handleSearch}>
            <Search className='w-4 h-4' />
          </Button>
        </div>
        <div className='flex gap-2'>
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-[#00BCD4] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
        {isLoading ? (
          <div className='flex items-center justify-center h-64'>
            <Loader2 className='w-8 h-8 animate-spin text-[#00BCD4]' />
          </div>
        ) : services.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 text-center'>
            <Stethoscope className='w-12 h-12 text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900'>
              No services found
            </h3>
            <p className='text-sm text-gray-500 mt-1'>
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first service"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link href='/admin/services/new' className='mt-4'>
                <Button variant='outline' className='flex items-center gap-2'>
                  <Plus className='w-4 h-4' />
                  Add Service
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-100'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Service Name
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Duration
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Price (MMK)
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {services.map((service) => (
                  <tr
                    key={service.id}
                    className='hover:bg-gray-50/50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {service.name}
                        </p>
                        {service.description && (
                          <p className='text-sm text-gray-500 line-clamp-1'>
                            {service.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-700'>
                        {service.duration} min
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm font-medium text-gray-900'>
                        {formatPrice(service.price)}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge
                        variant={service.isActive ? "success" : "secondary"}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className='p-2 text-gray-400 hover:text-[#00BCD4] transition-colors'
                          title='Edit'
                        >
                          <Edit2 className='w-4 h-4' />
                        </Link>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className='p-2 text-gray-400 hover:text-red-500 transition-colors'
                          title='Delete'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && services.length > 0 && (
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-100'>
            <p className='text-sm text-gray-600'>
              Showing {(meta.page - 1) * meta.limit + 1} to{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
              services
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={meta.page === 1}
                className='p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <span className='text-sm text-gray-600'>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={meta.page === meta.totalPages}
                className='p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                <ChevronRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
