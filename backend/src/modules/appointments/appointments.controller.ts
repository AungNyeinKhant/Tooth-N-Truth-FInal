import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CurrentUser, Roles } from '../../core/decorators';
import { UserRole } from '../../shared/enums';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryAppointmentsDto, RescheduleAppointmentDto, UpdateAppointmentStatusDto, ManagerCreateAppointmentDto, SearchPatientDto } from './dto';
import { formatList } from '../../shared/utils';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ==================== Branch Manager Endpoints ====================

  @Get('manager')
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get appointments for branch manager (scoped to their branch)' })
  @ApiResponse({ status: 200, description: 'List of branch appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  async getManagerAppointments(
    @CurrentUser('branchId') branchId: string,
    @Query() query: QueryAppointmentsDto,
  ) {
    const { items, total } = await this.appointmentsService.getManagerAppointments(
      branchId,
      query,
    );
    return formatList(items, total, {
      page: query.page || 1,
      limit: query.limit || 20,
    });
  }

  @Get('manager/patients')
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Search patients by phone or name' })
  @ApiResponse({ status: 200, description: 'List of patients' })
  async searchPatients(
    @CurrentUser('branchId') branchId: string,
    @Query() query: SearchPatientDto,
  ) {
    return this.appointmentsService.searchPatients(branchId, query.phone, query.name);
  }

  @Patch(':id/reschedule')
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Reschedule an appointment (manager only)' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiResponse({ status: 400, description: 'Time slot unavailable' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async reschedule(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(
      id,
      branchId,
      dto.doctorId,
      dto.appointmentDate,
      dto.startTime,
    );
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update appointment status (manager only)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(
      id,
      branchId,
      dto.status,
      dto.reason,
      dto.notes,
    );
  }

  @Post('manager-create')
  @ApiBearerAuth()
  @Roles(UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create appointment for patient (manager only)' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 400, description: 'Time slot unavailable' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  async managerCreate(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: ManagerCreateAppointmentDto,
  ) {
    return this.appointmentsService.managerCreate(
      branchId,
      dto.patientId,
      dto.doctorId,
      dto.serviceId,
      dto.appointmentDate,
      dto.startTime,
      dto.notes,
    );
  }

  // ==================== Existing Endpoints ====================

  @Get('admin')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all appointments for admin (with filters)' })
  @ApiResponse({ status: 200, description: 'List of all appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async getAdminAppointments(
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const { items, total } = await this.appointmentsService.getAdminAppointments({
      status,
      branchId,
      doctorId,
      startDate,
      endDate,
      search,
      page: parsedPage,
      limit: parsedLimit,
    });
    return formatList(items, total, { page: parsedPage, limit: parsedLimit });
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments (filtered by user role)' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('branchId') branchId: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAll(userId, role, branchId, status, date);
  }

  @Get('my-appointments')
  @ApiBearerAuth()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get current patient appointments' })
  @ApiResponse({ status: 200, description: 'Patient appointments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - patients only' })
  async getMyAppointments(@CurrentUser('sub') userId: string) {
    return this.appointmentsService.getPatientAppointments(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.appointmentsService.findOne(id, userId, role);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Create new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 400, description: 'Invalid input or time slot unavailable' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - patients only' })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.appointmentsService.create(createAppointmentDto, userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, userId, role);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Cancel appointment (patients only)' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - patients only' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.appointmentsService.cancel(id, reason, userId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete appointment (admin only)' })
  @ApiResponse({ status: 200, description: 'Appointment deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
