import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    description: 'Appointment status',
    enum: AppointmentStatus,
    example: 'CONFIRMED',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Patient prefers morning appointments',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Patient requested to reschedule',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  cancelReason?: string;
}
