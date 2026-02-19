import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UserRole } from '../../shared/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    // Check if branch name already exists
    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        name: createBranchDto.name,
        isActive: true,
      },
    });

    if (existingBranch) {
      throw new ConflictException('Branch with this name already exists');
    }

    // If manager is provided, check if email already exists
    if (createBranchDto.manager) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createBranchDto.manager.email },
      });

      if (existingUser) {
        throw new ConflictException('Manager email already exists');
      }
    }

    // Use transaction to create branch and manager together
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Create the branch
      const branch = await prisma.branch.create({
        data: {
          name: createBranchDto.name,
          address: createBranchDto.address,
          phone: createBranchDto.phone,
          email: createBranchDto.email,
          isActive: createBranchDto.isActive ?? true,
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      });

      let manager = null;

      // 2. Create manager if provided
      if (createBranchDto.manager) {
        // Hash password
        const hashedPassword = await bcrypt.hash(createBranchDto.manager.password, 10);

        // Create user with BRANCH_MANAGER role
        const user = await prisma.user.create({
          data: {
            email: createBranchDto.manager.email,
            password: hashedPassword,
            firstName: createBranchDto.manager.firstName,
            lastName: createBranchDto.manager.lastName,
            phone: createBranchDto.manager.phone,
            role: UserRole.BRANCH_MANAGER,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        });

        // Create BranchManager record linking user to branch
        await prisma.branchManager.create({
          data: {
            userId: user.id,
            branchId: branch.id,
          },
        });

        manager = user;
      }

      return { branch, manager };
    });

    return result;
  }

  async findAll(query: { search?: string; status?: string; page?: number; limit?: number }) {
    const { search, status = 'active', page = 1, limit = 10 } = query;

    // Build where clause
    const where: any = {};

    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    // If status is 'all', no filter applied

    // Search filter (case-insensitive)
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.branch.count({ where });

    // Get paginated branches with manager info
    const branches = await this.prisma.branch.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        managers: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data: branches,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managers: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctors: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        services: {
          where: { isActive: true },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                duration: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async getBranchServices(branchId: string) {
    const branchServices = await this.prisma.branchService.findMany({
      where: {
        branchId,
        isActive: true,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    return branchServices.map((bs) => ({
      id: bs.service.id,
      name: bs.service.name,
      description: bs.service.description,
      duration: bs.service.duration,
      price: bs.service.price,
    }));
  }

  async getBranchDoctors(branchId: string) {
    const doctors = await this.prisma.doctor.findMany({
      where: {
        branchId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        phone: true,
        email: true,
        bio: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return doctors;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        managers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check for name conflict if name is being updated
    if (updateBranchDto.name && updateBranchDto.name !== branch.name) {
      const existingBranch = await this.prisma.branch.findFirst({
        where: {
          name: updateBranchDto.name,
          isActive: true,
          id: { not: id },
        },
      });

      if (existingBranch) {
        throw new ConflictException('Branch with this name already exists');
      }
    }

    // Use transaction for branch and manager updates
    const result = await this.prisma.$transaction(async (prisma) => {
      // Update branch
      const updatedBranch = await prisma.branch.update({
        where: { id },
        data: {
          name: updateBranchDto.name,
          address: updateBranchDto.address,
          phone: updateBranchDto.phone,
          email: updateBranchDto.email,
          isActive: updateBranchDto.isActive,
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let manager = null;

      // Update manager if provided and branch has a manager
      if (updateBranchDto.manager && branch.managers.length > 0) {
        const branchManager = branch.managers[0];
        const currentManager = branchManager.user;

        // Check for email conflict if email is being changed
        if (updateBranchDto.manager.email && updateBranchDto.manager.email !== currentManager.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: updateBranchDto.manager.email },
          });

          if (existingUser) {
            throw new ConflictException('Manager email already exists');
          }
        }

        // Prepare update data
        const managerUpdateData: any = {};
        if (updateBranchDto.manager.firstName !== undefined) {
          managerUpdateData.firstName = updateBranchDto.manager.firstName;
        }
        if (updateBranchDto.manager.lastName !== undefined) {
          managerUpdateData.lastName = updateBranchDto.manager.lastName;
        }
        if (updateBranchDto.manager.email !== undefined) {
          managerUpdateData.email = updateBranchDto.manager.email;
        }
        if (updateBranchDto.manager.phone !== undefined) {
          managerUpdateData.phone = updateBranchDto.manager.phone;
        }
        // Only update password if provided
        if (updateBranchDto.manager.password) {
          managerUpdateData.password = await bcrypt.hash(updateBranchDto.manager.password, 10);
        }

        // Update manager user
        const updatedManager = await prisma.user.update({
          where: { id: currentManager.id },
          data: managerUpdateData,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        });

        manager = updatedManager;
      }

      return { branch: updatedBranch, manager };
    });

    return result;
  }

  async remove(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Soft delete - set isActive to false
    await this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Branch deactivated successfully' };
  }
}
