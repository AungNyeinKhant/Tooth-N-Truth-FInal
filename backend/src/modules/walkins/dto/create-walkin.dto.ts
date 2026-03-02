import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateWalkInDto {
  @ApiProperty({
    example: '2026-02-27',
    description: 'Appointment date (YYYY-MM-DD format)',
  })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional({
    example: 'uuid-of-patient',
    description: 'Existing patient ID (for returning patients)',
  })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Patient first name (required for new patients)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Patient last name (required for new patients)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    example: '09123456789',
    description: 'Patient phone number (required for new patients)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    example: 'Tooth pain in upper right molar',
    description: 'Reason for visit',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    example: 'uuid-of-doctor',
    description: 'Doctor ID (required)',
  })
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @ApiPropertyOptional({
    example: 'uuid-of-slot',
    description: 'Slot ID for scheduled time (optional)',
  })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-service',
    description: 'Service ID (defaults to first active service)',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
