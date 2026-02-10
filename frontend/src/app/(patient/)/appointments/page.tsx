'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { appointmentsApi } from '@/lib/api';
import { Calendar, Clock, MapPin, User, Plus } from 'lucide-react';
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
  branch: {
    name: string;
    address: string;
  };
  service: {
    name: string;
    duration: number;
  };
}

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await appointmentsApi.getMyAppointments();
      setAppointments(res.data.data);
    } catch (error) {
      addToast('Failed to load appointments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await appointmentsApi.cancel(id, reason);
      addToast('Appointment cancelled successfully', 'success');
      loadAppointments();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to cancel', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED'
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'CANCELLED' || apt.status === 'COMPLETED'
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-navy">My Appointments</h1>
          <p className="text-text-gray mt-2">View and manage your dental appointments</p>
        </div>
        <Link href="/book">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Book New
          </Button>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text-navy mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <Card className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-text-gray">No upcoming appointments</p>
            <Link href="/book" className="inline-block mt-4">
              <Button variant="outline">Book your first appointment</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <span className="text-sm text-text-gray">
                        {format(new Date(appointment.appointmentDate), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-navy mb-1">
                      Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                    </h3>
                    <p className="text-primary-cyan text-sm mb-2">
                      {appointment.doctor.specialization}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-text-gray">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.startTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{appointment.branch.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{appointment.service.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {appointment.status !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(appointment.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-text-navy mb-4">Past Appointments</h2>
          <div className="space-y-4">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="opacity-75">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Badge variant={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <span className="text-sm text-text-gray">
                        {format(new Date(appointment.appointmentDate), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <p className="font-medium text-text-navy">
                      Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                    </p>
                    <p className="text-sm text-text-gray">{appointment.service.name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
