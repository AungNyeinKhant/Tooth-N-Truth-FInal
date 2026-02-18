'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, getRedirectPath } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {isAuthenticated && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 mr-4 lg:hidden"
              >
                <Menu className="w-6 h-6 text-text-navy" />
              </button>
            )}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-cyan">
                Tooth & Truth
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="hidden md:block text-sm text-text-gray">
                  Welcome, {user?.firstName}
                </span>
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                    <div className="w-8 h-8 rounded-full bg-primary-cyan flex items-center justify-center text-white font-medium">
                      {user?.firstName?.[0]}
                    </div>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      href={getRedirectPath()}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-navy hover:bg-gray-50 rounded-t-lg"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-navy hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-status-error hover:bg-red-50 rounded-b-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
