"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  analyticsApi,
  AdminStats,
  DetailedAdminStats,
  RevenueTrend,
  BranchAppointment,
  TopService,
  PatientGrowth,
  AnalyticsPeriod,
} from "@/lib/api/analytics.api";
import {
  branchesApi,
} from "@/lib/api";
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
  Activity,
  RefreshCw,
  ChevronDown,
  Filter,
  Award,
  Target,
  Clock,
  CalendarDays,
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
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";

// Colors
const BRANCH_COLORS = [
  "#00BCD4",
  "#4CAF50",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#3F51B5",
];

const STATUS_COLORS = {
  completed: "#22C55E",
  confirmed: "#3B82F6",
  cancelled: "#EF4444",
  noShow: "#6B7280",
};

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "last6Months", label: "Last 6 Months" },
  { value: "lastYear", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
  { value: "all", label: "All Time" },
];

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();

  // Filter states
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedAdminStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [branchData, setBranchData] = useState<BranchAppointment[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [patientGrowth, setPatientGrowth] = useState<PatientGrowth[]>([]);

  // Fetch branches for filter
  useEffect(() => {
    const fetchBranches = async () => {
      setBranchesLoading(true);
      
      try {
        // Use direct fetch to reliably get branches
        const token = localStorage.getItem("accessToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        const res = await fetch(`${apiUrl}/api/branches?status=active&limit=100`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        const responseData = await res.json();
        
        // Extract branches from the response
        let branchesData: { id: string; name: string }[] = [];
        
        if (responseData?.data && Array.isArray(responseData.data)) {
          branchesData = responseData.data.map((b: any) => ({ id: b.id, name: b.name }));
        } else if (Array.isArray(responseData)) {
          branchesData = responseData.map((b: any) => ({ id: b.id, name: b.name }));
        }
        
        setBranches(branchesData);
        
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchBranches();
  }, []);

  // Calculate date range
  const getDateRange = useCallback(() => {
    const today = new Date();
    let startDate: string;
    let endDate: string = format(today, "yyyy-MM-dd");

    switch (period) {
      case "today":
        startDate = format(today, "yyyy-MM-dd");
        break;
      case "week":
        startDate = format(subDays(today, 7), "yyyy-MM-dd");
        break;
      case "month":
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        break;
      case "lastMonth":
        startDate = format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd");
        endDate = format(endOfMonth(subMonths(today, 1)), "yyyy-MM-dd");
        break;
      case "last3Months":
        startDate = format(subMonths(today, 3), "yyyy-MM-dd");
        break;
      case "last6Months":
        startDate = format(subMonths(today, 6), "yyyy-MM-dd");
        break;
      case "lastYear":
        startDate = format(subMonths(today, 12), "yyyy-MM-dd");
        break;
      case "all":
        startDate = "2000-01-01";
        break;
      default:
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
    }

    return { startDate, endDate };
  }, [period]);

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Determine which params to send - either custom dates OR period
      const useCustomDates = period === "custom" && customStartDate && customEndDate;
      const detailedParams = useCustomDates
        ? { 
            startDate: customStartDate, 
            endDate: customEndDate, 
            branchId: selectedBranchId || undefined 
          }
        : { 
            period: period === "custom" ? undefined : period, 
            branchId: selectedBranchId || undefined 
          };

      // For other charts, use the calculated date range
      const chartStartDate = useCustomDates ? customStartDate : startDate;
      const chartEndDate = useCustomDates ? customEndDate : endDate;
      
      console.log("📊 Fetching analytics with params:", {
        period,
        useCustomDates,
        customStartDate,
        customEndDate,
        selectedBranchId,
        detailedParams,
        chartStartDate,
        chartEndDate,
      });

      // Common params for all chart APIs
      const chartParams = {
        startDate: chartStartDate,
        endDate: chartEndDate,
        branchId: selectedBranchId || undefined,
      };

      const [statsRes, detailedRes, revenueRes, branchRes, servicesRes, patientRes] = await Promise.all([
        analyticsApi.getAdminStats(),
        analyticsApi.getDetailedAnalytics(detailedParams),
        analyticsApi.getRevenueTrend(chartParams),
        analyticsApi.getAppointmentsByBranch(chartParams),
        analyticsApi.getTopServices(10, chartParams),
        analyticsApi.getPatientGrowth({ startDate: chartStartDate, endDate: chartEndDate }),
      ]);

      console.log("📊 Analytics response - detailedStats:", detailedRes.data?.data || detailedRes.data);

      // Unwrap nested response data
      const unwrap = <T,>(res: any): T => {
        if (res.data?.data) return res.data.data;
        if (res.data) return res.data;
        return res;
      };

      setAdminStats(unwrap<AdminStats>(statsRes));
      setDetailedStats(unwrap<DetailedAdminStats>(detailedRes));
      
      const revenueData = unwrap<{ data: RevenueTrend[]; totalRevenue: number; avgMonthlyRevenue: number }>(revenueRes);
      setRevenueTrend(revenueData?.data || []);
      
      const branchResponseData = unwrap<{ branches: BranchAppointment[]; totalAppointments: number }>(branchRes);
      setBranchData(branchResponseData?.branches || []);
      
      const servicesData = unwrap<{ services: TopService[]; totalRevenue: number }>(servicesRes);
      setTopServices(servicesData?.services || []);
      
      const patientData = unwrap<{ data: PatientGrowth[]; totalNewPatients: number; growthRate: number }>(patientRes);
      setPatientGrowth(patientData?.data || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, customStartDate, customEndDate, selectedBranchId, period]);

  // For preset periods, auto-fetch when period changes
  useEffect(() => {
    if (period !== "custom") {
      fetchData();
    }
  }, [period, selectedBranchId]);

  // For custom dates, only fetch when Apply button is clicked
  const handleApplyCustomDates = () => {
    if (customStartDate && customEndDate) {
      fetchData();
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get branch comparison data sorted by revenue
  const getBranchComparisonData = () => {
    if (!branchData.length) return [];
    return [...branchData]
      .sort((a, b) => b.revenue - a.revenue)
      .map((branch, index) => ({
        ...branch,
        color: BRANCH_COLORS[index % BRANCH_COLORS.length],
        completionRate: branch.totalAppointments > 0 
          ? Math.round((branch.completed / branch.totalAppointments) * 100) 
          : 0,
      }));
  };

  // Format revenue trend data
  const getRevenueTrendData = () => {
    return revenueTrend.map((item) => ({
      month: `${item.month} ${item.year}`,
      Revenue: item.revenue,
      Appointments: item.appointments,
    }));
  };

  // Get status pie data from detailed stats
  const getStatusPieData = () => {
    if (!detailedStats) return [];
    return [
      { name: "Completed", value: detailedStats.completed, color: STATUS_COLORS.completed },
      { name: "Confirmed", value: detailedStats.confirmed, color: STATUS_COLORS.confirmed },
      { name: "Cancelled", value: detailedStats.cancelled, color: STATUS_COLORS.cancelled },
      { name: "No Show", value: detailedStats.noShow, color: STATUS_COLORS.noShow },
    ].filter((item) => item.value > 0);
  };

  const branchComparisonData = getBranchComparisonData();
  const revenueTrendData = getRevenueTrendData();
  const statusPieData = getStatusPieData();
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
          <p className="text-sm text-gray-500">System-wide overview and branch comparison</p>
        </div>
        <div className="flex items-center gap-2">
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
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
                className="appearance-none px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent bg-white min-w-[140px]"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Custom Date Range - Shows when "Custom Range" is selected */}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                placeholder="Start Date"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent"
                placeholder="End Date"
              />
              <button
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    fetchData();
                  }
                }}
                disabled={!customStartDate || !customEndDate}
                className="px-3 py-2 text-sm font-medium text-white bg-[#00BCD4] rounded-lg hover:bg-[#00A5BA] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          )}

          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Branch:</span>
            <div className="relative">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={branchesLoading}
                className="appearance-none px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent bg-white min-w-[160px] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Branches</option>
                {!branchesLoading && branches.length === 0 && (
                  <option value="" disabled>No branches found</option>
                )}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Range Info */}
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>
              {period === "custom" && customStartDate && customEndDate
                ? `${customStartDate} to ${customEndDate}`
                : detailedStats?.startDate && detailedStats?.endDate
                  ? `${detailedStats.startDate} to ${detailedStats.endDate}`
                  : "Select a period"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards - Use detailedStats only if it exists and has data */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatCurrency(detailedStats?.totalRevenue ?? 0)}
          icon={DollarSign}
          color="green"
          trend={detailedStats?.revenueChangePercent}
          isPositive={(detailedStats?.revenueChange || 0) >= 0}
        />
        <StatCard
          title="Total Appointments"
          value={(detailedStats?.totalAppointments ?? 0).toString()}
          icon={Calendar}
          color="cyan"
          trend={detailedStats?.appointmentsChangePercent}
          isPositive={(detailedStats?.appointmentsChange || 0) >= 0}
        />
        <StatCard
          title="Completion Rate"
          value={`${detailedStats?.completionRate ?? 0}%`}
          icon={CheckCircle}
          color="purple"
          trend={detailedStats?.completionRate}
          isPositive={(detailedStats?.completionRate || 0) >= 80}
        />
        <StatCard
          title="Avg Revenue/Appointment"
          value={formatCurrency(detailedStats?.avgRevenuePerAppointment ?? 0)}
          icon={Activity}
          color="blue"
        />
      </div>

      {/* Secondary Stats - Show counts within filtered period */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <MiniStatCard title="Branches w/ Appts" value={detailedStats?.branchesWithAppointments ?? 0} icon={Building2} />
        <MiniStatCard title="Confirmed" value={detailedStats?.confirmed ?? 0} icon={Stethoscope} />
        <MiniStatCard title="Completed" value={detailedStats?.completed ?? 0} icon={Users} />
        <MiniStatCard title="No-Show" value={detailedStats?.noShow ?? 0} icon={Calendar} />
        <MiniStatCard title="No-Show %" value={`${detailedStats?.noShowRate ?? 0}%`} icon={XCircle} />
        <MiniStatCard title="Cancelled %" value={`${detailedStats?.cancellationRate ?? 0}%`} icon={XCircle} />
      </div>

      {/* Charts Row 1: Revenue Trend & Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (12 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis 
                  tick={{ fontSize: 11 }} 
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
                    if (name === "Revenue") return [formatCurrency(value), "Revenue"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  name="Revenue"
                  stroke="#00BCD4"
                  strokeWidth={2}
                  dot={{ fill: "#00BCD4", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Comparison Section */}
      <div className="bg-gradient-to-r from-[#00BCD4]/5 to-transparent rounded-xl border border-[#00BCD4]/20 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-6 w-6 text-[#00BCD4]" />
          <h2 className="text-xl font-bold text-gray-900">Branch Performance Comparison</h2>
        </div>

        {/* Branch Stats Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {branchComparisonData.map((branch, index) => (
                  <tr key={branch.branchId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {index === 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xs text-yellow-600 font-medium">Top</span>
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                          {index + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: branch.color }}
                        />
                        <span className="text-sm font-medium text-gray-900">{branch.branchName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {branch.totalAppointments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {branch.completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(branch.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${branch.completionRate}%`,
                              backgroundColor: branch.color,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10">{branch.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Comparison Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue by Branch */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Revenue by Branch</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={branchComparisonData.slice(0, 6).map(b => ({
                    name: b.branchName.length > 10 ? b.branchName.substring(0, 10) + "..." : b.branchName,
                    revenue: b.revenue,
                    color: b.color,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11 }} 
                    tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                    {branchComparisonData.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Appointments by Branch */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Appointments by Branch</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={branchComparisonData.slice(0, 6).map(b => ({
                    name: b.branchName.length > 10 ? b.branchName.substring(0, 10) + "..." : b.branchName,
                    appointments: b.totalAppointments,
                    completed: b.completed,
                    color: b.color,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalAppointments" name="Total" fill="#00BCD4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 3: Patient Growth & Top Services */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Services by Revenue</h2>
          <div className="space-y-3">
            {topServices.slice(0, 6).map((service, index) => (
              <div key={service.serviceId} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00BCD4]/10 text-xs font-medium text-[#00BCD4]">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {service.serviceName}
                    </span>
                    <span className="text-sm font-medium text-gray-900 ml-2">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#00BCD4] h-2 rounded-full"
                        style={{
                          width: `${Math.min((service.revenue / (topServices[0]?.revenue || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{service.appointmentCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {detailedStats?.completed ?? 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {detailedStats?.completionRate ?? 0}% of total
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Cancelled</span>
              </div>
              <p className="text-2xl font-bold text-red-700">
                {detailedStats?.cancelled ?? 0}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {detailedStats?.cancellationRate ?? 0}% of total
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">No Show</span>
              </div>
              <p className="text-2xl font-bold text-gray-700">
                {detailedStats?.noShow ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {detailedStats?.noShowRate ?? 0}% of total
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Confirmed</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {detailedStats?.confirmed ?? 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">Pending appointments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "cyan" | "orange" | "green" | "blue" | "purple";
  trend?: number;
  isPositive?: boolean;
}

function StatCard({ title, value, icon: Icon, color, trend, isPositive = true }: StatCardProps) {
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
            {trend !== undefined && (
              <span
                className={`text-xs font-medium flex items-center ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(trend)}%
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

// Mini Stat Card
interface MiniStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
}

function MiniStatCard({ title, value, icon: Icon }: MiniStatCardProps) {
  return (
    <div className="rounded-lg bg-white p-3 border border-gray-100 text-center">
      <Icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{title}</p>
    </div>
  );
}
