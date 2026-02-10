'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { appointmentsApi } from '@/lib/api';
import { Calendar, Clock, User, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  doctor: {
    firstName: string;
    lastName: string;
    specialization: string;
  };
  service: {
    name: string;
  };
}

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    past: 0,
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await appointmentsApi.getMyAppointments();
      const allAppointments = res.data.data;
      setAppointments(allAppointments);
      
      // Calculate stats
      const upcoming = allAppointments.filter(
        (apt: Appointment) => apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED'
      ).length;
      const past = allAppointments.filter(
        (apt: Appointment) => apt.status === 'CANCELLED' || apt.status === 'COMPLETED'
      ).length;
      
      setStats({ upcoming, past });
    } catch (error) {
      addToast('Failed to load appointments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get next upcoming appointment
  const nextAppointment = appointments.find(
    (apt) => apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED'
  );

  if (isLoading) {
    return (
      <div className="container-app py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-navy">
          Welcome back, {user?.firstName}! 👋
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
              <p className="text-2xl font-bold text-text-navy">{stats.upcoming}</p>
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
              <p className="text-2xl font-bold text-text-navy">{stats.past}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Appointment */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-navy">Next Appointment</h2>
              <Link href="/appointments">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>

            {nextAppointment ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-background-light rounded-lg">
                  <div className="w-12 h-12 bg-primary-cyan/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-primary-cyan" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-gray">
                      {format(new Date(nextAppointment.appointmentDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-lg font-semibold text-text-navy mt-1">
                      {nextAppointment.startTime}
                    </p>
                    <p className="text-primary-cyan font-medium mt-1">
                      Dr. {nextAppointment.doctor.firstName} {nextAppointment.doctor.lastName}
                    </p>
                    <p className="text-sm text-text-gray">
                      {nextAppointment.service.name}
                    </p>
                  </div>
                  <Badge variant="warning">{nextAppointment.status}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-text-gray mb-4">No upcoming appointments</p>
                <Link href="/book">
                  <Button>Book Appointment</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <h2 className="text-xl font-semibold text-text-navy mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/book">
                <Button className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Book New Appointment
                </Button>
              </Link>
              <Link href="/appointments">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Appointments
                </Button>
              </Link>
              <Link href="/medical-history">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Medical History
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
