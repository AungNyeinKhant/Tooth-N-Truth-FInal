'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { 
  Calendar, 
  User, 
  Clock, 
  Upload, 
  Camera,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { 
  getMyStats, 
  getMyUpcomingAppointments,
  uploadProfileImage,
  PatientStats,
  PatientAppointment
} from '@/lib/api/patients.api';

export default function PatientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data states
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<PatientAppointment[]>([]);

  useEffect(() => {
    const init = async () => {
      console.log('[Dashboard] Starting auth check...');
      await checkAuth();
      console.log('[Dashboard] Auth check complete');
      setIsChecking(false);
    };
    init();
  }, [checkAuth]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchDashboardData();
    }
  }, [isChecking, isAuthenticated]);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      console.log('[Dashboard] Fetching stats and appointments...');
      const [statsData, appointmentsData] = await Promise.all([
        getMyStats(),
        getMyUpcomingAppointments(3),
      ]);
      setStats(statsData);
      setUpcomingAppointments(appointmentsData);
      console.log('[Dashboard] Data loaded:', { stats: statsData, appointments: appointmentsData.length });
    } catch (error: any) {
      console.error('[Dashboard] Error fetching data:', error);
      addToast(error.response?.data?.message || 'Failed to load dashboard data', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Please select a valid image file (JPEG, PNG, or WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('File size must be less than 5MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadProfileImage(file);
      addToast('Profile image updated successfully', 'success');
      // Refresh auth to get updated user data
      await checkAuth();
    } catch (error: any) {
      console.error('Upload error:', error);
      addToast(error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

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
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-gray">Redirecting to login...</p>
      </div>
    );
  }

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Patient';

  // Calculate countdown to next appointment
  const getCountdown = () => {
    if (!stats?.nextAppointment) return null;
    
    const apt = stats.nextAppointment;
    const aptDateTime = new Date(`${apt.appointmentDate}T${apt.startTime}`);
    const now = new Date();
    const diff = aptDateTime.getTime() - now.getTime();

    if (diff < 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  const countdown = getCountdown();

  return (
    <div className="container-app py-8">
      {/* Header with Profile */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-navy">
            Welcome, {displayName}! 👋
          </h1>
          <p className="text-text-gray mt-2">
            Manage your dental appointments and health records
          </p>
        </div>

        {/* Profile Image */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-4 border-primary-cyan/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-cyan/10 flex items-center justify-center border-4 border-primary-cyan/20">
                <User className="w-10 h-10 text-primary-cyan" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-cyan text-white rounded-full flex items-center justify-center hover:bg-primary-cyan/90 disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleProfileImageUpload}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-cyan/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-cyan" />
              </div>
              <div>
                <p className="text-sm text-text-gray">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-text-navy">{stats?.upcomingCount || 0}</p>
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
                <p className="text-2xl font-bold text-text-navy">{stats?.pastVisitsCount || 0}</p>
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
      )}

      {/* Next Appointment Card */}
      {stats?.nextAppointment && countdown && (
        <Card className="mb-8 border-l-4 border-l-primary-cyan">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-text-gray mb-1">Next Appointment In</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-cyan">{countdown.days}</p>
                  <p className="text-xs text-text-gray">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-cyan">{countdown.hours}</p>
                  <p className="text-xs text-text-gray">Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-cyan">{countdown.minutes}</p>
                  <p className="text-xs text-text-gray">Minutes</p>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <span className="font-medium">{stats.nextAppointment.serviceName}</span>
                <span className="text-text-gray"> with </span>
                <span className="font-medium">{stats.nextAppointment.doctorName}</span>
              </div>
              <p className="text-sm text-text-gray">
                {stats.nextAppointment.appointmentDate} at {stats.nextAppointment.startTime}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/medical-history')}
              className="shrink-0"
            >
              View Details
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => router.push('/book')}>Book New Appointment</Button>
          <Button variant="outline" onClick={() => router.push('/medical-history')}>
            View Medical Records
          </Button>
        </div>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/medical-history')}
            className="text-primary-cyan"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {isLoadingData ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => (
              <div 
                key={apt.id} 
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push('/medical-history')}
              >
                <div className="w-16 h-16 bg-primary-cyan/10 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-primary-cyan">
                    {new Date(apt.appointmentDate).getDate()}
                  </span>
                  <span className="text-xs text-primary-cyan">
                    {new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-navy">{apt.serviceName}</p>
                  <p className="text-sm text-text-gray">{apt.doctorName}</p>
                  <p className="text-sm text-text-gray">{apt.startTime} - {apt.endTime}</p>
                </div>
                <Badge variant="info" size="sm">{apt.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-gray">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No upcoming appointments</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/book')}
            >
              Book Your First Appointment
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
