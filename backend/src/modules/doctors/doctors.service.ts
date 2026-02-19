import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserRole } from '../../shared/enums';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId?: string) {
    const where = branchId ? { branchId, isActive: true } : { isActive: true };
    
    const doctors = await this.prisma.doctor.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        phone: true,
        email: true,
        bio: true,
        branchId: true,
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return doctors;
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        phone: true,
        email: true,
        bio: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async getDoctorSchedules(doctorId: string) {
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        isActive: true,
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        slotDuration: true,
        bufferTime: true,
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return schedules;
  }

  async getAvailableSlots(doctorId: string, dateString: string, serviceId: string) {
    // Parse and validate date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
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

    // Get doctor's schedule for this day
    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      return []; // Doctor doesn't work on this day
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

    // Generate available slots
    const slots = this.calculateAvailableSlots(
      schedule.startTime,
      schedule.endTime,
      service.duration,
      schedule.bufferTime,
      existingAppointments,
    );

    return slots;
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
      
      // Check if slot exceeds doctor's end time
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

  async create(createDoctorDto: CreateDoctorDto, userBranchId: string, role: UserRole) {
    const { branchId: dtoBranchId, ...doctorData } = createDoctorDto;
    
    // Determine which branch to use
    let branchId: string;
    
    if (role === UserRole.ADMIN && dtoBranchId) {
      branchId = dtoBranchId;
    } else if (role === UserRole.BRANCH_MANAGER && userBranchId) {
      branchId = userBranchId;
    } else {
      throw new ForbiddenException('Branch ID is required');
    }

    // Check if branch exists
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, isActive: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const doctor = await this.prisma.doctor.create({
      data: {
        ...doctorData,
        branchId,
      },
    });

    return doctor;
  }

  async update(
    id: string,
    updateDoctorDto: UpdateDoctorDto,
    userBranchId: string,
    role: UserRole,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check permissions
    if (role === UserRole.BRANCH_MANAGER && doctor.branchId !== userBranchId) {
      throw new ForbiddenException('You can only update doctors in your branch');
    }

    const updated = await this.prisma.doctor.update({
      where: { id },
      data: updateDoctorDto,
    });

    return updated;
  }

  async remove(id: string, userBranchId: string, role: UserRole) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check permissions
    if (role === UserRole.BRANCH_MANAGER && doctor.branchId !== userBranchId) {
      throw new ForbiddenException('You can only delete doctors in your branch');
    }

    // Soft delete
    await this.prisma.doctor.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Doctor deactivated successfully' };
  }
}
