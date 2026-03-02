'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { Calendar, User, Clock } from 'lucide-react';

export default function PatientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      console.log('[Dashboard] Starting auth check...');
      await checkAuth();
      console.log('[Dashboard] Auth check complete');
      setIsChecking(false);
    };
    init();
  }, [checkAuth]);

  useEffect(() => {
    // Only redirect after check is complete
    if (!isChecking && !isAuthenticated) {
      console.log('[Dashboard] Not authenticated, redirecting to /login');
      router.push('/login');
    }
  }, [isChecking, isAuthenticated, router]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-gray">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-navy">
          Welcome, {user?.firstName}! 👋
        </h1>
        <p className="text-text-gray mt-2">
          Manage your dental appointments and health records
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-cyan/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-cyan" />
            </div>
            <div>
              <p className="text-sm text-text-gray">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-text-navy">0</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-orange/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <p className="text-sm text-text-gray">Past Visits</p>
              <p className="text-2xl font-bold text-text-navy">0</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-gray">Profile Status</p>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => router.push('/book')}>Book New Appointment</Button>
          <Button variant="outline" onClick={() => router.push('/medical-history')}>
            View Medical Records
          </Button>
        </div>
      </Card>

      {/* Recent Appointments */}
      <Card className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
        <div className="text-center py-8 text-text-gray">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No appointments yet</p>
          <p className="text-sm mt-2">Book your first appointment to get started</p>
        </div>
      </Card>
    </div>
  );
}
