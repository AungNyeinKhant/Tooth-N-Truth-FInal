import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class BulkScheduleDto {
  @ApiProperty({ description: 'Doctor ID' })
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Days of week (0=Sunday, 1=Monday, ..., 6=Saturday)', example: [1, 2, 3, 4, 5] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days: number[];

  @ApiProperty({ description: 'Start time (HH:mm format)', example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm format)', example: '17:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime: string;

  @ApiPropertyOptional({ description: 'Slot duration in minutes', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotDuration?: number;

  @ApiPropertyOptional({ description: 'Buffer time between slots in minutes', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTime?: number;

  @ApiPropertyOptional({ description: 'Is schedule active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
