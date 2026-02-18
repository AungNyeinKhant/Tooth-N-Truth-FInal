"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import {
  LogOut,
  ChevronDown,
  Building2,
} from "lucide-react";

export function ManagerHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Get branch name from user's branchManager relation
  const branchName = (user as any)?.branchManager?.branch?.name || "Your Branch";

  return (
    <header className="hidden lg:flex h-16 bg-[#1A2332] border-b border-white/10 items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo with Branch Name */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00BCD4]">
          <span className="text-lg font-bold text-white">T&T</span>
        </div>
        <div>
          <span className="text-lg font-semibold text-white">Tooth & Truth</span>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Building2 className="w-3 h-3" />
            <span>{branchName}</span>
          </div>
        </div>
      </div>

      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00BCD4]">
            <span className="text-sm font-semibold text-white">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="text-left hidden">
            <p className="text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400">Branch Manager</p>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isDropdownOpen && "rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3 text-[#00BCD4]" />
                <span className="text-xs text-[#00BCD4] font-medium">{branchName}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
