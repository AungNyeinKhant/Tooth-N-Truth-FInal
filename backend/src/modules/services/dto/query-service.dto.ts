import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceStatus {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class QueryServiceDto {
  @ApiPropertyOptional({
    description: 'Search by service name',
    example: 'cleaning',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ServiceStatus,
    example: ServiceStatus.ALL,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
  })
  @IsOptional()
  limit?: number;
}
