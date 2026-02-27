"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores";
import { doctorsApi, Doctor } from "@/lib/api/doctors.api";
import {
  Search,
  Loader2,
  UserRound,
  Mail,
  Phone,
  Stethoscope,
  Calendar,
} from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function BranchManagerDoctorsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const branchId = user?.branchId || user?.branchManager?.branchId;
  const branchName = user?.branchManager?.branch?.name || "Your Branch";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDoctors = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const response = await doctorsApi.getAll({
        branchId,
        status: "active",
        limit: 100,
      });
      
      // Handle response wrapping
      const payload = (response.data as any)?.data;
      const doctorsData = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setDoctors(doctorsData);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      addToast("Failed to load doctors", "error");
    } finally {
      setIsLoading(false);
    }
  }, [branchId, addToast]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Filter doctors by search
  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doctor.firstName.toLowerCase().includes(query) ||
      doctor.lastName.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query) ||
      doctor.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500">{branchName}</p>
          <p className="text-xs text-gray-400 mt-1">
            View doctors working at your branch
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#00BCD4]" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UserRound className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery ? "Try adjusting your search" : "No doctors assigned to this branch yet"}
          </p>
        </div>
      ) : (
        /* Doctors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              {/* Doctor Header */}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-[#00BCD4]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-[#00BCD4]">
                    {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h3>
                  <p className="text-sm text-[#00BCD4] font-medium">
                    {doctor.specialization}
                  </p>
                  <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    doctor.isActive 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {doctor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="mt-4 space-y-2">
                {doctor.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                )}
                {doctor.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{doctor.phone}</span>
                  </div>
                )}
              </div>

              {/* Schedule Preview */}
              {doctor.schedules && doctor.schedules.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Schedule</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {doctor.schedules.slice(0, 3).map((schedule) => (
                      <span
                        key={schedule.id}
                        className="inline-flex px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {DAY_NAMES[schedule.dayOfWeek].slice(0, 3)} {schedule.startTime}
                      </span>
                    ))}
                    {doctor.schedules.length > 3 && (
                      <span className="inline-flex px-2 py-0.5 text-xs text-gray-500">
                        +{doctor.schedules.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
