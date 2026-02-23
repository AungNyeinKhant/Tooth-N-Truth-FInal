import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreateSlotDto,
  UpdateSlotDto,
  QuerySlotDto,
  BulkSlotDto,
} from './dto';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all slots for a branch with optional filters
   */
  async findAll(branchId: string, query: QuerySlotDto) {
    const { doctorId, dayOfWeek, page = 1, limit = 100 } = query;

    const where: any = {
      branchId,
      isActive: true,
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    const [items, total] = await Promise.all([
      this.prisma.doctorSlot.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialization: true,
            },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.doctorSlot.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Get a single slot by ID (validated for branch)
   */
  async findOne(id: string, branchId: string) {
    const slot = await this.prisma.doctorSlot.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    if (slot.branchId !== branchId) {
      throw new ForbiddenException('You do not have access to this slot');
    }

    return slot;
  }

  /**
   * Create a new slot with overlap validation
   */
  async create(dto: CreateSlotDto, branchId: string) {
    // Verify doctor exists and belongs to the branch
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (doctor.branchId !== branchId) {
      throw new ForbiddenException('Doctor does not belong to your branch');
    }

    // Validate time range
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping slots for the same doctor on the same day
    const existingSlots = await this.prisma.doctorSlot.findMany({
      where: {
        doctorId: dto.doctorId,
        branchId,
        dayOfWeek: dto.dayOfWeek,
        isActive: true,
      },
    });

    for (const existing of existingSlots) {
      if (this.hasTimeOverlap(dto.startTime, dto.endTime, existing.startTime, existing.endTime)) {
        throw new ConflictException(
          `Slot overlaps with existing slot (${existing.startTime} - ${existing.endTime}) for this doctor on the same day`,
        );
      }
    }

    const slot = await this.prisma.doctorSlot.create({
      data: {
        branchId,
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        bufferTime: dto.bufferTime ?? 5,
        isActive: dto.isActive ?? true,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
    });

    return slot;
  }

  /**
   * Update a slot with overlap validation
   */
  async update(id: string, dto: UpdateSlotDto, branchId: string) {
    // Verify slot exists and belongs to branch
    const slot = await this.findOne(id, branchId);

    // Validate time range if both are provided
    const startTime = dto.startTime ?? slot.startTime;
    const endTime = dto.endTime ?? slot.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping slots (excluding current one)
    if (dto.startTime || dto.endTime) {
      const existingSlots = await this.prisma.doctorSlot.findMany({
        where: {
          doctorId: slot.doctorId,
          branchId,
          dayOfWeek: slot.dayOfWeek,
          isActive: true,
          id: { not: id },
        },
      });

      for (const existing of existingSlots) {
        if (this.hasTimeOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
          throw new ConflictException(
            `Updated slot overlaps with existing slot (${existing.startTime} - ${existing.endTime}) for this doctor on the same day`,
          );
        }
      }
    }

    const updatedSlot = await this.prisma.doctorSlot.update({
      where: { id },
      data: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        bufferTime: dto.bufferTime,
        isActive: dto.isActive,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
    });

    return updatedSlot;
  }

  /**
   * Delete a slot (soft delete by setting isActive=false)
   */
  async remove(id: string, branchId: string) {
    // Verify slot exists and belongs to branch
    const slot = await this.findOne(id, branchId);

    // Soft delete
    await this.prisma.doctorSlot.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Slot deleted successfully' };
  }

  /**
   * Bulk create slots for multiple days for one doctor
   */
  async bulkCreate(dto: BulkSlotDto, branchId: string) {
    // Verify doctor exists and belongs to the branch
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (doctor.branchId !== branchId) {
      throw new ForbiddenException('Doctor does not belong to your branch');
    }

    // Validate time range
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Get unique days
    const uniqueDays = [...new Set(dto.days)];

    // Check for existing slots on these days that would overlap
    const existingSlots = await this.prisma.doctorSlot.findMany({
      where: {
        doctorId: dto.doctorId,
        branchId,
        dayOfWeek: { in: uniqueDays },
        isActive: true,
      },
    });

    // Group existing slots by day
    const slotsByDay: Record<number, typeof existingSlots> = {};
    for (const slot of existingSlots) {
      if (!slotsByDay[slot.dayOfWeek]) {
        slotsByDay[slot.dayOfWeek] = [];
      }
      slotsByDay[slot.dayOfWeek].push(slot);
    }

    // Check for overlaps and determine which days can have slots created
    const daysWithOverlap: number[] = [];
    const daysToCreate: number[] = [];

    for (const day of uniqueDays) {
      const daySlots = slotsByDay[day] || [];
      let hasOverlap = false;

      for (const existing of daySlots) {
        if (this.hasTimeOverlap(dto.startTime, dto.endTime, existing.startTime, existing.endTime)) {
          hasOverlap = true;
          break;
        }
      }

      if (hasOverlap) {
        daysWithOverlap.push(day);
      } else {
        daysToCreate.push(day);
      }
    }

    if (daysToCreate.length === 0) {
      throw new ConflictException(
        'All selected days have overlapping slots. Please edit existing slots instead.',
      );
    }

    // Create slots for valid days
    const slotsToCreate = daysToCreate.map((dayOfWeek) => ({
      branchId,
      doctorId: dto.doctorId,
      dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      bufferTime: dto.bufferTime ?? 5,
      isActive: dto.isActive ?? true,
    }));

    await this.prisma.doctorSlot.createMany({
      data: slotsToCreate,
    });

    // Fetch created slots
    const createdSlots = await this.prisma.doctorSlot.findMany({
      where: {
        doctorId: dto.doctorId,
        branchId,
        dayOfWeek: { in: daysToCreate },
        startTime: dto.startTime,
        endTime: dto.endTime,
        isActive: true,
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return {
      message: `Created ${createdSlots.length} slots`,
      slots: createdSlots,
      skippedDays: daysWithOverlap,
    };
  }

  /**
   * Get all doctors in a branch (helper for frontend dropdown)
   */
  async getDoctors(branchId: string) {
    return this.prisma.doctor.findMany({
      where: {
        branchId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  /**
   * Helper: Check if two time ranges overlap
   * Overlap if: start1 < end2 AND end1 > start2
   */
  private hasTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    return start1 < end2 && end1 > start2;
  }
}
