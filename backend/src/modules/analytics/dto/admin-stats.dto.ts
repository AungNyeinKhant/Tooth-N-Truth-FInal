import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';

export class AdminStatsDto {
  // Basic counts
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointmentsToday: number;

  // This month's metrics
  totalAppointmentsThisMonth: number;
  totalRevenueThisMonth: number;
  newPatientsThisMonth: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;

  // Rates (percentages)
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;

  // Comparisons (vs last month)
  revenueChange: number;
  revenueChangePercent: number;
  appointmentsChange: number;
  appointmentsChangePercent: number;
  patientsChange: number;
  patientsChangePercent: number;
}

// Query parameters for admin analytics
export class AdminAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    enum: ['today', 'week', 'month', 'lastMonth', 'last3Months', 'last6Months', 'lastYear', 'all'],
    description: 'Predefined period'
  })
  @IsOptional()
  @IsEnum(['today', 'week', 'month', 'lastMonth', 'last3Months', 'last6Months', 'lastYear', 'all'])
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'last3Months' | 'last6Months' | 'lastYear' | 'all';
}

// Detailed admin analytics with filters
export class DetailedAdminStatsDto {
  // Date range
  startDate: string;
  endDate: string;
  
  // Counts
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  
  // By status
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  
  // Revenue
  totalRevenue: number;
  avgRevenuePerAppointment: number;
  
  // Rates
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  attendanceRate: number;
  
  // Counts by branch
  branchesWithAppointments: number;
  
  // Comparisons vs previous period
  revenueChange: number;
  revenueChangePercent: number;
  appointmentsChange: number;
  appointmentsChangePercent: number;
}

// Data for revenue trend chart (last 12 months)
export class RevenueTrendDto {
  month: string;
  year: number;
  revenue: number;
  appointments: number;
}

export class RevenueTrendResponseDto {
  data: RevenueTrendDto[];
  totalRevenue: number;
  avgMonthlyRevenue: number;
}

// Appointments grouped by branch
export class BranchAppointmentDto {
  branchId: string;
  branchName: string;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShow: number;
  revenue: number;
}

export class AppointmentsByBranchResponseDto {
  branches: BranchAppointmentDto[];
  totalAppointments: number;
  topBranch: BranchAppointmentDto | null;
}

// Top services by revenue
export class TopServiceDto {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
  revenue: number;
}

export class TopServicesResponseDto {
  services: TopServiceDto[];
  totalRevenue: number;
}

// Patient growth data
export class PatientGrowthDto {
  month: string;
  year: number;
  newPatients: number;
  totalPatients: number;
}

export class PatientGrowthResponseDto {
  data: PatientGrowthDto[];
  totalNewPatients: number;
  growthRate: number;
}
