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
} from "lucide-react";
import Link from "next/link";
import { analyticsApi, DailyStats } from "@/lib/api/analytics.api";
import { appointmentsApi, ManagerAppointment } from "@/lib/api/appointments.api";

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

  const [stats, setStats] = useState<DailyStats | null>(null);
  const [appointments, setAppointments] = useState<ManagerAppointment[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
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
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const res = await analyticsApi.getDailyStats();
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

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

    loadStats();
    loadSchedule();
  }, [today]);

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Today's Appointments"
          value={stats?.totalAppointments}
          description="Scheduled for today"
          icon={Calendar}
          color="cyan"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Walk-ins Waiting"
          value={stats?.walkIns}
          description="Pending walk-in patients"
          icon={Users}
          color="orange"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Active Doctors"
          value={stats?.activeDoctors}
          description="In your branch"
          icon={Stethoscope}
          color="green"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Today's Revenue"
          value={stats?.totalRevenue}
          description="From completed appointments"
          icon={DollarSign}
          color="blue"
          isCurrency
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Completed Today"
          value={stats?.completed}
          description="Appointments completed"
          icon={CheckCircle}
          color="purple"
          isLoading={isLoadingStats}
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
      return new Intl.NumberFormat("en-MM", {
        style: "currency",
        currency: "MMK",
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
