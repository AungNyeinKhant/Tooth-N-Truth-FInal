'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingWizard } from '@/components/appointments/booking-wizard';
import { useAuthStore } from '@/stores';

export default function BookAppointmentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="text-3xl font-bold text-text-navy mb-8">Book an Appointment</h1>
      <BookingWizard />
    </div>
  );
}
