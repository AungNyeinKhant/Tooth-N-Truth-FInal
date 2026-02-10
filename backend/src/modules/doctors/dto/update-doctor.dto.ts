import { IsString, IsOptional, Length, IsEmail, IsBoolean } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  specialization?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
