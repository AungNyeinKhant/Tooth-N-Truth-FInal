import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../shared/enums';

export class ChangeRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: UserRole.BRANCH_MANAGER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
