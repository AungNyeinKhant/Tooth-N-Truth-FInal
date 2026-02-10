'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Doctors', href: '/doctors', icon: Users },
  { name: 'Schedules', href: '/schedules', icon: Clock },
  { name: 'Walk-ins', href: '/walk-ins', icon: ClipboardList },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function BranchManagerSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="w-64 bg-text-navy text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-primary-cyan">Manager Portal</h2>
        <p className="text-sm text-gray-400 mt-1">{user?.firstName} {user?.lastName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-cyan text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">Tooth & Truth Clinic</p>
      </div>
    </aside>
  );
}
