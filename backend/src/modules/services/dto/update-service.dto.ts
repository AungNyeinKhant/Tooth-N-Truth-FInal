import { IsString, IsNumber, IsOptional, IsBoolean, Min, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({
    description: 'Service name',
    example: 'Teeth Cleaning',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Professional teeth cleaning to remove plaque and tartar',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Service duration in minutes (minimum 15)',
    example: 30,
    minimum: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Service price in MMK (minimum 0)',
    example: 25000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Service active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
