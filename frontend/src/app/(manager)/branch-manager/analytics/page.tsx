"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores";
import {
  analyticsApi,
  DailyStats,
  WeeklyStats,
  MonthlyStats,
  DoctorPerformance,
  ServiceStats,
} from "@/lib/api/branch-analytics.api";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type DateRange = "today" | "week" | "month" | "custom";

// Colors for charts
const COLORS = {
  confirmed: "#3B82F6",
  completed: "#10B981",
  cancelled: "#6B7280",
  noShow: "#EF4444",
};

const PIE_COLORS = [COLORS.confirmed, COLORS.completed, COLORS.cancelled, COLORS.noShow];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const branchId = user?.branchId || user?.branchManager?.branchId;
  const branchName = user?.branchManager?.branch?.name || "Your Branch";

  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const [daily, weekly, monthly] = await Promise.all([
        analyticsApi.getDailyStats(),
        analyticsApi.getWeeklyStats(),
        analyticsApi.getMonthlyStats(),
      ]);
      setDailyStats(daily);
      setWeeklyStats(weekly);
      setMonthlyStats(monthly);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      addToast("Failed to load analytics", "error");
    } finally {
      setIsLoading(false);
    }
  }, [branchId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-MM", {
      style: "currency",
      currency: "MMK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get pie chart data from stats
  const getPieChartData = () => {
    const stats = dateRange === "today" ? dailyStats : dateRange === "week" ? weeklyStats : monthlyStats;
    if (!stats || !("completed" in stats)) return [];
    
    const d = stats as DailyStats;
    return [
      { name: "Confirmed", value: d.confirmed, color: COLORS.confirmed },
      { name: "Completed", value: d.completed, color: COLORS.completed },
      { name: "Cancelled", value: d.cancelled, color: COLORS.cancelled },
      { name: "No Show", value: d.noShow, color: COLORS.noShow },
    ].filter((item) => item.value > 0);
  };

  // Get bar chart data
  const getBarChartData = () => {
    if (!weeklyStats) return [];
    return weeklyStats.dailyBreakdown.map((day) => ({
      date: formatDate(day.date),
      appointments: day.totalAppointments,
      revenue: day.revenue,
    }));
  };

  // Calculate summary stats based on date range
  const getSummaryStats = () => {
    switch (dateRange) {
      case "today":
        return {
          totalAppointments: dailyStats?.totalAppointments || 0,
          totalRevenue: dailyStats?.totalRevenue || 0,
          completionRate: dailyStats?.totalAppointments
            ? Math.round((dailyStats.completed / dailyStats.totalAppointments) * 100)
            : 0,
          avgPerDay: dailyStats?.totalAppointments || 0,
        };
      case "week":
        return {
          totalAppointments: weeklyStats?.totalAppointments || 0,
          totalRevenue: weeklyStats?.totalRevenue || 0,
          completionRate: weeklyStats?.totalAppointments
            ? Math.round(
                (weeklyStats.dailyBreakdown.reduce((a, b) => a + b.completed, 0) /
                  weeklyStats.totalAppointments) *
                  100,
              )
            : 0,
          avgPerDay: weeklyStats?.avgAppointmentsPerDay || 0,
        };
      case "month":
      case "custom":
        return {
          totalAppointments: monthlyStats?.totalAppointments || 0,
          totalRevenue: monthlyStats?.totalRevenue || 0,
          completionRate: monthlyStats?.completionRate || 0,
          avgPerDay: monthlyStats?.avgAppointmentsPerDay || 0,
        };
      default:
        return { totalAppointments: 0, totalRevenue: 0, completionRate: 0, avgPerDay: 0 };
    }
  };

  const summaryStats = getSummaryStats();
  const pieData = getPieChartData();
  const barData = getBarChartData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00BCD4]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">{branchName}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDateRange("today")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === "today"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange("week")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === "week"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setDateRange("month")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Appointments"
          value={summaryStats.totalAppointments}
          icon={Calendar}
          color="cyan"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summaryStats.totalRevenue)}
          icon={DollarSign}
          color="green"
          isCurrency
        />
        <StatCard
          title="Completion Rate"
          value={`${summaryStats.completionRate}%`}
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Avg Per Day"
          value={summaryStats.avgPerDay.toFixed(1)}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appointments & Revenue
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Bar yAxisId="left" dataKey="appointments" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appointment Status
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor Performance Table */}
      {monthlyStats && monthlyStats.doctorPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Doctor Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyStats.doctorPerformance.map((doctor) => (
                  <tr key={doctor.doctorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-[#00BCD4]">
                            {doctor.doctorFirstName[0]}
                            {doctor.doctorLastName[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {doctor.doctorFirstName} {doctor.doctorLastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.specialization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {doctor.totalAppointments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {doctor.completedAppointments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          doctor.completionRate >= 80
                            ? "bg-green-100 text-green-800"
                            : doctor.completionRate >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {doctor.completionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(doctor.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Services */}
      {monthlyStats && monthlyStats.topServices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Services</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyStats.topServices.slice(0, 5).map((service, index) => (
                  <tr key={service.serviceId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00BCD4]/10 text-xs font-medium text-[#00BCD4]">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {service.serviceName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {service.appointmentCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(service.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "cyan" | "orange" | "green" | "blue" | "purple";
  isCurrency?: boolean;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    cyan: "bg-[#00BCD4]/10 text-[#00BCD4]",
    orange: "bg-[#FF6B35]/10 text-[#FF6B35]",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
