import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AdminStatsDto } from './dto/admin-stats.dto';

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
}
