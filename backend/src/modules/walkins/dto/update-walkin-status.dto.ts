import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsString,
  MaxLength,
} from 'class-validator';

export enum WalkInStatus {
  WAITING = 'WAITING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateWalkInStatusDto {
  @ApiProperty({
    enum: WalkInStatus,
    example: WalkInStatus.IN_PROGRESS,
    description: 'New status for the walk-in',
  })
  @IsEnum(WalkInStatus)
  status!: WalkInStatus;

  @ApiPropertyOptional({
    example: 'uuid-of-doctor',
    description: 'Doctor ID to assign (required when status is ASSIGNED)',
  })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({
    example: 'Patient decided to leave',
    description: 'Reason for cancellation (required when status is CANCELLED)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;

  @ApiPropertyOptional({
    example: 'Patient had cavity, filled successfully',
    description: 'Notes about the visit',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ConvertToAppointmentDto {
  @ApiProperty({
    example: 'uuid-of-doctor',
    description: 'Doctor ID for the appointment',
  })
  @IsUUID()
  doctorId!: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Appointment date',
  })
  @IsString()
  appointmentDate!: string;

  @ApiProperty({
    example: '10:00',
    description: 'Start time in HH:mm format',
  })
  @IsString()
  startTime!: string;
}
