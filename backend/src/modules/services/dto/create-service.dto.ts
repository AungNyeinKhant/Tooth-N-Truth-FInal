import { IsString, IsNumber, IsOptional, IsBoolean, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Teeth Cleaning',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Professional teeth cleaning to remove plaque and tartar',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Service duration in minutes (minimum 15)',
    example: 30,
    minimum: 15,
  })
  @IsNumber()
  @Min(15)
  duration: number;

  @ApiProperty({
    description: 'Service price in MMK (minimum 0)',
    example: 25000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Service active status',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
