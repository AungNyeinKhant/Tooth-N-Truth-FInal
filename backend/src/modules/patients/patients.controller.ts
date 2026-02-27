import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard, RolesGuard } from '../../core/guards';
import { Roles, CurrentUser } from '../../core/decorators';
import { UserRole } from '../../shared/enums';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BRANCH_MANAGER)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('search')
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
}
