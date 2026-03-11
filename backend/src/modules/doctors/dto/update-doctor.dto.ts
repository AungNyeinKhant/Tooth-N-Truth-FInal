import { IsString, IsOptional, Length, IsEmail, IsBoolean, IsUUID } from 'class-validator';
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
    description: 'Branch ID to transfer doctor to another branch',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Whether the doctor is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Doctor profile image URL',
    example: 'https://res.cloudinary.com/.../image.jpg',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
