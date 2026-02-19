"use client";

import { useEffect, useState } from "react";
import { analyticsApi, branchesApi, doctorsApi } from "@/lib/api";
import { Card } from "@/components/ui";
import {
  Building2,
  Stethoscope,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
  Clock,
} from "lucide-react";

interface DashboardStats {
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointmentsToday: number;
}

interface BranchStats {
  id: string;
  name: string;
  doctorCount: number;
  appointmentCount: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointmentsToday: 0,
  });
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch admin stats
        const statsRes = await analyticsApi.getAdminStats();
        let data: any = statsRes.data;
        if (data && typeof data === 'object' && 'data' in data) {
          data = (data as any).data;
        }
        setStats({
          totalBranches: data.totalBranches ?? 0,
          totalDoctors: data.totalDoctors ?? 0,
          totalPatients: data.totalPatients ?? 0,
          totalAppointmentsToday: data.totalAppointmentsToday ?? 0,
        });

        // Fetch branch details for per-branch stats
        const branchesRes = await branchesApi.getAll({ status: 'active' });
        let branchesData: any = branchesRes.data;
        if (branchesData && typeof branchesData === 'object' && 'data' in branchesData && !Array.isArray(branchesData)) {
          branchesData = (branchesData as any).data;
        }
        
        if (Array.isArray(branchesData)) {
          const branchStatsData = branchesData.map((branch: any) => ({
            id: branch.id,
            name: branch.name,
            doctorCount: 0, // Will be populated later
            appointmentCount: 0, // Will be populated later
          }));
          setBranchStats(branchStatsData);
        }
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00BCD4]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">System-wide overview and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Branches</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBranches}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-[#00BCD4]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Doctors</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAppointmentsToday}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Overview */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Appointments Today</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.totalAppointmentsToday}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Active Patients</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.totalPatients}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Active Doctors</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.totalDoctors}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Active Branches</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.totalBranches}</span>
            </div>
          </div>
        </Card>

        {/* Branch Performance */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Overview</h2>
          {branchStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No branch data available</p>
          ) : (
            <div className="space-y-3">
              {branchStats.slice(0, 5).map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#00BCD4]" />
                    <span className="text-sm font-medium text-gray-900">{branch.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-4 h-4" />
                      {branch.doctorCount} doctors
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Coming Soon */}
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-[#00BCD4]" />
          </div>
          <h3 className="font-semibold text-gray-900">More Analytics Coming Soon</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Detailed reports, charts, and insights will be available in future updates.
            This includes revenue trends, appointment patterns, and doctor performance metrics.
          </p>
        </div>
      </Card>
    </div>
  );
}
