import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { Roles, CurrentUser, Public } from '../../core/decorators';
import { UserRole } from '../../shared/enums';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiResponse({ status: 200, description: 'List of all doctors' })
  async findAll(@Query('branchId') branchId?: string) {
    return this.doctorsService.findAll(branchId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor details' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Public()
  @Get(':id/schedules')
  @ApiOperation({ summary: 'Get doctor schedules' })
  @ApiResponse({ status: 200, description: 'Doctor schedules' })
  async getDoctorSchedules(@Param('id') id: string) {
    return this.doctorsService.getDoctorSchedules(id);
  }

  @Public()
  @Get(':id/available-slots')
  @ApiOperation({ summary: 'Get available time slots for doctor' })
  @ApiResponse({ status: 200, description: 'Available time slots' })
  async getAvailableSlots(
    @Param('id') doctorId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.doctorsService.getAvailableSlots(doctorId, date, serviceId);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add new doctor' })
  @ApiResponse({ status: 201, description: 'Doctor created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @Body() createDoctorDto: CreateDoctorDto,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.doctorsService.create(createDoctorDto, branchId, role);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update doctor' })
  @ApiResponse({ status: 200, description: 'Doctor updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.doctorsService.update(id, updateDoctorDto, branchId, role);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete doctor (soft delete)' })
  @ApiResponse({ status: 200, description: 'Doctor deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.doctorsService.remove(id, branchId, role);
  }
}
