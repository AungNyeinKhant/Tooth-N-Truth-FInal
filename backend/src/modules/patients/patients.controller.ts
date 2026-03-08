import { Controller, Get, Query, UseGuards, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard, RolesGuard } from '../../core/guards';
import { Roles, CurrentUser, Public } from '../../core/decorators';
import { UserRole } from '../../shared/enums';
import { PrismaService } from '../../database/prisma/prisma.service';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('search')
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Search patients by phone number (Manager only)' })
  @ApiResponse({ status: 200, description: 'Patient found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async searchByPhone(
    @Query('phone') phone: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.patientsService.searchByPhone(phone, branchId);
  }

  // ========== Patient Self-Endpoints ==========

  /**
   * Get patient profile from user ID
   */
  private async getPatientIdFromUserId(userId: string): Promise<string> {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!patient) {
      throw new Error('Patient record not found');
    }
    return patient.id;
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get current patient profile' })
  @ApiResponse({ status: 200, description: 'Patient profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@CurrentUser('sub') userId: string) {
    return this.patientsService.getPatientProfile(userId);
  }

  @Patch('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Update current patient profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() data: {
      email?: string;
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
    return this.patientsService.updatePatientProfile(userId, data);
  }

  @Get('me/stats')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get patient dashboard stats' })
  @ApiResponse({ status: 200, description: 'Patient stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyStats(@CurrentUser('sub') userId: string) {
    const patientId = await this.getPatientIdFromUserId(userId);
    return this.patientsService.getPatientStats(patientId);
  }

  @Get('me/appointments/upcoming')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get upcoming appointments' })
  @ApiResponse({ status: 200, description: 'Upcoming appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyUpcomingAppointments(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: string,
  ) {
    const patientId = await this.getPatientIdFromUserId(userId);
    const limitNum = limit ? parseInt(limit, 10) : 5;
    console.log('[getMyUpcomingAppointments] limit:', limit, '->', limitNum);
    const appointments = await this.patientsService.getUpcomingAppointments(patientId, limitNum);
    return { data: appointments };
  }

  @Get('me/appointments/past')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get past appointments' })
  @ApiResponse({ status: 200, description: 'Past appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPastAppointments(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const patientId = await this.getPatientIdFromUserId(userId);
    return this.patientsService.getPastAppointments(patientId, page || 1, limit || 10);
  }
}
