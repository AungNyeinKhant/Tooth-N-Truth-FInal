import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AdminStatsDto } from './dto/admin-stats.dto';
import {
  DailyStatsDto,
  WeeklyStatsDto,
  MonthlyStatsDto,
  DoctorPerformanceDto,
  ServiceStatsDto,
  DailyTrendDto,
} from './dto/branch-stats.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats(): Promise<AdminStatsDto> {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query all counts in parallel for better performance
    const [
      totalBranches,
      totalDoctors,
      totalPatients,
      totalAppointmentsToday,
    ] = await Promise.all([
      // Count active branches
      this.prisma.branch.count({
        where: { isActive: true },
      }),

      // Count active doctors
      this.prisma.doctor.count({
        where: { isActive: true },
      }),

      // Count patients (users with PATIENT role who have a patient profile)
      this.prisma.patient.count(),

      // Count appointments scheduled for today
      this.prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    return {
      totalBranches,
      totalDoctors,
      totalPatients,
      totalAppointmentsToday,
    };
  }

  // ==================== Branch Manager Analytics ====================

  /**
   * Get daily stats for a specific branch
   */
  async getDailyStats(branchId: string): Promise<DailyStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all appointments for today in this branch
    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        service: true,
        doctor: true,
      },
    });

    // Count by status
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const noShow = appointments.filter((a) => a.status === 'NO_SHOW').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    const walkIns = appointments.filter((a) => a.isWalkIn).length;

    // Calculate revenue (from completed appointments only)
    const totalRevenue = completed
      ? appointments
          .filter((a) => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0)
      : 0;

    // Get unique doctors with appointments
    const doctorIds = [...new Set(appointments.map((a) => a.doctorId))];

    return {
      totalAppointments: appointments.length,
      confirmed,
      completed,
      noShow,
      cancelled,
      walkIns,
      totalRevenue,
      activeDoctors: doctorIds.length,
    };
  }

  /**
   * Get weekly stats for a specific branch (last 7 days)
   */
  async getWeeklyStats(branchId: string): Promise<WeeklyStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        appointmentDate: {
          gte: weekAgo,
          lt: today,
        },
      },
      include: {
        service: true,
      },
    });

    // Build daily breakdown
    const dailyMap = new Map<string, DailyTrendDto>();

    // Initialize all 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        totalAppointments: 0,
        completed: 0,
        revenue: 0,
      });
    }

    // Fill in actual data
    appointments.forEach((apt) => {
      const dateStr = apt.appointmentDate.toISOString().split('T')[0];
      const dayData = dailyMap.get(dateStr);
      if (dayData) {
        dayData.totalAppointments++;
        if (apt.status === 'COMPLETED') {
          dayData.completed++;
          dayData.revenue += Number(apt.service.price) || 0;
        }
      }
    });

    const dailyBreakdown = Array.from(dailyMap.values());
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === 'COMPLETED',
    ).length;
    const totalRevenue = completedAppointments
      ? appointments
          .filter((a) => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0)
      : 0;

    return {
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: new Date(today.getTime() - 1).toISOString().split('T')[0],
      totalAppointments,
      totalRevenue,
      avgAppointmentsPerDay: Math.round((totalAppointments / 7) * 10) / 10,
      dailyBreakdown,
    };
  }

  /**
   * Get monthly stats for a specific branch (custom range)
   */
  async getMonthlyStats(
    branchId: string,
    startDate?: string,
    endDate?: string,
    doctorId?: string,
  ): Promise<MonthlyStatsDto> {
    // Default: last 30 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const start = startDate
      ? new Date(startDate)
      : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : today;

    const whereClause: any = {
      branchId,
      appointmentDate: {
        gte: start,
        lte: end,
      },
    };

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
    });

    const totalAppointments = appointments.length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const noShow = appointments.filter((a) => a.status === 'NO_SHOW').length;

    // Calculate revenue
    const totalRevenue = completed
      ? appointments
          .filter((a) => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0)
      : 0;

    // Calculate rates
    const completionRate = totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0;
    const noShowRate = totalAppointments > 0 ? (noShow / totalAppointments) * 100 : 0;

    // Calculate days in range
    const daysDiff = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const avgAppointmentsPerDay = Math.round((totalAppointments / daysDiff) * 10) / 10;

    // Top services
    const serviceMap = new Map<string, ServiceStatsDto>();
    appointments.forEach((apt) => {
      const existing = serviceMap.get(apt.serviceId);
      if (existing) {
        existing.appointmentCount++;
        if (apt.status === 'COMPLETED') {
          existing.revenue += Number(apt.service.price) || 0;
        }
      } else {
        serviceMap.set(apt.serviceId, {
          serviceId: apt.serviceId,
          serviceName: apt.service.name,
          appointmentCount: 1,
          revenue: apt.status === 'COMPLETED' ? Number(apt.service.price) || 0 : 0,
        });
      }
    });

    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 10);

    // Doctor performance
    const doctorMap = new Map<string, DoctorPerformanceDto>();
    appointments.forEach((apt) => {
      const existing = doctorMap.get(apt.doctorId);
      if (existing) {
        existing.totalAppointments++;
        if (apt.status === 'COMPLETED') {
          existing.completedAppointments++;
          existing.revenue += Number(apt.service.price) || 0;
        }
      } else {
        doctorMap.set(apt.doctorId, {
          doctorId: apt.doctorId,
          doctorFirstName: apt.doctor.firstName,
          doctorLastName: apt.doctor.lastName,
          specialization: apt.doctor.specialization,
          totalAppointments: 1,
          completedAppointments: apt.status === 'COMPLETED' ? 1 : 0,
          completionRate: 0,
          revenue: apt.status === 'COMPLETED' ? Number(apt.service.price) || 0 : 0,
        });
      }
    });

    const doctorPerformance = Array.from(doctorMap.values()).map((doc) => ({
      ...doc,
      completionRate:
        doc.totalAppointments > 0
          ? Math.round((doc.completedAppointments / doc.totalAppointments) * 100)
          : 0,
    }));

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalAppointments,
      totalRevenue,
      completionRate: Math.round(completionRate * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      avgAppointmentsPerDay,
      topServices,
      doctorPerformance: doctorPerformance.sort(
        (a, b) => b.totalAppointments - a.totalAppointments,
      ),
    };
  }
}
