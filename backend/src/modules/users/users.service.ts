import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { QueryUserDto, UserStatus, UpdateUserDto, ChangeRoleDto } from './dto';
import { UserRole } from '../../shared/enums';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUserDto): Promise<{ items: any[]; total: number }> {
    const { search, role, status, page = 1, limit = 10 } = query;

    const where: any = {};

    // Role filter
    if (role) {
      where.role = role;
    }

    // Status filter
    if (status && status !== UserStatus.ALL) {
      where.isActive = status === UserStatus.ACTIVE;
    }

    // Search by name or email (case-insensitive)
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Include branch info for managers
          branchManager: {
            select: {
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          // Include patient info for patients
          patient: {
            select: {
              id: true,
              dateOfBirth: true,
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Transform the response to have a simpler branch field for managers
    const transformedItems = items.map((user) => ({
      ...user,
      branch: user.branchManager?.branch || null,
      branchManager: undefined,
    }));

    return { items: transformedItems, total };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Include branch info for managers
        branchManager: {
          select: {
            id: true,
            branch: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
              },
            },
          },
        },
        // Include patient info for patients
        patient: {
          select: {
            id: true,
            dateOfBirth: true,
            address: true,
            emergencyContact: true,
            medicalHistory: true,
            allergies: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Transform the response
    return {
      ...user,
      branch: user.branchManager?.branch || null,
      branchManager: undefined,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If changing email, check uniqueness
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existing) {
        throw new ConflictException('Email is already in use by another account');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        phone: updateUserDto.phone,
        isActive: updateUserDto.isActive,
        ...(updateUserDto.email ? { email: updateUserDto.email } : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branchManager: {
          select: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            dateOfBirth: true,
          },
        },
      },
    });

    return {
      ...updatedUser,
      branch: updatedUser.branchManager?.branch || null,
      branchManager: undefined,
    };
  }

  async changeStatus(id: string, isActive: boolean, currentUserId: string) {
    // Prevent self-deactivation
    if (id === currentUserId) {
      throw new BadRequestException('Cannot change your own status');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deactivating the last admin
    if (!isActive && user.role === UserRole.ADMIN) {
      const activeAdminsCount = await this.prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (activeAdminsCount <= 1) {
        throw new ConflictException('Cannot deactivate the last active admin');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async changeRole(id: string, changeRoleDto: ChangeRoleDto, currentUserId: string) {
    // Prevent changing own role
    if (id === currentUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent removing the last admin's admin role
    if (user.role === UserRole.ADMIN && changeRoleDto.role !== UserRole.ADMIN) {
      const activeAdminsCount = await this.prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (activeAdminsCount <= 1) {
        throw new ConflictException('Cannot remove the last admin');
      }
    }

    // If changing to BRANCH_MANAGER, ensure there's a branch to assign
    // For now, we'll just change the role without branch assignment
    // Branch can be assigned later via branch management

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: changeRoleDto.role },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async resetPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Users with Google OAuth might not have a password
    if (!user.password && user.googleId) {
      throw new BadRequestException(
        'This user signed up with Google. They must set a password through their account settings.',
      );
    }

    // Generate a random temporary password (12 characters)
    const tempPassword = randomBytes(9).toString('base64').slice(0, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password reset successfully',
      tempPassword,
    };
  }

  /**
   * Change own password (requires current password verification)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has a password (Google OAuth users might not have one)
    if (!user.password) {
      throw new BadRequestException(
        'This account uses Google Sign-in. Please set a password first.',
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
