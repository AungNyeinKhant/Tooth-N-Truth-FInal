"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { analyticsApi, AdminStats, RevenueTrend, BranchAppointment, TopService } from "@/lib/api/analytics.api";
import { StatCard, StatsGrid } from "./components/stat-card";
import { RevenueTrendChart, AppointmentsByBranchChart, TopServicesChart, AppointmentStatusChart } from "@/components/charts";
import {
  Building2,
  Stethoscope,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Activity,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [branchData, setBranchData] = useState<BranchAppointment[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch main stats
        const statsResponse = await analyticsApi.getAdminStats();
        let statsData = statsResponse.data;
        if (statsData && 'data' in statsData) {
          statsData = (statsData as any).data;
        }
        setStats(statsData);

        // Fetch chart data
        setChartsLoading(true);
        try {
          const [revenueRes, branchRes, servicesRes] = await Promise.all([
            analyticsApi.getRevenueTrend(),
            analyticsApi.getAppointmentsByBranch(),
            analyticsApi.getTopServices(8),
          ]);

          let revenueData = revenueRes.data;
          let branchResponseData = branchRes.data;
          let servicesResponseData = servicesRes.data;

          if (revenueData && 'data' in revenueData) revenueData = (revenueData as any).data;
          if (branchResponseData && 'data' in branchResponseData) branchResponseData = (branchResponseData as any).data;
          if (servicesResponseData && 'data' in servicesResponseData) servicesResponseData = (servicesResponseData as any).data;

          setRevenueTrend(revenueData?.data || []);
          setBranchData(branchResponseData?.branches || []);
          setTopServices(servicesResponseData?.services || []);
        } catch (chartErr) {
          console.error('[Dashboard] Error fetching chart data:', chartErr);
          // Don't fail the whole page if charts fail
        } finally {
          setChartsLoading(false);
        }

      } catch (err: any) {
        console.error('[Dashboard] Error fetching stats:', err);
        if (err.response?.status === 401) {
          setError('Unauthorized - Please login as admin');
        } else if (err.response?.status === 403) {
          setError('Forbidden - Admin access required');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch stats');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate status data for pie chart
  const getStatusData = () => {
    if (!stats) return [];
    return [
      { name: 'Completed', value: stats.completedAppointments, color: '#22C55E' },
      { name: 'Cancelled', value: stats.cancelledAppointments, color: '#EF4444' },
      { name: 'No Show', value: stats.noShowAppointments, color: '#6B7280' },
    ].filter(item => item.value > 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{currentDate}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Primary Stats Cards */}
      <StatsGrid>
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.totalRevenueThisMonth || 0)}
          description="This month's revenue"
          icon={DollarSign}
          trend={stats ? {
            value: stats.revenueChangePercent,
            isPositive: stats.revenueChange >= 0,
          } : undefined}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Appointments"
          value={stats?.totalAppointmentsThisMonth || 0}
          description="This month"
          icon={Calendar}
          trend={stats ? {
            value: stats.appointmentsChangePercent,
            isPositive: stats.appointmentsChange >= 0,
          } : undefined}
          isLoading={isLoading}
        />
        <StatCard
          title="New Patients"
          value={stats?.newPatientsThisMonth || 0}
          description="This month"
          icon={UserPlus}
          trend={stats ? {
            value: stats.patientsChangePercent,
            isPositive: stats.patientsChange >= 0,
          } : undefined}
          isLoading={isLoading}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats?.completionRate || 0}%`}
          description="This month"
          icon={CheckCircle}
          isLoading={isLoading}
        />
      </StatsGrid>

      {/* Secondary Stats */}
      <StatsGrid>
        <StatCard
          title="Total Branches"
          value={stats?.totalBranches || 0}
          description="Active clinic locations"
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Doctors"
          value={stats?.totalDoctors || 0}
          description="Healthcare professionals"
          icon={Stethoscope}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          description="Registered patients"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.totalAppointmentsToday || 0}
          description="Scheduled for today"
          icon={Activity}
          isLoading={isLoading}
        />
      </StatsGrid>

      {/* Charts Row 1: Revenue Trend and Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Trend */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
            <span className="text-sm text-gray-500">Last 12 months</span>
          </div>
          <RevenueTrendChart data={revenueTrend} isLoading={chartsLoading} />
        </div>

        {/* Appointment Status Breakdown */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Appointment Status</h2>
            <span className="text-sm text-gray-500">This month</span>
          </div>
          <AppointmentStatusChart data={getStatusData()} isLoading={isLoading} />
          {/* Status Legend */}
          <div className="mt-4 space-y-2">
            {stats && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">Completed</span>
                  </div>
                  <span className="font-medium">{stats.completedAppointments}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600">Cancelled</span>
                  </div>
                  <span className="font-medium">{stats.cancelledAppointments}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                    <span className="text-gray-600">No Show</span>
                  </div>
                  <span className="font-medium">{stats.noShowAppointments}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Appointments by Branch and Top Services */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointments by Branch */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Appointments by Branch</h2>
            <span className="text-sm text-gray-500">All time</span>
          </div>
          <AppointmentsByBranchChart data={branchData} isLoading={chartsLoading} />
        </div>

        {/* Top Services */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top Services by Revenue</h2>
            <span className="text-sm text-gray-500">All time</span>
          </div>
          <TopServicesChart data={topServices} isLoading={chartsLoading} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="Add Branch"
            description="Create a new clinic location"
            href="/admin/branches/new"
            icon={Building2}
          />
          <QuickActionCard
            title="Add Doctor"
            description="Register a new doctor"
            href="/admin/doctors/new"
            icon={Stethoscope}
          />
          <QuickActionCard
            title="Add Service"
            description="Create a new service"
            href="/admin/services/new"
            icon={Calendar}
          />
          <QuickActionCard
            title="View Reports"
            description="Check analytics & reports"
            href="/admin/analytics"
            icon={TrendingUp}
          />
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="group block rounded-lg border border-gray-200 p-4 transition-all hover:border-[#00BCD4] hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00BCD4]/10 transition-colors group-hover:bg-[#00BCD4]">
          <Icon className="h-5 w-5 text-[#00BCD4] transition-colors group-hover:text-white" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
}
