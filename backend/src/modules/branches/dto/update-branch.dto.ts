import { IsString, IsEmail, IsOptional, IsBoolean, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UpdateManagerDto {
  @ApiPropertyOptional({
    description: 'Manager first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Manager last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Manager email (for login)',
    example: 'john.doe@toothandtruth.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Manager phone number',
    example: '+95 1 234 5678',
  })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Manager password (min 8 characters, optional - leave blank to keep current)',
    example: 'NewSecurePass123!',
  })
  @IsOptional()
  @IsString()
  @Length(8, 100)
  password?: string;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({
    description: 'Branch name',
    example: 'Downtown Dental Clinic',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Branch address',
    example: '123 Main Street, Downtown, Yangon',
  })
  @IsOptional()
  @IsString()
  @Length(5, 255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Branch phone number (for patient contact)',
    example: '+95 1 234 5678',
  })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Branch email address (for patient contact)',
    example: 'downtown@toothandtruth.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Branch active status',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Branch manager information (optional - only include to update manager)',
    type: UpdateManagerDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateManagerDto)
  manager?: UpdateManagerDto;
}
