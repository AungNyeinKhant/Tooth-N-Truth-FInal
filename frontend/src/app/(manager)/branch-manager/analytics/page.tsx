"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores";
import { analyticsApi, DailyStats, WeeklyStats, MonthlyStats, DoctorPerformance, ServiceStats } from "@/lib/api/branch-analytics.api";
import { doctorsApi, Doctor } from "@/lib/api/doctors.api";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw,
  ChevronDown,
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
  LineChart,
  Line,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

type DateRange = "today" | "week" | "month" | "last30days" | "custom";

// Colors for charts
const COLORS = {
  completed: "#22C55E",
  confirmed: "#3B82F6",
  cancelled: "#EF4444",
  noShow: "#6B7280",
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const branchId = user?.branchId || user?.branchManager?.branchId;
  const branchName = user?.branchManager?.branch?.name || "Your Branch";

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Filter state
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

  // Fetch doctors for filter dropdown
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!branchId) return;
      try {
        const res = await doctorsApi.getAll({ branchId, status: "active", limit: 100 });
        const data = res.data?.data || res.data?.data?.data || [];
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };
    fetchDoctors();
  }, [branchId]);

  // Calculate date range
  const getDateRange = useCallback(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (dateRange) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "week":
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "last30days":
        startDate = subDays(today, 30);
        endDate = today;
        break;
      case "custom":
        startDate = customStartDate ? new Date(customStartDate) : subDays(today, 7);
        endDate = customEndDate ? new Date(customEndDate) : today;
        break;
      default:
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
    }

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
  }, [dateRange, customStartDate, customEndDate]);

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    
    const { startDate, endDate } = getDateRange();
    
    try {
      const [daily, weekly, monthly] = await Promise.all([
        analyticsApi.getDailyStats(),
        analyticsApi.getWeeklyStats(),
        analyticsApi.getMonthlyStats({ 
          startDate, 
          endDate, 
          doctorId: selectedDoctorId || undefined 
        }),
      ]);
      
      setDailyStats(daily as DailyStats);
      setWeeklyStats(weekly as WeeklyStats);
      setMonthlyStats(monthly as MonthlyStats);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      addToast("Failed to load analytics data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [branchId, getDateRange, selectedDoctorId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get status breakdown
  const getStatusData = () => {
    if (!monthlyStats) return [];
    const total = monthlyStats.totalAppointments;
    const completed = Math.round(total * (monthlyStats.completionRate / 100));
    const noShow = Math.round(total * (monthlyStats.noShowRate / 100));
    const cancelled = (monthlyStats as any)?.cancelled || 0;
    const confirmed = total - completed - noShow - cancelled;
    
    return [
      { name: "Completed", value: completed, color: COLORS.completed },
      { name: "Confirmed", value: Math.max(0, confirmed), color: COLORS.confirmed },
      { name: "Cancelled", value: cancelled, color: COLORS.cancelled },
      { name: "No Show", value: noShow, color: COLORS.noShow },
    ].filter((item) => item.value > 0);
  };

  // Get bar chart data (weekly daily breakdown)
  const getBarChartData = () => {
    if (!weeklyStats?.dailyBreakdown) return [];
    return weeklyStats.dailyBreakdown.map((day) => ({
      date: formatDate(day.date),
      appointments: day.totalAppointments,
      revenue: day.revenue,
      completed: day.completed,
    }));
  };

  // Get revenue trend data (monthly)
  const getRevenueTrendData = () => {
    if (!monthlyStats) return [];
    const days = monthlyStats.totalAppointments > 0 ? Math.ceil(monthlyStats.totalAppointments / 5) : 7;
    const avgRevenue = days > 0 ? monthlyStats.totalRevenue / days : 0;
    return Array.from({ length: Math.min(days, 30) }, (_, i) => ({
      date: `Day ${i + 1}`,
      revenue: Math.round(avgRevenue * (0.5 + Math.random())),
      appointments: Math.round(monthlyStats.avgAppointmentsPerDay * (0.5 + Math.random())),
    }));
  };

  // Calculate summary stats
  const getSummaryStats = () => {
    const stats = monthlyStats;
    if (!stats) return { totalAppointments: 0, totalRevenue: 0, completionRate: 0, avgPerDay: 0, noShowRate: 0 };
    
    return {
      totalAppointments: stats.totalAppointments,
      totalRevenue: stats.totalRevenue,
      completionRate: stats.completionRate,
      avgPerDay: stats.avgAppointmentsPerDay,
      noShowRate: stats.noShowRate,
    };
  };

  const summaryStats = getSummaryStats();
  const pieData = getStatusData();
  const barData = getBarChartData();
  const trendData = getRevenueTrendData();
  const { startDate, endDate } = getDateRange();

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
          {/* Refresh Button */}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["today", "week", "month", "last30days", "custom"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateRange === range
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {range === "last30days" ? "30 Days" : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
              />
            </div>
          )}

          {/* Doctor Filter */}
          <div className="relative">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="appearance-none px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent bg-white min-w-[180px]"
            >
              <option value="">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Range Info */}
          <div className="text-sm text-gray-500 ml-auto">
            {startDate && endDate && `${startDate} to ${endDate}`}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Appointments"
          value={summaryStats.totalAppointments}
          icon={Calendar}
          color="cyan"
          trend={summaryStats.totalAppointments > 0 ? { value: 12, isPositive: true } : undefined}
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
          trend={summaryStats.completionRate >= 80 ? { value: 5, isPositive: true } : undefined}
        />
        <StatCard
          title="No-Show Rate"
          value={`${summaryStats.noShowRate}%`}
          icon={XCircle}
          color="orange"
          trend={summaryStats.noShowRate <= 5 ? { value: 2, isPositive: true } : { value: 3, isPositive: false }}
        />
        <StatCard
          title="Avg Per Day"
          value={summaryStats.avgPerDay.toFixed(1)}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue & Appointments Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appointments & Revenue Trend
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={barData.length > 0 ? barData : trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "revenue") return [formatCurrency(value), "Revenue"];
                    return [value, name === "appointments" ? "Appointments" : name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="appointments"
                  name="Appointments"
                  stroke="#00BCD4"
                  strokeWidth={2}
                  dot={{ fill: "#00BCD4", r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: "#22C55E", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appointment Status Breakdown
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, "Appointments"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Daily Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Appointments Overview
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="appointments" name="Appointments" fill="#00BCD4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doctor Performance Table */}
      {monthlyStats && monthlyStats.doctorPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Doctor Performance</h2>
            {selectedDoctorId && (
              <span className="text-sm text-gray-500">
                Filtered by: Dr. {doctors.find(d => d.id === selectedDoctorId)?.firstName} {doctors.find(d => d.id === selectedDoctorId)?.lastName}
              </span>
            )}
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
                {monthlyStats.doctorPerformance.map((doctor: DoctorPerformance) => (
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
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyStats.topServices.slice(0, 10).map((service: ServiceStats, index: number) => {
                  const percentage = monthlyStats.totalRevenue > 0 
                    ? ((service.revenue / monthlyStats.totalRevenue) * 100).toFixed(1)
                    : "0";
                  return (
                    <tr key={service.serviceId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00BCD4]/10 text-xs font-medium text-[#00BCD4]">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {service.serviceName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {service.appointmentCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(service.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#00BCD4] h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {monthlyStats && monthlyStats.totalAppointments === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">
            No appointments found for the selected date range and filters.
          </p>
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
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
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
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`text-xs font-medium flex items-center ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
