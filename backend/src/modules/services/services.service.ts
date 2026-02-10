import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const services = await this.prisma.service.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return services;
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        createdAt: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }
}
