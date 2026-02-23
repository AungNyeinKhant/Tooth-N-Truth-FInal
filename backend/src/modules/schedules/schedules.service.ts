import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  QueryScheduleDto,
  BulkScheduleDto,
} from './dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all schedules for a branch with optional filters
   */
  async findAll(branchId: string, query: QueryScheduleDto) {
    const { doctorId, dayOfWeek, page = 1, limit = 10 } = query;

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
      this.prisma.doctorSchedule.findMany({
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
      this.prisma.doctorSchedule.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Get a single schedule by ID (validated for branch)
   */
  async findOne(id: string, branchId: string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
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

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.branchId !== branchId) {
      throw new ForbiddenException('You do not have access to this schedule');
    }

    return schedule;
  }

  /**
   * Create a new schedule
   */
  async create(dto: CreateScheduleDto, branchId: string) {
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

    // Check for existing schedule on same day
    const existingSchedule = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorId: dto.doctorId,
        branchId,
        dayOfWeek: dto.dayOfWeek,
        isActive: true,
      },
    });

    if (existingSchedule) {
      // Check for time overlap
      if (this.hasTimeOverlap(dto.startTime, dto.endTime, existingSchedule.startTime, existingSchedule.endTime)) {
        throw new ConflictException(
          'Schedule overlaps with existing schedule for this doctor on the same day',
        );
      }
    }

    const schedule = await this.prisma.doctorSchedule.create({
      data: {
        doctorId: dto.doctorId,
        branchId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 30,
        bufferTime: dto.bufferTime ?? 10,
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

    return schedule;
  }

  /**
   * Update a schedule
   */
  async update(id: string, dto: UpdateScheduleDto, branchId: string) {
    // Verify schedule exists and belongs to branch
    const schedule = await this.findOne(id, branchId);

    // Validate time range if both are provided
    const startTime = dto.startTime ?? schedule.startTime;
    const endTime = dto.endTime ?? schedule.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping schedules (excluding current one)
    if (dto.startTime || dto.endTime) {
      const existingSchedule = await this.prisma.doctorSchedule.findFirst({
        where: {
          doctorId: schedule.doctorId,
          branchId,
          dayOfWeek: schedule.dayOfWeek,
          isActive: true,
          id: { not: id },
        },
      });

      if (existingSchedule && this.hasTimeOverlap(startTime, endTime, existingSchedule.startTime, existingSchedule.endTime)) {
        throw new ConflictException(
          'Updated schedule overlaps with another schedule for this doctor on the same day',
        );
      }
    }

    const updatedSchedule = await this.prisma.doctorSchedule.update({
      where: { id },
      data: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration,
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

    return updatedSchedule;
  }

  /**
   * Delete a schedule (soft delete by setting isActive=false)
   */
  async remove(id: string, branchId: string) {
    // Verify schedule exists and belongs to branch
    const schedule = await this.findOne(id, branchId);

    // Check for future appointments on this day of week
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureAppointments = await this.prisma.appointment.findFirst({
      where: {
        doctorId: schedule.doctorId,
        branchId,
        appointmentDate: { gte: today },
        status: 'CONFIRMED',
      },
    });

    if (futureAppointments) {
      throw new ConflictException(
        'Cannot delete schedule. Doctor has upcoming appointments.',
      );
    }

    // Soft delete
    await this.prisma.doctorSchedule.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Schedule deleted successfully' };
  }

  /**
   * Bulk create schedules for multiple days
   */
  async bulkCreate(dto: BulkScheduleDto, branchId: string) {
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

    // Check for existing schedules on these days
    const existingSchedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId: dto.doctorId,
        branchId,
        dayOfWeek: { in: uniqueDays },
        isActive: true,
      },
    });

    // Filter out days that already have schedules
    const existingDays = existingSchedules.map((s) => s.dayOfWeek);
    const newDays = uniqueDays.filter((day) => !existingDays.includes(day));

    if (newDays.length === 0) {
      throw new ConflictException(
        'All selected days already have schedules. Please edit existing schedules instead.',
      );
    }

    // Create schedules for new days
    const schedulesToCreate = newDays.map((dayOfWeek) => ({
      doctorId: dto.doctorId,
      branchId,
      dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDuration: dto.slotDuration ?? 30,
      bufferTime: dto.bufferTime ?? 10,
      isActive: dto.isActive ?? true,
    }));

    await this.prisma.doctorSchedule.createMany({
      data: schedulesToCreate,
    });

    // Fetch created schedules
    const createdSchedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId: dto.doctorId,
        branchId,
        dayOfWeek: { in: newDays },
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
      message: `Created ${createdSchedules.length} schedules`,
      schedules: createdSchedules,
      skippedDays: existingDays,
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
