import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AdminStatsDto, AdminAnalyticsQueryDto, DetailedAdminStatsDto, RevenueTrendDto, RevenueTrendResponseDto, BranchAppointmentDto, AppointmentsByBranchResponseDto, TopServiceDto, TopServicesResponseDto, PatientGrowthDto, PatientGrowthResponseDto } from './dto/admin-stats.dto';
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

  // ==================== Admin Analytics ====================

  /**
   * Get enhanced admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminStatsDto> {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get last month's date range
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Run all queries in parallel
    const [
      totalBranches,
      totalDoctors,
      totalPatients,
      totalAppointmentsToday,
      thisMonthAppointments,
      lastMonthAppointments,
      thisMonthNewPatients,
      lastMonthNewPatients,
    ] = await Promise.all([
      // Count active branches
      this.prisma.branch.count({
        where: { isActive: true },
      }),

      // Count active doctors
      this.prisma.doctor.count({
        where: { isActive: true },
      }),

      // Count total patients
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

      // This month's appointments
      this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: thisMonthStart,
            lte: thisMonthEnd,
          },
        },
        include: { service: true },
      }),

      // Last month's appointments
      this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        include: { service: true },
      }),

      // New patients this month (patients created in this month)
      this.prisma.patient.count({
        where: {
          createdAt: {
            gte: thisMonthStart,
            lte: thisMonthEnd,
          },
        },
      }),

      // New patients last month
      this.prisma.patient.count({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),
    ]);

    // Calculate this month metrics
    const totalAppointmentsThisMonth = thisMonthAppointments.length;
    const completedAppointments = thisMonthAppointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = thisMonthAppointments.filter(a => a.status === 'CANCELLED').length;
    const noShowAppointments = thisMonthAppointments.filter(a => a.status === 'NO_SHOW').length;

    // Calculate this month's revenue
    const totalRevenueThisMonth = completedAppointments
      ? thisMonthAppointments
          .filter(a => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0)
      : 0;

    // Calculate last month's revenue
    const lastMonthRevenue = lastMonthAppointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (Number(a.service?.price) || 0), 0);

    // Calculate rates
    const completionRate = totalAppointmentsThisMonth > 0 
      ? Math.round((completedAppointments / totalAppointmentsThisMonth) * 100 * 10) / 10 
      : 0;
    const cancellationRate = totalAppointmentsThisMonth > 0 
      ? Math.round((cancelledAppointments / totalAppointmentsThisMonth) * 100 * 10) / 10 
      : 0;
    const noShowRate = totalAppointmentsThisMonth > 0 
      ? Math.round((noShowAppointments / totalAppointmentsThisMonth) * 100 * 10) / 10 
      : 0;

    // Calculate comparisons
    const revenueChange = totalRevenueThisMonth - lastMonthRevenue;
    const revenueChangePercent = lastMonthRevenue > 0 
      ? Math.round((revenueChange / lastMonthRevenue) * 100 * 10) / 10 
      : totalRevenueThisMonth > 0 ? 100 : 0;
    
    const appointmentsChange = totalAppointmentsThisMonth - lastMonthAppointments.length;
    const appointmentsChangePercent = lastMonthAppointments.length > 0 
      ? Math.round((appointmentsChange / lastMonthAppointments.length) * 100 * 10) / 10 
      : totalAppointmentsThisMonth > 0 ? 100 : 0;

    const patientsChange = thisMonthNewPatients - lastMonthNewPatients;
    const patientsChangePercent = lastMonthNewPatients > 0 
      ? Math.round((patientsChange / lastMonthNewPatients) * 100 * 10) / 10 
      : thisMonthNewPatients > 0 ? 100 : 0;

    return {
      totalBranches,
      totalDoctors,
      totalPatients,
      totalAppointmentsToday,
      totalAppointmentsThisMonth,
      totalRevenueThisMonth,
      newPatientsThisMonth: thisMonthNewPatients,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      completionRate,
      cancellationRate,
      noShowRate,
      revenueChange,
      revenueChangePercent,
      appointmentsChange,
      appointmentsChangePercent,
      patientsChange,
      patientsChangePercent,
    };
  }

  /**
   * Get revenue trend for last 12 months (or custom date range)
   */
  async getRevenueTrend(
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Promise<RevenueTrendResponseDto> {
    const today = new Date();
    const data: RevenueTrendDto[] = [];

    // Build base where clause for branch filter
    const branchWhere = branchId ? { branchId } : {};

    // If custom date range provided, show monthly breakdown within that range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      
      // Show up to 12 months of data
      const monthsToShow = Math.min(Math.max(monthsDiff + 1, 1), 12);
      
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0, 23, 59, 59, 999);
        
        const appointments = await this.prisma.appointment.findMany({
          where: {
            ...branchWhere,
            appointmentDate: {
              gte: monthDate,
              lte: monthEnd,
            },
            status: 'COMPLETED',
          },
          include: { service: true },
        });

        const revenue = appointments.reduce((sum, a) => sum + (Number(a.service.price) || 0), 0);
        const totalAppointments = await this.prisma.appointment.count({
          where: {
            ...branchWhere,
            appointmentDate: {
              gte: monthDate,
              lte: monthEnd,
            },
          },
        });

        data.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          year: monthDate.getFullYear(),
          revenue,
          appointments: totalAppointments,
        });
      }
    } else {
      // Default: last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const appointments = await this.prisma.appointment.findMany({
          where: {
            ...branchWhere,
            appointmentDate: {
              gte: monthDate,
              lte: monthEnd,
            },
            status: 'COMPLETED',
          },
          include: { service: true },
        });

        const revenue = appointments.reduce((sum, a) => sum + (Number(a.service.price) || 0), 0);
        const totalAppointments = await this.prisma.appointment.count({
          where: {
            ...branchWhere,
            appointmentDate: {
              gte: monthDate,
              lte: monthEnd,
            },
          },
        });

        data.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          year: monthDate.getFullYear(),
          revenue,
          appointments: totalAppointments,
        });
      }
    }

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const avgMonthlyRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;

    return { data, totalRevenue, avgMonthlyRevenue };
  }

  /**
   * Get appointments grouped by branch (with optional date/branch filters)
   */
  async getAppointmentsByBranch(
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Promise<AppointmentsByBranchResponseDto> {
    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.appointmentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    } else if (startDate) {
      dateFilter.appointmentDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      dateFilter.appointmentDate = {
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    // If specific branch filter, return only that branch
    if (branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          appointments: {
            where: dateFilter,
            include: { service: true },
          },
        },
      });

      if (!branch) {
        return { branches: [], totalAppointments: 0, topBranch: null };
      }

      const completed = branch.appointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = branch.appointments.filter(a => a.status === 'CANCELLED').length;
      const noShow = branch.appointments.filter(a => a.status === 'NO_SHOW').length;
      const revenue = branch.appointments
        .filter(a => a.status === 'COMPLETED')
        .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0);

      const branchData: BranchAppointmentDto = {
        branchId: branch.id,
        branchName: branch.name,
        totalAppointments: branch.appointments.length,
        completed,
        cancelled,
        noShow,
        revenue,
      };

      return {
        branches: [branchData],
        totalAppointments: branch.appointments.length,
        topBranch: branchData,
      };
    }

    // Get all branches with their appointments
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      include: {
        appointments: {
          where: dateFilter,
          include: { service: true },
        },
      },
    });

    const branchData: BranchAppointmentDto[] = branches.map(branch => {
      const completed = branch.appointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = branch.appointments.filter(a => a.status === 'CANCELLED').length;
      const noShow = branch.appointments.filter(a => a.status === 'NO_SHOW').length;
      const revenue = branch.appointments
        .filter(a => a.status === 'COMPLETED')
        .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0);

      return {
        branchId: branch.id,
        branchName: branch.name,
        totalAppointments: branch.appointments.length,
        completed,
        cancelled,
        noShow,
        revenue,
      };
    });

    // Sort by total appointments
    branchData.sort((a, b) => b.totalAppointments - a.totalAppointments);

    const totalAppointments = branchData.reduce((sum, b) => sum + b.totalAppointments, 0);

    return {
      branches: branchData,
      totalAppointments,
      topBranch: branchData.length > 0 ? branchData[0] : null,
    };
  }

  /**
   * Get top services by revenue (with optional date/branch filters)
   */
  async getTopServices(
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Promise<TopServicesResponseDto> {
    // Build where clause
    const where: any = { status: 'COMPLETED' };
    
    if (startDate && endDate) {
      where.appointmentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }
    
    if (branchId) {
      where.branchId = branchId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: { service: true },
    });

    const serviceMap = new Map<string, TopServiceDto>();
    
    appointments.forEach(apt => {
      const existing = serviceMap.get(apt.serviceId);
      if (existing) {
        existing.appointmentCount++;
        existing.revenue += Number(apt.service.price) || 0;
      } else {
        serviceMap.set(apt.serviceId, {
          serviceId: apt.serviceId,
          serviceName: apt.service.name,
          appointmentCount: 1,
          revenue: Number(apt.service.price) || 0,
        });
      }
    });

    const services = Array.from(serviceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    const totalRevenue = services.reduce((sum, s) => sum + s.revenue, 0);

    return { services, totalRevenue };
  }

  /**
   * Get patient growth data for last 12 months (or custom date range)
   */
  async getPatientGrowth(
    startDate?: string,
    endDate?: string,
  ): Promise<PatientGrowthResponseDto> {
    const today = new Date();
    const data: PatientGrowthDto[] = [];
    let runningTotal = 0;

    // Get initial total patients before the range
    let initialTotal = 0;
    if (startDate) {
      initialTotal = await this.prisma.patient.count({
        where: {
          createdAt: {
            lt: new Date(startDate),
          },
        },
      });
    }

    // If custom date range provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const monthsToShow = Math.min(Math.max(monthsDiff + 1, 1), 12);
      
      runningTotal = initialTotal;
      
      for (let i = 0; i < monthsToShow; i++) {
        const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0, 23, 59, 59, 999);
        
        const newPatients = await this.prisma.patient.count({
          where: {
            createdAt: {
              gte: monthDate,
              lte: monthEnd,
            },
          },
        });

        runningTotal += newPatients;

        data.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          year: monthDate.getFullYear(),
          newPatients,
          totalPatients: runningTotal,
        });
      }
    } else {
      // Default: last 12 months
      runningTotal = initialTotal;
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
        
        const newPatients = await this.prisma.patient.count({
          where: {
            createdAt: {
              gte: monthDate,
              lte: monthEnd,
            },
          },
        });

        runningTotal += newPatients;

        data.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          year: monthDate.getFullYear(),
          newPatients,
          totalPatients: runningTotal,
        });
      }
    }

    const totalNewPatients = data.reduce((sum, d) => sum + d.newPatients, 0);
    const firstMonthPatients = data[0]?.totalPatients || 0;
    const lastMonthPatients = data[data.length - 1]?.totalPatients || 0;
    const growthRate = firstMonthPatients > 0 
      ? Math.round(((lastMonthPatients - firstMonthPatients) / firstMonthPatients) * 100 * 10) / 10 
      : 0;

    return { data, totalNewPatients, growthRate };
  }

  /**
   * Get detailed admin analytics with date range and branch filters
   */
  async getDetailedAnalytics(query: AdminAnalyticsQueryDto): Promise<DetailedAdminStatsDto> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Calculate date range based on period or explicit dates
    let startDate: Date;
    let endDate: Date = today;
    
    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to this month based on period
      switch (query.period) {
        case 'today':
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'lastMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'last3Months':
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
          break;
        case 'last6Months':
          startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
          break;
        case 'lastYear':
          startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
          break;
        case 'all':
          startDate = new Date(2000, 0, 1); // Far back date
          break;
        case 'month':
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
      }
    }

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength - 1);
    const prevEndDate = new Date(startDate.getTime() - 1);
    prevEndDate.setHours(23, 59, 59, 999);

    // Build where clause
    const whereClause: any = {
      appointmentDate: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (query.branchId) {
      whereClause.branchId = query.branchId;
    }

    const prevWhereClause: any = {
      appointmentDate: {
        gte: prevStartDate,
        lte: prevEndDate,
      },
    };
    if (query.branchId) {
      prevWhereClause.branchId = query.branchId;
    }

    // Get current period data
    const [appointments, prevAppointments, totalBranches, totalDoctors, totalPatients] = await Promise.all([
      this.prisma.appointment.findMany({
        where: whereClause,
        include: { service: true },
      }),
      this.prisma.appointment.findMany({
        where: prevWhereClause,
        include: { service: true },
      }),
      this.prisma.branch.count({ where: { isActive: true } }),
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.prisma.patient.count(),
    ]);

    // Count appointments by status
    const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShow = appointments.filter(a => a.status === 'NO_SHOW').length;
    const totalAppointments = appointments.length;

    // Calculate revenue
    const totalRevenue = completed
      ? appointments
          .filter(a => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0)
      : 0;

    // Previous period data
    const prevCompleted = prevAppointments.filter(a => a.status === 'COMPLETED').length;
    const prevRevenue = prevCompleted
      ? prevAppointments
          .filter(a => a.status === 'COMPLETED')
          .reduce((sum, a) => sum + (Number(a.service.price) || 0), 0)
      : 0;

    // Calculate rates
    const completionRate = totalAppointments > 0
      ? Math.round((completed / totalAppointments) * 100 * 10) / 10
      : 0;
    const cancellationRate = totalAppointments > 0
      ? Math.round((cancelled / totalAppointments) * 100 * 10) / 10
      : 0;
    const noShowRate = totalAppointments > 0
      ? Math.round((noShow / totalAppointments) * 100 * 10) / 10
      : 0;
    const attendanceRate = 100 - noShowRate - cancellationRate;

    // Calculate averages
    const avgRevenuePerAppointment = totalAppointments > 0
      ? Math.round(totalRevenue / totalAppointments)
      : 0;

    // Comparisons
    const revenueChange = totalRevenue - prevRevenue;
    const revenueChangePercent = prevRevenue > 0
      ? Math.round((revenueChange / prevRevenue) * 100 * 10) / 10
      : totalRevenue > 0 ? 100 : 0;

    const appointmentsChange = totalAppointments - prevAppointments.length;
    const appointmentsChangePercent = prevAppointments.length > 0
      ? Math.round((appointmentsChange / prevAppointments.length) * 100 * 10) / 10
      : totalAppointments > 0 ? 100 : 0;

    // Count unique branches with appointments
    const uniqueBranchIds = new Set(appointments.map(a => a.branchId));
    const branchesWithAppointments = uniqueBranchIds.size;

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalBranches,
      totalDoctors,
      totalPatients,
      totalAppointments,
      confirmed,
      completed,
      cancelled,
      noShow,
      totalRevenue,
      avgRevenuePerAppointment,
      completionRate,
      cancellationRate,
      noShowRate,
      attendanceRate,
      branchesWithAppointments,
      revenueChange,
      revenueChangePercent,
      appointmentsChange,
      appointmentsChangePercent,
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
