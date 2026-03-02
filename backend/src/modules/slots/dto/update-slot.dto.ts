import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Matches,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateSlotDto {
  @ApiPropertyOptional({ description: 'Start time (HH:mm format)', example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm format)', example: '09:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Buffer time after slot in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferTime?: number;

  @ApiPropertyOptional({ description: 'Is slot active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
