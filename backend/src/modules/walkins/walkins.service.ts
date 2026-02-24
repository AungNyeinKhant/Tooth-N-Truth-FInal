import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreateWalkInDto,
  UpdateWalkInStatusDto,
  ConvertToAppointmentDto,
  QueryWalkInDto,
  WalkInStatus,
} from './dto';

// Day names for slot display
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class WalkinsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new walk-in patient
   * Generates a token number based on today's walk-in count for the branch
   */
  async create(
    branchId: string,
    createWalkInDto: CreateWalkInDto,
    managerId: string,
  ) {
    const { firstName, lastName, phone, reason, preferredDoctorId, slotId, serviceId } =
      createWalkInDto;

    // Verify manager belongs to this branch
    const manager = await this.prisma.branchManager.findFirst({
      where: { userId: managerId, branchId },
    });

    if (!manager) {
      throw new ForbiddenException('You can only register walk-ins at your branch');
    }

    // Find existing patient by phone number
    let patient = await this.prisma.patient.findFirst({
      where: {
        user: {
          phone: phone,
        },
      },
      include: { user: true },
    });

    if (!patient) {
      // Create new patient with unique temp email
      const tempEmail = `walkin-${randomUUID()}@temp.toothandtruth.com`;
      const user = await this.prisma.user.create({
        data: {
          email: tempEmail,
          password: '', // No password for walk-in temp accounts
          role: 'PATIENT',
          firstName,
          lastName,
          phone: phone,
          isActive: true,
        },
      });

      // Create patient record
      patient = await this.prisma.patient.create({
        data: {
          userId: user.id,
        },
        include: { user: true },
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count today's walk-ins for this branch to generate token
    const todayWalkInsCount = await this.prisma.appointment.count({
      where: {
        branchId,
        isWalkIn: true,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Generate token number (e.g., W001, W002)
    const tokenNumber = `W${String(todayWalkInsCount + 1).padStart(3, '0')}`;

    // Determine doctor and time based on slot or preference
    let doctorId: string;
    let appointmentDate: Date;
    let startTime: string;
    let endTime: string;

    if (slotId) {
      // Use slot's doctor and time
      const slot = await this.prisma.doctorSlot.findFirst({
        where: {
          id: slotId,
          branchId,
          isActive: true,
        },
        include: {
          doctor: true,
        },
      });

      if (!slot) {
        throw new BadRequestException('Selected slot is not available at this branch');
      }

      doctorId = slot.doctorId;

      // Calculate appointment date based on slot's day of week
      // Find next occurrence of that day
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      let daysUntilSlot = slot.dayOfWeek - currentDayOfWeek;
      if (daysUntilSlot < 0) {
        daysUntilSlot += 7; // Next week
      } else if (daysUntilSlot === 0) {
        // Same day - check if slot time has passed
        const [slotStartHour, slotStartMin] = slot.startTime.split(':').map(Number);
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        if (currentHour > slotStartHour || (currentHour === slotStartHour && currentMin >= slotStartMin)) {
          daysUntilSlot = 7; // Next week
        }
      }
      
      appointmentDate = new Date(now);
      appointmentDate.setDate(appointmentDate.getDate() + daysUntilSlot);
      appointmentDate.setHours(0, 0, 0, 0);

      startTime = slot.startTime;
      endTime = slot.endTime;

      // Check for time conflicts with existing appointments
      const conflictingAppointment = await this.prisma.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          status: 'CONFIRMED',
        },
      });

      if (conflictingAppointment) {
        throw new BadRequestException(
          `This slot (${DAY_NAMES[slot.dayOfWeek]} ${slot.startTime}-${slot.endTime}) is already booked. Please choose another slot.`
        );
      }
    } else {
      // Use preferred doctor or auto-assign
      doctorId = preferredDoctorId || '';
      
      if (!doctorId) {
        // Find an available doctor in the branch
        const availableDoctor = await this.prisma.doctor.findFirst({
          where: {
            branchId,
            isActive: true,
          },
        });
        if (availableDoctor) {
          doctorId = availableDoctor.id;
        } else {
          throw new BadRequestException('No doctors available at this branch');
        }
      }

      // Verify doctor belongs to the branch
      const doctor = await this.prisma.doctor.findFirst({
        where: { id: doctorId, branchId },
      });

      if (!doctor) {
        throw new BadRequestException(
          'Selected doctor is not available at this branch',
        );
      }

      // Use current time
      appointmentDate = today;
      const now = new Date();
      startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // End time will be calculated based on service duration below
      endTime = startTime; // Temporary, will be updated
    }

    // Get service (default to first active service if not specified)
    let service;
    if (serviceId) {
      service = await this.prisma.service.findUnique({
        where: { id: serviceId, isActive: true },
      });
    } else {
      service = await this.prisma.service.findFirst({
        where: { isActive: true },
      });
    }

    if (!service) {
      throw new BadRequestException('No active service found');
    }

    // Calculate end time based on service duration (if not using slot)
    if (!slotId) {
      const now = new Date();
      const startMinutes = now.getHours() * 60 + now.getMinutes();
      const endMinutes = startMinutes + service.duration;
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMin = endMinutes % 60;
      endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    }

    // Create the walk-in appointment
    const walkIn = await this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        branchId,
        serviceId: service.id,
        appointmentDate,
        startTime,
        endTime,
        status: 'CONFIRMED',
        notes: reason,
        isWalkIn: true,
        tokenNumber,
        checkInTime: new Date(),
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...walkIn,
      waitTime: 0, // Just created, no wait time yet
    };
  }

  /**
   * Get walk-in queue for a branch
   */
  async getQueue(branchId: string, query: QueryWalkInDto, managerId: string) {
    const { status, date, search, page = 1, limit = 20 } = query;

    // Verify manager belongs to this branch
    const manager = await this.prisma.branchManager.findFirst({
      where: { userId: managerId, branchId },
    });

    if (!manager) {
      throw new ForbiddenException('You can only view walk-ins at your branch');
    }

    // Build where clause
    const where: any = {
      branchId,
      isWalkIn: true,
    };

    // Date filter (default to today)
    let dateFilter = date || 'today';
    let startDate: Date;
    let endDate: Date;

    if (dateFilter === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(dateFilter);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);
    }

    where.checkInTime = {
      gte: startDate,
      lte: endDate,
    };

    // Map walk-in status to appointment status
    if (status) {
      if (status === WalkInStatus.WAITING) {
        // Waiting means confirmed but not yet with doctor
        where.status = 'CONFIRMED';
        where.notes = { not: { contains: '[IN_PROGRESS]' } };
      } else if (status === WalkInStatus.IN_PROGRESS) {
        where.notes = { contains: '[IN_PROGRESS]' };
      } else if (status === WalkInStatus.COMPLETED) {
        where.status = 'COMPLETED';
      } else if (status === WalkInStatus.CANCELLED) {
        where.status = 'CANCELLED';
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          patient: {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
        { tokenNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.appointment.count({ where });

    // Get walk-ins with pagination, sorted by token number
    const items = await this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
      orderBy: [{ tokenNumber: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate wait time for each walk-in
    const now = new Date();
    const walkinsWithWaitTime = items.map((item) => {
      let waitTime = 0;
      if (item.checkInTime) {
        waitTime = Math.floor(
          (now.getTime() - item.checkInTime.getTime()) / (1000 * 60),
        );
      }

      // Determine display status
      let displayStatus = WalkInStatus.WAITING;
      if (item.status === 'COMPLETED') {
        displayStatus = WalkInStatus.COMPLETED;
      } else if (item.status === 'CANCELLED') {
        displayStatus = WalkInStatus.CANCELLED;
      } else if (item.notes?.includes('[IN_PROGRESS]')) {
        displayStatus = WalkInStatus.IN_PROGRESS;
      }

      return {
        ...item,
        waitTime,
        displayStatus,
      };
    });

    return { items: walkinsWithWaitTime, total };
  }

  /**
   * Get single walk-in details
   */
  async findOne(id: string, branchId: string, managerId: string) {
    // Verify manager belongs to this branch
    const manager = await this.prisma.branchManager.findFirst({
      where: { userId: managerId, branchId },
    });

    if (!manager) {
      throw new ForbiddenException('You can only view walk-ins at your branch');
    }

    const walkIn = await this.prisma.appointment.findFirst({
      where: {
        id,
        branchId,
        isWalkIn: true,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!walkIn) {
      throw new NotFoundException('Walk-in not found');
    }

    // Calculate wait time
    let waitTime = 0;
    if (walkIn.checkInTime) {
      waitTime = Math.floor(
        (new Date().getTime() - walkIn.checkInTime.getTime()) / (1000 * 60),
      );
    }

    // Determine display status
    let displayStatus = WalkInStatus.WAITING;
    if (walkIn.status === 'COMPLETED') {
      displayStatus = WalkInStatus.COMPLETED;
    } else if (walkIn.status === 'CANCELLED') {
      displayStatus = WalkInStatus.CANCELLED;
    } else if (walkIn.notes?.includes('[IN_PROGRESS]')) {
      displayStatus = WalkInStatus.IN_PROGRESS;
    }

    return {
      ...walkIn,
      waitTime,
      displayStatus,
    };
  }

  /**
   * Update walk-in status
   */
  async updateStatus(
    id: string,
    branchId: string,
    updateDto: UpdateWalkInStatusDto,
    managerId: string,
  ) {
    const { status, doctorId, cancelReason, notes } = updateDto;

    // Verify manager belongs to this branch
    const manager = await this.prisma.branchManager.findFirst({
      where: { userId: managerId, branchId },
    });

    if (!manager) {
      throw new ForbiddenException('You can only update walk-ins at your branch');
    }

    // Get the walk-in
    const walkIn = await this.prisma.appointment.findFirst({
      where: { id, branchId, isWalkIn: true },
    });

    if (!walkIn) {
      throw new NotFoundException('Walk-in not found');
    }

    // Build update data
    const updateData: any = {};

    switch (status) {
      case WalkInStatus.ASSIGNED:
        if (!doctorId) {
          throw new BadRequestException('Doctor ID is required when assigning');
        }
        // Verify doctor belongs to the branch
        const doctor = await this.prisma.doctor.findFirst({
          where: { id: doctorId, branchId },
        });
        if (!doctor) {
          throw new BadRequestException(
            'Selected doctor is not available at this branch',
          );
        }
        updateData.doctorId = doctorId;
        updateData.status = 'CONFIRMED';
        break;

      case WalkInStatus.IN_PROGRESS:
        // Mark as in progress by adding a tag to notes
        updateData.notes = notes
          ? `${walkIn.notes || ''}\n[IN_PROGRESS] ${notes}`
          : `${walkIn.notes || ''}\n[IN_PROGRESS]`;
        break;

      case WalkInStatus.COMPLETED:
        updateData.status = 'COMPLETED';
        if (notes) {
          updateData.notes = `${walkIn.notes || ''}\n${notes}`;
        }
        break;

      case WalkInStatus.CANCELLED:
        if (!cancelReason) {
          throw new BadRequestException(
            'Cancel reason is required when cancelling',
          );
        }
        updateData.status = 'CANCELLED';
        updateData.cancelReason = cancelReason;
        break;

      case WalkInStatus.WAITING:
        // Revert to waiting status
        updateData.status = 'CONFIRMED';
        updateData.notes = (walkIn.notes || '').replace(/\[IN_PROGRESS\].*/g, '').trim();
        break;
    }

    // Update the walk-in
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    // Calculate wait time
    let waitTime = 0;
    if (updated.checkInTime) {
      waitTime = Math.floor(
        (new Date().getTime() - updated.checkInTime.getTime()) / (1000 * 60),
      );
    }

    // Determine display status
    let displayStatus = WalkInStatus.WAITING;
    if (updated.status === 'COMPLETED') {
      displayStatus = WalkInStatus.COMPLETED;
    } else if (updated.status === 'CANCELLED') {
      displayStatus = WalkInStatus.CANCELLED;
    } else if (updated.notes?.includes('[IN_PROGRESS]')) {
      displayStatus = WalkInStatus.IN_PROGRESS;
    }

    return {
      ...updated,
      waitTime,
      displayStatus,
    };
  }

  /**
   * Convert walk-in to a scheduled appointment
   */
  async convertToAppointment(
    id: string,
    branchId: string,
    convertDto: ConvertToAppointmentDto,
    managerId: string,
  ) {
    const { doctorId, appointmentDate, startTime } = convertDto;

    // Verify manager belongs to this branch
    const manager = await this.prisma.branchManager.findFirst({
      where: { userId: managerId, branchId },
    });

    if (!manager) {
      throw new ForbiddenException(
        'You can only convert walk-ins at your branch',
      );
    }

    // Get the walk-in
    const walkIn = await this.prisma.appointment.findFirst({
      where: { id, branchId, isWalkIn: true },
      include: {
        service: true,
      },
    });

    if (!walkIn) {
      throw new NotFoundException('Walk-in not found');
    }

    // Verify doctor belongs to the branch
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, branchId },
    });

    if (!doctor) {
      throw new BadRequestException(
        'Selected doctor is not available at this branch',
      );
    }

    // Calculate end time
    const [startHour, startMin] = startTime.split(':').map(Number);
    let endHour = startHour;
    let endMin = startMin + (walkIn.service?.duration || 30);
    while (endMin >= 60) {
      endHour++;
      endMin -= 60;
    }
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    // Check for conflicts
    const dateObj = new Date(appointmentDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
        status: 'CONFIRMED',
        id: { not: id },
      },
    });

    if (conflictingAppointment) {
      throw new BadRequestException(
        'This time slot conflicts with an existing appointment',
      );
    }

    // Update the appointment
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        doctorId,
        appointmentDate: dateObj,
        startTime,
        endTime,
        isWalkIn: false,
        tokenNumber: null,
        status: 'CONFIRMED',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...updated,
      message: 'Walk-in converted to appointment successfully',
    };
  }
}
