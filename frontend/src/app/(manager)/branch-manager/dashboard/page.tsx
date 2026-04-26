"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  Calendar,
  Users,
  Stethoscope,
  DollarSign,
  CheckCircle,
  UserPlus,
  CalendarClock,
  ClipboardList,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { analyticsApi, DailyStats, WeeklyStats, MonthlyStats, ServiceStats, DoctorPerformance } from "@/lib/api/analytics.api";
import { appointmentsApi, ManagerAppointment } from "@/lib/api/appointments.api";
import { WeeklyTrendChart, ManagerServicesChart, ManagerDoctorChart, AppointmentStatusChart } from "@/components/charts";

// Helper: get today as YYYY-MM-DD in local timezone
function getTodayLocal(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();

  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [appointments, setAppointments] = useState<ManagerAppointment[]>([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState(true);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  const today = getTodayLocal();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const branchName =
    (user as any)?.branchManager?.branch?.name || "Your Branch";

  useEffect(() => {
    // Load daily stats
    const loadDailyStats = async () => {
      setIsLoadingDaily(true);
      try {
        const res = await analyticsApi.getDailyStats();
        const data = res.data.data || res.data;
        setDailyStats(data);
      } catch (err) {
        console.error("Failed to load daily stats:", err);
      } finally {
        setIsLoadingDaily(false);
      }
    };

    // Load weekly stats
    const loadWeeklyStats = async () => {
      setIsLoadingWeekly(true);
      try {
        const res = await analyticsApi.getWeeklyStats();
        const data = res.data.data || res.data;
        setWeeklyStats(data);
      } catch (err) {
        console.error("Failed to load weekly stats:", err);
      } finally {
        setIsLoadingWeekly(false);
      }
    };

    // Load monthly stats
    const loadMonthlyStats = async () => {
      setIsLoadingMonthly(true);
      try {
        const res = await analyticsApi.getMonthlyStats();
        const data = res.data.data || res.data;
        setMonthlyStats(data);
      } catch (err) {
        console.error("Failed to load monthly stats:", err);
      } finally {
        setIsLoadingMonthly(false);
      }
    };

    // Load today's schedule
    const loadSchedule = async () => {
      setIsLoadingSchedule(true);
      try {
        const res = await appointmentsApi.getManager({
          date: today,
          limit: 10,
          page: 1,
        });
        // Handle nested formatList response: { data: { data: [...], total: ... } }
        const payload: any = res.data;
        const items: ManagerAppointment[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];
        setAppointments(items);
      } catch (err) {
        console.error("Failed to load today's schedule:", err);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    // Load all data
    Promise.all([
      loadDailyStats(),
      loadWeeklyStats(),
      loadMonthlyStats(),
      loadSchedule(),
    ]);
  }, [today]);

  // Calculate weekly comparison (simplified - comparing avg appointments)
  const weeklyAvg = weeklyStats?.avgAppointmentsPerDay || 0;
  const dailyTarget = 10; // Target appointments per day
  const weeklyProgress = dailyTarget > 0 ? Math.min((weeklyAvg / dailyTarget) * 100, 100) : 0;

  // Get status data for pie chart
  const getStatusData = () => {
    if (!dailyStats) return [];
    return [
      { name: 'Completed', value: dailyStats.completed, color: '#22C55E' },
      { name: 'Confirmed', value: dailyStats.confirmed, color: '#3B82F6' },
      { name: 'Cancelled', value: dailyStats.cancelled, color: '#EF4444' },
      { name: 'No Show', value: dailyStats.noShow, color: '#6B7280' },
    ].filter(item => item.value > 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{currentDate}</p>
          <p className="text-sm font-medium text-[#00BCD4] mt-1">{branchName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Today's Appointments"
          value={dailyStats?.totalAppointments}
          description="Scheduled for today"
          icon={Calendar}
          color="cyan"
          isLoading={isLoadingDaily}
        />
        <StatCard
          title="Walk-ins Waiting"
          value={dailyStats?.walkIns}
          description="Pending walk-in patients"
          icon={Users}
          color="orange"
          isLoading={isLoadingDaily}
        />
        <StatCard
          title="Active Doctors"
          value={dailyStats?.activeDoctors}
          description="In your branch"
          icon={Stethoscope}
          color="green"
          isLoading={isLoadingDaily}
        />
        <StatCard
          title="Today's Revenue"
          value={dailyStats?.totalRevenue}
          description="From completed appointments"
          icon={DollarSign}
          color="blue"
          isCurrency
          isLoading={isLoadingDaily}
        />
        <StatCard
          title="Completed Today"
          value={dailyStats?.completed}
          description="Appointments completed"
          icon={CheckCircle}
          color="purple"
          isLoading={isLoadingDaily}
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickActionCard
            title="Add Walk-in"
            description="Register a walk-in patient"
            href="/branch-manager/walk-ins"
            icon={UserPlus}
          />
          <QuickActionCard
            title="View Schedule"
            description="See today's schedule"
            href="/branch-manager/appointments"
            icon={CalendarClock}
          />
          <QuickActionCard
            title="View Analytics"
            description="Branch reports & stats"
            href="/branch-manager/analytics"
            icon={ClipboardList}
          />
        </div>
      </div>

      {/* Charts Row 1: Weekly Trend and Daily Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Trend Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Overview</h2>
            <span className="text-sm text-gray-500">
              {weeklyStats?.startDate && weeklyStats?.endDate 
                ? `${weeklyStats.startDate} - ${weeklyStats.endDate}`
                : 'Last 7 days'}
            </span>
          </div>
          <WeeklyTrendChart 
            data={weeklyStats?.dailyBreakdown || []} 
            isLoading={isLoadingWeekly}
          />
          {/* Weekly Summary */}
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{weeklyStats?.totalAppointments || 0}</p>
              <p className="text-xs text-gray-500">Total Appointments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(weeklyStats?.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#00BCD4]">{weeklyStats?.avgAppointmentsPerDay || 0}</p>
              <p className="text-xs text-gray-500">Avg/Day</p>
            </div>
          </div>
        </div>

        {/* Today's Status Breakdown */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Status</h2>
            <span className="text-sm text-gray-500">Live breakdown</span>
          </div>
          <AppointmentStatusChart data={getStatusData()} isLoading={isLoadingDaily} />
          {/* Status Details */}
          <div className="mt-4 space-y-2 border-t pt-4">
            {dailyStats && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">Completed</span>
                  </div>
                  <span className="font-medium">{dailyStats.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                    <span className="text-gray-600">Confirmed</span>
                  </div>
                  <span className="font-medium">{dailyStats.confirmed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600">Cancelled</span>
                  </div>
                  <span className="font-medium">{dailyStats.cancelled}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                    <span className="text-gray-600">No Show</span>
                  </div>
                  <span className="font-medium">{dailyStats.noShow}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Top Services and Doctor Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Services */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Services</h2>
            <span className="text-sm text-gray-500">By revenue</span>
          </div>
          <ManagerServicesChart 
            data={monthlyStats?.topServices || []} 
            isLoading={isLoadingMonthly}
          />
        </div>

        {/* Doctor Performance */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Doctor Performance</h2>
            <span className="text-sm text-gray-500">This month</span>
          </div>
          <ManagerDoctorChart 
            data={monthlyStats?.doctorPerformance || []} 
            isLoading={isLoadingMonthly}
          />
        </div>
      </div>

      {/* Monthly Stats Summary */}
      {monthlyStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MonthlyStatCard
            title="Monthly Revenue"
            value={formatCurrency(monthlyStats.totalRevenue)}
            trend={monthlyStats.totalRevenue > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <MonthlyStatCard
            title="Total Appointments"
            value={monthlyStats.totalAppointments.toString()}
          />
          <MonthlyStatCard
            title="Completion Rate"
            value={`${monthlyStats.completionRate}%`}
            trend={monthlyStats.completionRate >= 80 ? { value: 5, isPositive: true } : { value: 3, isPositive: false }}
          />
          <MonthlyStatCard
            title="Avg Per Day"
            value={monthlyStats.avgAppointmentsPerDay.toString()}
          />
        </div>
      )}

      {/* Today's Schedule */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
          <Link
            href={`/branch-manager/appointments?date=${today}`}
            className="text-sm text-[#00BCD4] hover:text-[#00A5BA] flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoadingSchedule ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#00BCD4]" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <AppointmentRow key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number | undefined;
  description: string;
  icon: React.ElementType;
  color: "cyan" | "orange" | "green" | "blue" | "purple";
  isCurrency?: boolean;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  isCurrency = false,
  isLoading = false,
}: StatCardProps) {
  const colorClasses = {
    cyan: "bg-[#00BCD4]/10 text-[#00BCD4]",
    orange: "bg-[#FF6B35]/10 text-[#FF6B35]",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  const formatValue = (val: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString();
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-16 animate-pulse bg-gray-200 rounded" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatValue(value ?? 0)}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Monthly Stat Card Component
interface MonthlyStatCardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MonthlyStatCard({ title, value, trend }: MonthlyStatCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-xl font-bold text-gray-900">{value}</span>
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
  );
}

// Quick Action Card Component
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
    <Link
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
    </Link>
  );
}

// Appointment Row Component
function AppointmentRow({ appointment }: { appointment: ManagerAppointment }) {
  const statusColors: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    NO_SHOW: "bg-gray-100 text-gray-700",
  };

  const patientName = appointment.patient
    ? `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`
    : "Unknown Patient";

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-center h-10 w-16 rounded-lg bg-[#00BCD4]/10 text-[#00BCD4] font-semibold text-xs shrink-0">
        {appointment.startTime}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {patientName}
          </p>
          {appointment.isWalkIn && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#FF6B35]/10 text-[#FF6B35] shrink-0">
              Walk-in
              {appointment.tokenNumber && ` #${appointment.tokenNumber}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</span>
          <span>•</span>
          <span>{appointment.service.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusColors[appointment.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {appointment.status.replace("_", " ")}
        </span>
        <span className="text-xs text-gray-400 hidden sm:block">
          {appointment.startTime} - {appointment.endTime}
        </span>
      </div>
    </div>
  );
}
