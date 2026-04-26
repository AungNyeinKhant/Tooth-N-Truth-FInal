import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AdminStatsDto, AdminAnalyticsQueryDto, DetailedAdminStatsDto, RevenueTrendResponseDto, AppointmentsByBranchResponseDto, TopServicesResponseDto, PatientGrowthResponseDto } from './dto/admin-stats.dto';
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

  @Get('admin/detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed admin analytics with filters' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by specific branch ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month', 'lastMonth', 'last3Months', 'last6Months', 'lastYear', 'all'], description: 'Predefined period' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed analytics retrieved successfully',
    type: DetailedAdminStatsDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getDetailedAnalytics(
    @Query() query: AdminAnalyticsQueryDto,
  ): Promise<DetailedAdminStatsDto> {
    return this.analyticsService.getDetailedAnalytics(query);
  }

  @Get('admin/revenue-trend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue trend for last 12 months' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by specific branch ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue trend retrieved successfully',
    type: RevenueTrendResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getRevenueTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ): Promise<RevenueTrendResponseDto> {
    return this.analyticsService.getRevenueTrend(startDate, endDate, branchId);
  }

  @Get('admin/appointments-by-branch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments grouped by branch' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by specific branch ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Appointments by branch retrieved successfully',
    type: AppointmentsByBranchResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAppointmentsByBranch(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ): Promise<AppointmentsByBranchResponseDto> {
    return this.analyticsService.getAppointmentsByBranch(startDate, endDate, branchId);
  }

  @Get('admin/top-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top services by revenue' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of services to return (default: 10)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by specific branch ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Top services retrieved successfully',
    type: TopServicesResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getTopServices(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ): Promise<TopServicesResponseDto> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopServices(limitNum, startDate, endDate, branchId);
  }

  @Get('admin/patient-growth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get patient growth data for last 12 months' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Patient growth data retrieved successfully',
    type: PatientGrowthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getPatientGrowth(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PatientGrowthResponseDto> {
    return this.analyticsService.getPatientGrowth(startDate, endDate);
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
