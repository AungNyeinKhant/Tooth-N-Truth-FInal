"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { analyticsApi } from "@/lib/api/analytics.api";
import { StatCard, StatsGrid } from "./components/stat-card";
import {
  Building2,
  Stethoscope,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface DashboardStats {
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointmentsToday: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointmentsToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await analyticsApi.getAdminStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

      {/* Stats Cards */}
      <StatsGrid>
        <StatCard
          title="Total Branches"
          value={stats.totalBranches}
          description="Active clinic locations"
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Doctors"
          value={stats.totalDoctors}
          description="Healthcare professionals"
          icon={Stethoscope}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          description="Registered patients"
          icon={Users}
          isLoading={isLoading}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Today's Appointments"
          value={stats.totalAppointmentsToday}
          description="Scheduled for today"
          icon={Calendar}
          isLoading={isLoading}
        />
      </StatsGrid>

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
            href="/admin/reports"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
            >
              <div className="h-10 w-10 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#00BCD4]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  New appointment booked
                </p>
                <p className="text-xs text-gray-500">
                  Patient: John Doe - Branch: Downtown
                </p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
          ))}
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
