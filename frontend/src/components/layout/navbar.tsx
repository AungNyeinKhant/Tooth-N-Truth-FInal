'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { Menu, User, LogOut, LayoutDashboard } from 'lucide-react';

/** Inline SVG logo — no external file dependency */
function TnTLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tooth shape */}
      <path
        d="M20 4C16 4 13 6.5 11 9C9 11.5 8.5 14 9 17
           C9.5 20 10 23 10.5 26C11 29 12 34 13 36
           C13.5 37.5 14.5 38 15.5 37C16.5 36 17 34 17.5 31
           C18 28.5 18.5 27 20 27C21.5 27 22 28.5 22.5 31
           C23 34 23.5 36 24.5 37C25.5 38 26.5 37.5 27 36
           C28 34 29 29 29.5 26C30 23 30.5 20 31 17
           C31.5 14 31 11.5 29 9C27 6.5 24 4 20 4Z"
        fill="#00BCD4"
      />
      {/* Shine highlight */}
      <ellipse cx="15.5" cy="13" rx="2.5" ry="4" fill="white" fillOpacity="0.35" />
      {/* Orange accent dot */}
      <circle cx="32" cy="8" r="5" fill="#FF6B35" />
      <path d="M30 8L31.5 9.5L34.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, getRedirectPath } = useAuthStore();
  const { toggleSidebar } = useUIStore();

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
            <Link href="/" className="flex items-center gap-2 group">
              <TnTLogo size={40} />
              <span className="text-xl font-bold text-text-navy group-hover:text-primary-cyan transition-colors">
                Tooth<span className="text-primary-orange">&</span>Truth
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="hidden md:block text-sm text-text-gray">
                  Welcome, {user?.firstName || user?.email?.split('@')[0] || 'Guest'}
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
