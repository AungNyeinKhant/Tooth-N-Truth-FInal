import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

export interface PatientSearchResult {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

export interface PatientStats {
  upcomingCount: number;
  pastVisitsCount: number;
  nextAppointment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    doctorName: string;
    serviceName: string;
    branchName: string;
  } | null;
}

export interface PatientAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  doctorName: string;
  serviceName: string;
  branchName: string;
}

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search for patients by phone number within a branch
   * Returns patients who have appointments at the branch
   */
  async searchByPhone(phone: string, branchId: string): Promise<PatientSearchResult[] | null> {
    if (!phone || phone.trim().length < 3) {
      return [];
    }

    // Find patients with this phone number who have appointments at this branch
    const patients = await this.prisma.patient.findMany({
      where: {
        user: {
          phone: {
            contains: phone.trim(),
            mode: 'insensitive',
          },
        },
        appointments: {
          some: {
            branchId,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      distinct: ['userId'],
      take: 10,
    });

    if (patients.length === 0) {
      return null;
    }

    return patients.map((patient) => ({
      id: patient.id,
      userId: patient.userId,
      firstName: patient.user.firstName,
      lastName: patient.user.lastName,
      phone: patient.user.phone,
      email: patient.user.email,
    }));
  }

  /**
   * Get patient stats for dashboard
   */
  async getPatientStats(patientId: string): Promise<PatientStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get upcoming appointments count
    const upcomingCount = await this.prisma.appointment.count({
      where: {
        patientId,
        status: { in: ['CONFIRMED'] },
        appointmentDate: { gte: today },
      },
    });

    // Get past visits count
    const pastVisitsCount = await this.prisma.appointment.count({
      where: {
        patientId,
        status: { in: ['COMPLETED', 'NO_SHOW'] },
        appointmentDate: { lt: today },
      },
    });

    // Get next appointment
    const nextAppointment = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        status: 'CONFIRMED',
        appointmentDate: { gte: today },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
      include: {
        doctor: {
          select: { firstName: true, lastName: true },
        },
        service: {
          select: { name: true },
        },
        branch: {
          select: { name: true },
        },
      },
    });

    const formattedNextAppointment = nextAppointment
      ? {
          id: nextAppointment.id,
          appointmentDate: nextAppointment.appointmentDate.toISOString().split('T')[0],
          startTime: nextAppointment.startTime,
          endTime: nextAppointment.endTime,
          doctorName: `Dr. ${nextAppointment.doctor.firstName} ${nextAppointment.doctor.lastName}`,
          serviceName: nextAppointment.service.name,
          branchName: nextAppointment.branch.name,
        }
      : null;

    return {
      upcomingCount,
      pastVisitsCount,
      nextAppointment: formattedNextAppointment,
    };
  }

  /**
   * Get patient's upcoming appointments
   */
  async getUpcomingAppointments(patientId: string, limit: number = 5): Promise<PatientAppointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        status: { in: ['CONFIRMED'] },
        appointmentDate: { gte: today },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' },
      ],
      take: limit,
      include: {
        doctor: {
          select: { firstName: true, lastName: true },
        },
        service: {
          select: { name: true },
        },
        branch: {
          select: { name: true },
        },
      },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate.toISOString().split('T')[0],
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
      serviceName: apt.service.name,
      branchName: apt.branch.name,
    }));
  }

  /**
   * Get patient's past appointments
   */
  async getPastAppointments(
    patientId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PatientAppointment[]; meta: { total: number; page: number; limit: number } }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          patientId,
          OR: [
            { status: { in: ['COMPLETED', 'NO_SHOW'] } },
            {
              status: 'CONFIRMED',
              appointmentDate: { lt: today },
            },
          ],
        },
        orderBy: {
          appointmentDate: 'desc',
        },
        skip,
        take: limit,
        include: {
          doctor: {
            select: { firstName: true, lastName: true },
          },
          service: {
            select: { name: true },
          },
          branch: {
            select: { name: true },
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          patientId,
          OR: [
            { status: { in: ['COMPLETED', 'NO_SHOW'] } },
            {
              status: 'CONFIRMED',
              appointmentDate: { lt: today },
            },
          ],
        },
      }),
    ]);

    const data = appointments.map((apt) => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate.toISOString().split('T')[0],
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
      serviceName: apt.service.name,
      branchName: apt.branch.name,
    }));

    return {
      data,
      meta: { total, page, limit },
    };
  }

  /**
   * Get patient profile with medical info (for profile page)
   */
  async getPatientProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
      },
    });

    if (!user || !user.patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return {
      id: user.patient.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      dateOfBirth: user.patient.dateOfBirth,
      address: user.patient.address,
      emergencyContact: user.patient.emergencyContact,
      medicalHistory: user.patient.medicalHistory,
      allergies: user.patient.allergies,
      googleCalendarConnected: user.patient.googleCalendarConnected,
      calendarSyncEnabled: user.patient.calendarSyncEnabled,
      lastCalendarSyncAt: user.patient.lastCalendarSyncAt,
    };
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: string;
      address?: string;
      emergencyContact?: string;
      medicalHistory?: string;
      allergies?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true },
    });

    if (!user || !user.patient) {
      throw new NotFoundException('Patient profile not found');
    }

    // Update user fields
    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone) updateData.phone = data.phone;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Update patient fields
    const patientData: any = {};
    if (data.dateOfBirth) patientData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.address !== undefined) patientData.address = data.address;
    if (data.emergencyContact !== undefined) patientData.emergencyContact = data.emergencyContact;
    if (data.medicalHistory !== undefined) patientData.medicalHistory = data.medicalHistory;
    if (data.allergies !== undefined) patientData.allergies = data.allergies;

    if (Object.keys(patientData).length > 0) {
      await this.prisma.patient.update({
        where: { id: user.patient.id },
        data: patientData,
      });
    }

    return { message: 'Profile updated successfully' };
  }
}
