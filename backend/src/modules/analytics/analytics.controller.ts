import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AdminStatsDto, RevenueTrendResponseDto, AppointmentsByBranchResponseDto, TopServicesResponseDto, PatientGrowthResponseDto } from './dto/admin-stats.dto';
import {
  DailyStatsDto,
  WeeklyStatsDto,
  MonthlyStatsDto,
  BranchAnalyticsQueryDto,
} from './dto/branch-stats.dto';
import { JwtAuthGuard, RolesGuard } from '../../core/guards';
import { Roles } from '../../core/decorators';
import { CurrentUser } from '../../core/decorators';
import { UserRole } from '../../shared/enums';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==================== Admin Endpoints ====================

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enhanced admin dashboard statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard statistics retrieved successfully',
    type: AdminStatsDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAdminStats(): Promise<AdminStatsDto> {
    return this.analyticsService.getAdminStats();
  }

  @Get('admin/revenue-trend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue trend for last 12 months' })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue trend retrieved successfully',
    type: RevenueTrendResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getRevenueTrend(): Promise<RevenueTrendResponseDto> {
    return this.analyticsService.getRevenueTrend();
  }

  @Get('admin/appointments-by-branch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments grouped by branch' })
  @ApiResponse({ 
    status: 200, 
    description: 'Appointments by branch retrieved successfully',
    type: AppointmentsByBranchResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAppointmentsByBranch(): Promise<AppointmentsByBranchResponseDto> {
    return this.analyticsService.getAppointmentsByBranch();
  }

  @Get('admin/top-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top services by revenue' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of services to return (default: 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Top services retrieved successfully',
    type: TopServicesResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getTopServices(
    @Query('limit') limit?: string,
  ): Promise<TopServicesResponseDto> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopServices(limitNum);
  }

  @Get('admin/patient-growth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get patient growth data for last 12 months' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient growth data retrieved successfully',
    type: PatientGrowthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getPatientGrowth(): Promise<PatientGrowthResponseDto> {
    return this.analyticsService.getPatientGrowth();
  }

  // ==================== Branch Manager Endpoints ====================

  @Get('branch/daily')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get daily statistics for branch manager' })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily statistics retrieved successfully',
    type: DailyStatsDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Branch Manager access required' })
  async getDailyStats(
    @CurrentUser('branchId') branchId: string,
  ): Promise<DailyStatsDto> {
    return this.analyticsService.getDailyStats(branchId);
  }

  @Get('branch/weekly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly statistics for branch manager' })
  @ApiResponse({ 
    status: 200, 
    description: 'Weekly statistics retrieved successfully',
    type: WeeklyStatsDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Branch Manager access required' })
  async getWeeklyStats(
    @CurrentUser('branchId') branchId: string,
  ): Promise<WeeklyStatsDto> {
    return this.analyticsService.getWeeklyStats(branchId);
  }

  @Get('branch/monthly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get monthly statistics for branch manager' })
  @ApiResponse({ 
    status: 200, 
    description: 'Monthly statistics retrieved successfully',
    type: MonthlyStatsDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Branch Manager access required' })
  async getMonthlyStats(
    @CurrentUser('branchId') branchId: string,
    @Query() query: BranchAnalyticsQueryDto,
  ): Promise<MonthlyStatsDto> {
    return this.analyticsService.getMonthlyStats(
      branchId,
      query.startDate,
      query.endDate,
      query.doctorId,
    );
  }
}
