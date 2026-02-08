import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../shared/enums';
import { ROLES_KEY } from '../../shared/constants';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
