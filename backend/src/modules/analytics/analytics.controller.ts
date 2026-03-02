import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AdminStatsDto } from './dto/admin-stats.dto';
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

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
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
