import { IsString, IsEmail, IsOptional, IsBoolean, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    description: 'Branch phone number',
    example: '+95 1 234 5678',
  })
  @IsString()
  @Length(5, 20)
  phone: string;

  @ApiPropertyOptional({
    description: 'Branch email address',
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
}
