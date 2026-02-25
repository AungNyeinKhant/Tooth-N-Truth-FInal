import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({
    enum: AppointmentStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Filter by specific date',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Start date for range',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-31',
    description: 'End date for range',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-doctor',
    description: 'Filter by doctor',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Search by patient name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: 'uuid-of-doctor',
    description: 'Doctor ID',
  })
  @IsString()
  doctorId!: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'New appointment date',
  })
  @IsString()
  appointmentDate!: string;

  @ApiProperty({
    example: '10:00',
    description: 'New start time (HH:mm)',
  })
  @IsString()
  startTime!: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.COMPLETED,
    description: 'New status',
  })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @ApiPropertyOptional({
    example: 'Patient did not show up',
    description: 'Reason for cancellation or no-show',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    example: 'Treatment completed successfully',
    description: 'Notes about the appointment',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ManagerCreateAppointmentDto {
  @ApiProperty({
    example: 'uuid-of-patient',
    description: 'Patient ID',
  })
  @IsString()
  patientId!: string;

  @ApiProperty({
    example: 'uuid-of-doctor',
    description: 'Doctor ID',
  })
  @IsString()
  doctorId!: string;

  @ApiProperty({
    example: 'uuid-of-service',
    description: 'Service ID',
  })
  @IsString()
  serviceId!: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Appointment date',
  })
  @IsString()
  appointmentDate!: string;

  @ApiProperty({
    example: '10:00',
    description: 'Start time (HH:mm)',
  })
  @IsString()
  startTime!: string;

  @ApiPropertyOptional({
    example: 'Patient requested morning appointment',
    description: 'Notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchPatientDto {
  @ApiPropertyOptional({
    example: '09123456789',
    description: 'Search by phone',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Search by name',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
