import { IsString, IsEmail, IsOptional, IsBoolean, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateManagerDto {
  @ApiProperty({
    description: 'Manager first name',
    example: 'John',
  })
  @IsString()
  @Length(2, 50)
  firstName: string;

  @ApiProperty({
    description: 'Manager last name',
    example: 'Doe',
  })
  @IsString()
  @Length(2, 50)
  lastName: string;

  @ApiProperty({
    description: 'Manager email (for login)',
    example: 'john.doe@toothandtruth.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Manager phone number',
    example: '+95 1 234 5678',
  })
  @IsString()
  @Length(5, 20)
  phone: string;

  @ApiProperty({
    description: 'Manager password (min 8 characters)',
    example: 'SecurePass123!',
  })
  @IsString()
  @Length(8, 100)
  password: string;
}

export class CreateBranchDto {
  @ApiProperty({
    description: 'Branch name',
    example: 'Downtown Dental Clinic',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Branch address',
    example: '123 Main Street, Downtown, Yangon',
  })
  @IsString()
  @Length(5, 255)
  address: string;

  @ApiProperty({
    description: 'Branch phone number (for patient contact)',
    example: '+95 1 234 5678',
  })
  @IsString()
  @Length(5, 20)
  phone: string;

  @ApiPropertyOptional({
    description: 'Branch email address (for patient contact, optional)',
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

  @ApiProperty({
    description: 'Branch manager information (required when creating a branch)',
    type: CreateManagerDto,
  })
  @ValidateNested()
  @Type(() => CreateManagerDto)
  manager: CreateManagerDto;
}
