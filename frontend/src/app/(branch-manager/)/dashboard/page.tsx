'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { useAuthStore, useUIStore } from '@/stores';
import { appointmentsApi } from '@/lib/api';
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  doctor: {
    firstName: string;
    lastName: string;
  };
  service: {
    name: string;
    price: number;
  };
}

export default function BranchManagerDashboard() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    pendingCount: 0,
    completedCount: 0,
    todayRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodayAppointments();
  }, []);

  const loadTodayAppointments = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await appointmentsApi.getAll({ date: today });
      const appointments = res.data.data;
      setTodayAppointments(appointments);

      // Calculate stats
      const todayCount = appointments.length;
      const pendingCount = appointments.filter(
        (apt: Appointment) => apt.status === 'PENDING'
      ).length;
      const completedCount = appointments.filter(
        (apt: Appointment) => apt.status === 'COMPLETED'
      ).length;
      const todayRevenue = appointments
        .filter((apt: Appointment) => apt.status === 'COMPLETED')
        .reduce((sum: number, apt: Appointment) => sum + Number(apt.service.price), 0);

      setStats({ todayCount, pendingCount, completedCount, todayRevenue });
    } catch (error) {
      addToast('Failed to load appointments', 'error');
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-navy">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-text-gray mt-2">
          Here's what's happening at your branch today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-cyan/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-cyan" />
            </div>
            <div>
              <p className="text-sm text-text-gray">Today's Appointments</p>
              <p className="text-2xl font-bold text-text-navy">{stats.todayCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-text-gray">Pending</p>
              <p className="text-2xl font-bold text-text-navy">{stats.pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-gray">Completed</p>
              <p className="text-2xl font-bold text-text-navy">{stats.completedCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-orange/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-orange" />
            </div>
            <div>
              <p className="text-sm text-text-gray">Today's Revenue</p>
              <p className="text-2xl font-bold text-text-navy">
                {stats.todayRevenue.toLocaleString()} MMK
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-navy">
                Today's Appointments
              </h2>
              <Link href="/appointments">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-text-gray">No appointments today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-background-light rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <span className="text-sm text-text-gray">
                          {appointment.startTime}
                        </span>
                      </div>
                      <p className="font-semibold text-text-navy">
                        {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                      </p>
                      <p className="text-sm text-text-gray">
                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName} • {appointment.service.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <h2 className="text-xl font-semibold text-text-navy mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/walk-ins">
                <Button className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Walk-in Patient
                </Button>
              </Link>
              <Link href="/doctors">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Doctors
                </Button>
              </Link>
              <Link href="/schedules">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Manage Schedules
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
