import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class BranchAnalyticsQueryDto {
  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Start date for analytics (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-31',
    description: 'End date for analytics (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-doctor',
    description: 'Filter by doctor ID',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;
}

export class DailyStatsDto {
  @ApiProperty({ description: 'Total appointments today' })
  totalAppointments: number;

  @ApiProperty({ description: 'Confirmed appointments count' })
  confirmed: number;

  @ApiProperty({ description: 'Completed appointments count' })
  completed: number;

  @ApiProperty({ description: 'No-show appointments count' })
  noShow: number;

  @ApiProperty({ description: 'Cancelled appointments count' })
  cancelled: number;

  @ApiProperty({ description: 'Walk-in appointments count' })
  walkIns: number;

  @ApiProperty({ description: 'Total revenue today (in MMK)' })
  totalRevenue: number;

  @ApiProperty({ description: 'Number of active doctors today' })
  activeDoctors: number;
}

export class DailyTrendDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Total appointments on this date' })
  totalAppointments: number;

  @ApiProperty({ description: 'Completed appointments' })
  completed: number;

  @ApiProperty({ description: 'Revenue on this date' })
  revenue: number;
}

export class WeeklyStatsDto {
  @ApiProperty({ description: 'Start date of the week' })
  startDate: string;

  @ApiProperty({ description: 'End date of the week' })
  endDate: string;

  @ApiProperty({ description: 'Total appointments in the week' })
  totalAppointments: number;

  @ApiProperty({ description: 'Total revenue in the week' })
  totalRevenue: number;

  @ApiProperty({ description: 'Average appointments per day' })
  avgAppointmentsPerDay: number;

  @ApiProperty({ description: 'Daily breakdown' })
  dailyBreakdown: DailyTrendDto[];
}

export class ServiceStatsDto {
  @ApiProperty({ description: 'Service ID' })
  serviceId: string;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'Number of appointments for this service' })
  appointmentCount: number;

  @ApiProperty({ description: 'Revenue from this service' })
  revenue: number;
}

export class DoctorPerformanceDto {
  @ApiProperty({ description: 'Doctor ID' })
  doctorId: string;

  @ApiProperty({ description: 'Doctor first name' })
  doctorFirstName: string;

  @ApiProperty({ description: 'Doctor last name' })
  doctorLastName: string;

  @ApiProperty({ description: 'Doctor specialization' })
  specialization: string;

  @ApiProperty({ description: 'Total appointments' })
  totalAppointments: number;

  @ApiProperty({ description: 'Completed appointments' })
  completedAppointments: number;

  @ApiProperty({ description: 'Completion rate (0-100)' })
  completionRate: number;

  @ApiProperty({ description: 'Total revenue generated' })
  revenue: number;
}

export class MonthlyStatsDto {
  @ApiProperty({ description: 'Start date of the period' })
  startDate: string;

  @ApiProperty({ description: 'End date of the period' })
  endDate: string;

  @ApiProperty({ description: 'Total appointments in the period' })
  totalAppointments: number;

  @ApiProperty({ description: 'Total revenue in the period' })
  totalRevenue: number;

  @ApiProperty({ description: 'Completion rate (0-100)' })
  completionRate: number;

  @ApiProperty({ description: 'No-show rate (0-100)' })
  noShowRate: number;

  @ApiProperty({ description: 'Average appointments per day' })
  avgAppointmentsPerDay: number;

  @ApiProperty({ description: 'Top services by count' })
  topServices: ServiceStatsDto[];

  @ApiProperty({ description: 'Doctor performance data' })
  doctorPerformance: DoctorPerformanceDto[];
}
