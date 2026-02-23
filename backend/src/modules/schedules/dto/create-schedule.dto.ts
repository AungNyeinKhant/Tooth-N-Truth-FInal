import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Doctor ID' })
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)', example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

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
