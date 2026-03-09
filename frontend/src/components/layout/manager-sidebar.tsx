"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { User as UserType } from "@/types";
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  Clock,
  ClipboardList,
  BarChart3,
  LogOut,
  User as UserIcon,
} from "lucide-react";

interface ManagerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/branch-manager/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Appointments",
    href: "/branch-manager/appointments",
    icon: Calendar,
  },
  {
    name: "Doctors",
    href: "/branch-manager/doctors",
    icon: Stethoscope,
  },
  {
    name: "Slots",
    href: "/branch-manager/slots",
    icon: Clock,
  },
  {
    name: "Walk-ins",
    href: "/branch-manager/walk-ins",
    icon: ClipboardList,
  },
  {
    name: "Analytics",
    href: "/branch-manager/analytics",
    icon: BarChart3,
  },
  {
    name: "My Profile",
    href: "/branch-manager/profile",
    icon: UserIcon,
  },
];

export function ManagerSidebar({ isOpen, onClose, user }: ManagerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Get branch name from user's branchManager relation
  const branchName = (user as any)?.branchManager?.branch?.name || "Your Branch";

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-[#1A2332] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Area */}
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/branch-manager/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00BCD4]">
              <span className="text-lg font-bold text-white">T&T</span>
            </div>
            <div className="hidden lg:block">
              <span className="text-lg font-semibold">Manager Portal</span>
              <p className="text-xs text-gray-400">{branchName}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#00BCD4] text-white shadow-lg shadow-cyan-500/25"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors",
                        isActive ? "text-white" : "text-gray-400"
                      )}
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00BCD4]">
              <span className="text-sm font-semibold">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-all hover:bg-red-500/20 hover:text-red-400"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
