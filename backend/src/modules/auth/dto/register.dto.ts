import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'patient@example.com',
    description: 'User email address (must be unique)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Password must be 8-32 characters with uppercase, lowercase, and number',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(32)
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'First name (2-50 characters)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name (2-50 characters)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({
    example: '09123456789',
    description: 'Myanmar phone number (09XXXXXXXXX)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^09\d{9}$/, { message: 'Please enter a valid Myanmar phone number (09XXXXXXXXX)' })
  phone?: string;

  @ApiPropertyOptional({
    example: '1990-01-15',
    description: 'Date of birth (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'No. 123, Main Street, Yangon',
    description: 'Address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: '09987654321',
    description: 'Emergency contact phone number',
  })
  @IsOptional()
  @IsString()
  emergencyContact?: string;
}
