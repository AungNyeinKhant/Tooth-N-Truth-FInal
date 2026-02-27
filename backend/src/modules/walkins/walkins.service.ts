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
    const { 
      date,
      patientId,
      firstName,
      lastName,
      phone,
      reason,
      doctorId,
      slotId,
      serviceId 
    } = createWalkInDto;

    // Verify manager belongs to this branch
    const manager = await this.prisma.branchManager.findFirst({
      where: { userId: managerId, branchId },
    });

    if (!manager) {
      throw new ForbiddenException('You can only register walk-ins at your branch');
    }

    // Validate: either patientId (returning) OR firstName+lastName+phone (new patient)
    let patient;
    if (patientId) {
      // Use existing patient
      patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
    } else if (firstName && lastName && phone) {
      // Check if patient exists by phone
      patient = await this.prisma.patient.findFirst({
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
    } else {
      throw new BadRequestException('Either patientId or (firstName, lastName, phone) is required');
    }

    // Verify doctor belongs to the branch
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, branchId },
    });

    if (!doctor) {
      throw new BadRequestException('Selected doctor is not available at this branch');
    }

    // Parse appointment date
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    appointmentDate.setHours(0, 0, 0, 0);

    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Get today's date range for token generation
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

    // Determine time based on slot
    let startTime: string;
    let endTime: string;

    if (slotId) {
      // Use slot's time
      const slot = await this.prisma.doctorSlot.findFirst({
        where: {
          id: slotId,
          branchId,
          isActive: true,
        },
      });

      if (!slot) {
        throw new BadRequestException('Selected slot is not available at this branch');
      }

      // Verify slot belongs to selected doctor
      if (slot.doctorId !== doctorId) {
        throw new BadRequestException('Selected slot does not belong to the selected doctor');
      }

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
          `This slot (${slot.startTime}-${slot.endTime}) is already booked. Please choose another slot.`
        );
      }
    } else {
      // No slot selected - use current time for immediate walk-in
      const now = new Date();
      startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Get service for duration calculation
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

      // Calculate end time based on service duration
      const startMinutes = now.getHours() * 60 + now.getMinutes();
      const endMinutes = startMinutes + service.duration;
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMin = endMinutes % 60;
      endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    }

    // Get service (for slot case)
    let service;
    if (!slotId && serviceId) {
      service = await this.prisma.service.findUnique({
        where: { id: serviceId, isActive: true },
      });
    } else if (!slotId) {
      service = await this.prisma.service.findFirst({
        where: { isActive: true },
      });
    } else if (serviceId) {
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
   * Get walk-in queue for a branch (all history or filtered)
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

    // Date filter (optional - if not provided, show all)
    if (date && date !== 'all') {
      let startDate: Date;
      let endDate: Date;

      if (date === 'today') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      }

      where.checkInTime = {
        gte: startDate,
        lte: endDate,
      };
    }

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
