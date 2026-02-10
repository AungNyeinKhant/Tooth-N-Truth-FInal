import { IsString, IsUUID, IsOptional, IsDateString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID where appointment will take place',
  })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Doctor ID for the appointment',
  })
  @IsUUID()
  doctorId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Service ID to be provided',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: '2024-02-15',
    description: 'Appointment date (YYYY-MM-DD format)',
  })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({
    example: '09:00',
    description: 'Appointment start time (HH:mm format)',
  })
  @IsString()
  startTime: string;

  @ApiPropertyOptional({
    example: 'Please ensure the room is prepared for extraction',
    description: 'Optional notes for the appointment (max 500 characters)',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
