import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateWalkInDto {
  @ApiProperty({ example: 'John', description: 'Patient first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Patient last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({
    example: '09123456789',
    description: 'Patient phone number (required, no format validation)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiPropertyOptional({
    example: 'Tooth pain in upper right molar',
    description: 'Reason for visit',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-doctor',
    description: 'Preferred doctor ID (required if slotId not provided)',
  })
  @IsOptional()
  @IsUUID()
  preferredDoctorId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-slot',
    description: 'Slot ID for scheduled time (uses slot doctor and time if provided)',
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
