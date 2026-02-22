"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  Calendar,
  Users,
  Stethoscope,
  DollarSign,
  CheckCircle,
  UserPlus,
  ClipboardList,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// Static mock data for dashboard display
const mockStats = {
  todayAppointments: 12,
  pendingWalkIns: 3,
  activeDoctors: 4,
  todayRevenue: 850000,
  completedToday: 8,
};

const mockAppointments = [
  {
    id: "1",
    patientName: "John Doe",
    patientPhone: "+95 912 345 678",
    doctorName: "Dr. Sarah Johnson",
    serviceName: "Dental Cleaning",
    startTime: "09:00",
    endTime: "09:30",
    status: "COMPLETED",
    isWalkIn: false,
    tokenNumber: null,
  },
  {
    id: "2",
    patientName: "Jane Smith",
    patientPhone: "+95 923 456 789",
    doctorName: "Dr. Michael Chen",
    serviceName: "Root Canal",
    startTime: "09:30",
    endTime: "10:30",
    status: "CONFIRMED",
    isWalkIn: false,
    tokenNumber: null,
  },
  {
    id: "3",
    patientName: "Walk-in Patient",
    patientPhone: "+95 934 567 890",
    doctorName: "Dr. Sarah Johnson",
    serviceName: "Consultation",
    startTime: "10:00",
    endTime: "10:30",
    status: "CONFIRMED",
    isWalkIn: true,
    tokenNumber: "W-001",
  },
  {
    id: "4",
    patientName: "Robert Brown",
    patientPhone: "+95 945 678 901",
    doctorName: "Dr. Emily Davis",
    serviceName: "Teeth Whitening",
    startTime: "11:00",
    endTime: "12:00",
    status: "CONFIRMED",
    isWalkIn: false,
    tokenNumber: null,
  },
  {
    id: "5",
    patientName: "Emily Wilson",
    patientPhone: "+95 956 789 012",
    doctorName: "Dr. Michael Chen",
    serviceName: "Extraction",
    startTime: "14:00",
    endTime: "14:30",
    status: "CONFIRMED",
    isWalkIn: false,
    tokenNumber: null,
  },
];

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const branchName = (user as any)?.branchManager?.branch?.name || "Your Branch";

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
          value={mockStats.todayAppointments}
          description="Scheduled for today"
          icon={Calendar}
          color="cyan"
        />
        <StatCard
          title="Walk-ins Waiting"
          value={mockStats.pendingWalkIns}
          description="Pending walk-in patients"
          icon={Users}
          color="orange"
        />
        <StatCard
          title="Active Doctors"
          value={mockStats.activeDoctors}
          description="In your branch"
          icon={Stethoscope}
          color="green"
        />
        <StatCard
          title="Today's Revenue"
          value={mockStats.todayRevenue}
          description="From completed appointments"
          icon={DollarSign}
          color="blue"
          isCurrency
        />
        <StatCard
          title="Completed Today"
          value={mockStats.completedToday}
          description="Appointments completed"
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            title="Manage Doctors"
            description="View and manage doctors"
            href="/branch-manager/doctors"
            icon={Stethoscope}
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
            href="/branch-manager/appointments"
            className="text-sm text-[#00BCD4] hover:text-[#00A5BA] flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {mockAppointments.map((appointment) => (
            <AppointmentRow key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: "cyan" | "orange" | "green" | "blue" | "purple";
  isCurrency?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  isCurrency = false,
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
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatValue(value)}
          </p>
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
interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  isWalkIn: boolean;
  tokenNumber: string | null;
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const statusColors: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    NO_SHOW: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#00BCD4]/10 text-[#00BCD4] font-semibold text-sm">
        {appointment.startTime}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {appointment.patientName}
          </p>
          {appointment.isWalkIn && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#FF6B35]/10 text-[#FF6B35]">
              Walk-in
              {appointment.tokenNumber && ` #${appointment.tokenNumber}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{appointment.doctorName}</span>
          <span>•</span>
          <span>{appointment.serviceName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[appointment.status] || "bg-gray-100 text-gray-700"}`}>
          {appointment.status.replace("_", " ")}
        </span>
        <span className="text-xs text-gray-400">{appointment.startTime} - {appointment.endTime}</span>
      </div>
    </div>
  );
}
