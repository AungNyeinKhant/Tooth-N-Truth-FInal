import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'Start time (HH:mm format)', example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm format)', example: '17:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Slot duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotDuration?: number;

  @ApiPropertyOptional({ description: 'Buffer time between slots in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTime?: number;

  @ApiPropertyOptional({ description: 'Is schedule active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
