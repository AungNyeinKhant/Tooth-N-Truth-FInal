import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return branches;
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        createdAt: true,
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
}
