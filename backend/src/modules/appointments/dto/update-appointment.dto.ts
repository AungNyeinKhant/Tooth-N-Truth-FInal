import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  cancelReason?: string;
}
