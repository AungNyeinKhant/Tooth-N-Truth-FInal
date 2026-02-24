import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { WalkInStatus } from './update-walkin-status.dto';

export class QueryWalkInDto {
  @ApiPropertyOptional({
    enum: WalkInStatus,
    example: WalkInStatus.WAITING,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(WalkInStatus)
  status?: WalkInStatus;

  @ApiPropertyOptional({
    example: 'today',
    description: 'Filter by date (today, or specific date in YYYY-MM-DD format)',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Search by patient name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
