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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CurrentUser, Roles } from '../../core/decorators';
import { UserRole } from '../../shared/enums';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get appointments (filtered by user role)' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
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
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get current patient appointments' })
  @ApiResponse({ status: 200, description: 'Patient appointments' })
  async getMyAppointments(@CurrentUser('sub') userId: string) {
    return this.appointmentsService.getPatientAppointments(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.appointmentsService.findOne(id, userId, role);
  }

  @Post()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Create new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 400, description: 'Invalid input or time slot unavailable' })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.appointmentsService.create(createAppointmentDto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated' })
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, userId, role);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Cancel appointment (patients only)' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.appointmentsService.cancel(id, reason, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete appointment (admin only)' })
  @ApiResponse({ status: 200, description: 'Appointment deleted' })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
