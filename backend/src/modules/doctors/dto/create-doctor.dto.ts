import { IsString, IsOptional, IsUUID, Length, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({
    example: 'Sarah',
    description: 'Doctor first name (2-50 characters)',
  })
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({
    example: 'Johnson',
    description: 'Doctor last name (2-50 characters)',
  })
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiProperty({
    example: 'General Dentistry',
    description: 'Medical specialization (2-100 characters)',
  })
  @IsString()
  @Length(2, 100)
  specialization: string;

  @ApiPropertyOptional({
    example: '09123456789',
    description: 'Doctor contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'sarah.j@toothandtruth.com',
    description: 'Doctor email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'Experienced dentist with over 10 years in general and cosmetic dentistry. Specializes in patient comfort and preventive care.',
    description: 'Doctor biography (max 1000 characters)',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  bio?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Branch ID where the doctor works',
  })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the doctor is active (defaults to true)',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
