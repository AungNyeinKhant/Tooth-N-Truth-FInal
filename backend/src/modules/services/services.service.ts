import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto, ServiceStatus } from './dto/query-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Convert Prisma Decimal to number for API responses
   */
  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    return Number(value);
  }

  /**
   * Transform service data to ensure price is a number
   */
  private transformService(service: any) {
    return {
      ...service,
      price: this.toNumber(service.price),
    };
  }

  async findAll(query: QueryServiceDto) {
    const { search, status, page = 1, limit = 10 } = query;
    
    const where: any = {};
    
    // Search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }
    
    // Filter by status
    if (status && status !== ServiceStatus.ALL) {
      where.isActive = status === ServiceStatus.ACTIVE;
    }
    
    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    // Transform services to convert Decimal price to number
    const transformedServices = services.map(service => this.transformService(service));

    return {
      data: transformedServices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.transformService(service);
  }

  async create(createServiceDto: CreateServiceDto) {
    // Check if service name already exists
    const existingService = await this.prisma.service.findFirst({
      where: {
        name: {
          equals: createServiceDto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingService) {
      throw new ConflictException('Service with this name already exists');
    }

    const service = await this.prisma.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        duration: createServiceDto.duration,
        price: createServiceDto.price,
        isActive: createServiceDto.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.transformService(service);
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check for name conflict if name is being updated
    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.prisma.service.findFirst({
        where: {
          name: {
            equals: updateServiceDto.name,
            mode: 'insensitive',
          },
          id: { not: id },
        },
      });

      if (existingService) {
        throw new ConflictException('Service with this name already exists');
      }
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: {
        name: updateServiceDto.name,
        description: updateServiceDto.description,
        duration: updateServiceDto.duration,
        price: updateServiceDto.price,
        isActive: updateServiceDto.isActive,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.transformService(updatedService);
  }

  async remove(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 1,
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Soft delete - set isActive to false
    await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Service deactivated successfully' };
  }
}
