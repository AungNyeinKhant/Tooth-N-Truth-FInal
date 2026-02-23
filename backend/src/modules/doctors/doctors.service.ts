import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto, QueryDoctorDto, DoctorStatus } from './dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryDoctorDto): Promise<{ items: any[]; total: number }> {
    const { search, status, branchId, specialization, page = 1, limit = 10 } = query;
    
    const where: any = {};
    
    // Status filter
    if (status && status !== DoctorStatus.ALL) {
      where.isActive = status === DoctorStatus.ACTIVE;
    }

    // Branch filter
    if (branchId) {
      where.branchId = branchId;
    }

    // Specialization filter (case-insensitive)
    if (specialization) {
      where.specialization = {
        contains: specialization,
        mode: 'insensitive',
      };
    }

    // Search by name (first or last name, case-insensitive)
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialization: true,
          phone: true,
          email: true,
          bio: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        phone: true,
        email: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async getDoctorSlots(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Get doctor's slots
    const slots = await this.prisma.doctorSlot.findMany({
      where: {
        doctorId,
        isActive: true,
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        bufferTime: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return slots;
  }

  async getAvailableSlots(doctorId: string, dateString: string, serviceId: string) {
    // Parse and validate date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    // Get doctor
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { branchId: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Get service duration
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();

    // Get all slots for this doctor on this day
    const slots = await this.prisma.doctorSlot.findMany({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (slots.length === 0) {
      return []; // Doctor doesn't have slots on this day
    }

    // Get existing appointments for this doctor on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'CONFIRMED',
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate available slots from each slot definition
    const availableSlots: Array<{ startTime: string; endTime: string }> = [];

    for (const slot of slots) {
      const slotAvailable = this.calculateAvailableSlots(
        slot.startTime,
        slot.endTime,
        service.duration,
        slot.bufferTime,
        existingAppointments,
      );
      availableSlots.push(...slotAvailable);
    }

    // Sort by start time
    availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return availableSlots;
  }

  private calculateAvailableSlots(
    startTime: string,
    endTime: string,
    serviceDuration: number,
    bufferTime: number,
    existingAppointments: Array<{ startTime: string; endTime: string }>,
  ): Array<{ startTime: string; endTime: string }> {
    const slots: Array<{ startTime: string; endTime: string }> = [];
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new BadRequestException('Invalid schedule time format');
    }
    
    // Parse start and end times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (true) {
      // Calculate slot end time
      let slotEndHour = currentHour;
      let slotEndMin = currentMin + serviceDuration;
      
      while (slotEndMin >= 60) {
        slotEndHour++;
        slotEndMin -= 60;
      }
      
      // Check if slot exceeds branch end time
      if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMin > endMin)) {
        break;
      }
      
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      const slotEnd = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`;
      
      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some((apt) => {
        const aptStart = apt.startTime;
        const aptEnd = apt.endTime;
        
        // Check overlap
        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        );
      });
      
      if (!hasConflict) {
        slots.push({ startTime: slotStart, endTime: slotEnd });
      }
      
      // Move to next slot (including buffer time)
      currentMin += serviceDuration + bufferTime;
      while (currentMin >= 60) {
        currentHour++;
        currentMin -= 60;
      }
    }
    
    return slots;
  }

  async create(createDoctorDto: CreateDoctorDto) {
    // Check if branch exists
    const branch = await this.prisma.branch.findFirst({
      where: { id: createDoctorDto.branchId, isActive: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check for duplicate email if provided
    if (createDoctorDto.email) {
      const existingDoctor = await this.prisma.doctor.findUnique({
        where: { email: createDoctorDto.email },
      });

      if (existingDoctor) {
        throw new ConflictException('Doctor with this email already exists');
      }
    }

    // Create doctor (no auto-schedule creation - schedules are branch-wide)
    const doctor = await this.prisma.doctor.create({
      data: {
        firstName: createDoctorDto.firstName,
        lastName: createDoctorDto.lastName,
        specialization: createDoctorDto.specialization,
        phone: createDoctorDto.phone,
        email: createDoctorDto.email,
        bio: createDoctorDto.bio,
        branchId: createDoctorDto.branchId,
        isActive: createDoctorDto.isActive ?? true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        phone: true,
        email: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return doctor;
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check for duplicate email if email is being updated
    if (updateDoctorDto.email && updateDoctorDto.email !== doctor.email) {
      const existingDoctor = await this.prisma.doctor.findUnique({
        where: { email: updateDoctorDto.email },
      });

      if (existingDoctor) {
        throw new ConflictException('Doctor with this email already exists');
      }
    }

    // Check if new branch exists if branchId is being updated
    if (updateDoctorDto.branchId && updateDoctorDto.branchId !== doctor.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: updateDoctorDto.branchId, isActive: true },
      });

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    const updatedDoctor = await this.prisma.doctor.update({
      where: { id },
      data: {
        firstName: updateDoctorDto.firstName,
        lastName: updateDoctorDto.lastName,
        specialization: updateDoctorDto.specialization,
        phone: updateDoctorDto.phone,
        email: updateDoctorDto.email,
        bio: updateDoctorDto.bio,
        branchId: updateDoctorDto.branchId,
        isActive: updateDoctorDto.isActive,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        phone: true,
        email: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedDoctor;
  }

  async remove(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 1,
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if doctor has any appointments
    if (doctor.appointments.length > 0) {
      throw new ConflictException(
        'Cannot delete doctor with existing appointments.',
      );
    }

    // Hard delete (no schedule cascade - schedules are branch-wide)
    await this.prisma.doctor.delete({
      where: { id },
    });

    return { message: 'Doctor deleted successfully' };
  }
}
