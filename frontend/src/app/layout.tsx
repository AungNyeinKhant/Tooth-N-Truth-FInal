'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toast } from '@/components/ui';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isPublicRoute = pathname === '/' || pathname === '/book';
    if (!isAuthRoute && !isPublicRoute) {
      checkAuth();
    }
  }, [checkAuth, pathname]);
  
  const isAdminRoute = pathname?.startsWith('/admin');
  const isManagerRoute = pathname?.startsWith('/branch-manager') || pathname?.startsWith('/manager');
  
  const showNavAndFooter = !isAdminRoute && !isManagerRoute;

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          {showNavAndFooter && <Navbar />}
          <main className="flex-1">{children}</main>
          {showNavAndFooter && <Footer />}
        </div>
        <Toast />
      </body>
    </html>
  );
}
