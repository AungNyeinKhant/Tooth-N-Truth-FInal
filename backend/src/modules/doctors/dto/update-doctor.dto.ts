import { IsString, IsOptional, Length, IsEmail, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDoctorDto {
  @ApiPropertyOptional({
    description: 'Doctor first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Doctor last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Doctor specialization',
    example: 'Orthodontics',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  specialization?: string;

  @ApiPropertyOptional({
    description: 'Doctor phone number',
    example: '09123456789',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Doctor email',
    example: 'john.doe@toothandtruth.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Doctor biography',
    example: 'Dr. John Doe is an experienced orthodontist with over 10 years of practice.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Whether the doctor is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
