import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserRole } from '../../shared/enums';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';

export interface AdminAppointmentsQuery {
  status?: string;
  branchId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  orderBy?: string;
  page: number;
  limit: number;
}

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async getAdminAppointments(query: AdminAppointmentsQuery): Promise<{ items: any[]; total: number }> {
    const {
      status,
      branchId,
      doctorId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Branch filter
    if (branchId) {
      where.branchId = branchId;
    }

    // Doctor filter
    if (doctorId) {
      where.doctorId = doctorId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.appointmentDate.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.appointmentDate.lte = end;
      }
    }

    // Search by patient name, email, or phone
    if (search) {
      where.OR = [
        {
          patient: {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Order by
    let orderByClause: any = [{ appointmentDate: 'desc' }, { startTime: 'asc' }];
    if (query.orderBy === 'appointmentDate_asc') orderByClause = [{ appointmentDate: 'asc' }, { startTime: 'asc' }];
    else if (query.orderBy === 'createdAt_desc') orderByClause = [{ createdAt: 'desc' }];
    else if (query.orderBy === 'appointmentDate_desc') orderByClause = [{ appointmentDate: 'desc' }, { startTime: 'asc' }];

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
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
          branch: {
            select: {
              id: true,
              name: true,
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
        },
        orderBy: orderByClause,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { items, total };
  }

  /**
    * Get appointments for branch manager (scoped to their branch)
    */
  async getManagerAppointments(
    branchId: string,
    query: {
      status?: string;
      date?: string;
      startDate?: string;
      endDate?: string;
      doctorId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: any[]; total: number }> {
    const {
      status,
      date,
      startDate,
      endDate,
      doctorId,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {
      branchId,
    };

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Doctor filter
    if (doctorId) {
      where.doctorId = doctorId;
    }

    // Date filter (specific date OR range)
    if (date) {
      // Specific date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      where.appointmentDate = {
        gte: targetDate,
        lt: nextDate,
      };
    } else if (startDate || endDate) {
      // Date range
      where.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.appointmentDate.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.appointmentDate.lte = end;
      }
    }

    // Search by patient name
    if (search) {
      where.OR = [
        {
          patient: {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
        { tokenNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
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
          branch: {
            select: {
              id: true,
              name: true,
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
        },
        orderBy: [
          { appointmentDate: 'desc' },
          { startTime: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Reschedule an appointment (manager only)
   */
  async reschedule(
    id: string,
    branchId: string,
    doctorId: string,
    appointmentDate: string,
    startTime: string,
  ) {
    // Find the appointment
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, branchId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify doctor belongs to branch
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, branchId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor does not belong to this branch');
    }

    // Parse date to get day of week
    const [reschYear, reschMonth, reschDay] = appointmentDate.split('-').map(Number);
    const reschDateObj = new Date(reschYear, reschMonth - 1, reschDay);
    const reschDayOfWeek = reschDateObj.getDay();

    // Look up the doctor's slot to get end time
    const doctorSlotResch = await this.prisma.doctorSlot.findFirst({
      where: {
        doctorId,
        dayOfWeek: reschDayOfWeek,
        startTime,
        isActive: true,
      },
    });

    if (!doctorSlotResch) {
      throw new BadRequestException('Selected time slot is not available');
    }

    // Use slot's end time instead of calculating based on service duration
    const endTime = doctorSlotResch.endTime;

    // Parse date string in local time (matching doctors service)
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0);
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);

    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId,
        appointmentDate: {
          gte: dateObj,
          lt: nextDate,
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: 'CONFIRMED',
      },
    });

    if (conflicting) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Update the appointment
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        doctorId,
        appointmentDate: dateObj,
        startTime,
        endTime,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
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

    return updated;
  }

  /**
   * Update appointment status (manager only)
   */
  async updateStatus(
    id: string,
    branchId: string,
    status: string,
    reason?: string,
    notes?: string,
  ) {
    // Find the appointment
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, branchId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updateData: any = { status };

    if (status === 'CANCELLED' && reason) {
      updateData.cancelReason = reason;
    }

    if (notes) {
      updateData.notes = notes;
    }

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
                email: true,
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

    return updated;
  }

  /**
   * Create appointment for existing patient (manager only)
   */
  async managerCreate(
    branchId: string,
    patientId: string,
    doctorId: string,
    serviceId: string,
    appointmentDate: string,
    startTime: string,
    notes?: string,
  ) {
    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Verify doctor belongs to branch
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, branchId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor does not belong to this branch');
    }

    // Parse date to get day of week
    const [mgrYear, mgrMonth, mgrDay] = appointmentDate.split('-').map(Number);
    const mgrDateObj = new Date(mgrYear, mgrMonth - 1, mgrDay);
    const mgrDayOfWeek = mgrDateObj.getDay();

    // Look up the doctor's slot to get end time
    const doctorSlotMgr = await this.prisma.doctorSlot.findFirst({
      where: {
        doctorId,
        dayOfWeek: mgrDayOfWeek,
        startTime,
        isActive: true,
      },
    });

    if (!doctorSlotMgr) {
      throw new BadRequestException('Selected time slot is not available');
    }

    // Use slot's end time instead of calculating based on service duration
    const endTime = doctorSlotMgr.endTime;

    // Parse date string in local time (matching doctors service)
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0);
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);

    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: {
          gte: dateObj,
          lt: nextDate,
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        status: 'CONFIRMED',
      },
    });

    if (conflicting) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        branchId,
        serviceId,
        appointmentDate: dateObj,
        startTime,
        endTime,
        status: 'CONFIRMED',
        notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
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

    return appointment;
  }

  /**
   * Search patients by phone or name (manager only)
   */
  async searchPatients(branchId: string, phone?: string, name?: string) {
    const where: any = {};

    if (phone) {
      where.user = {
        phone: { contains: phone, mode: 'insensitive' },
      };
    } else if (name) {
      where.user = {
        OR: [
          { firstName: { contains: name, mode: 'insensitive' } },
          { lastName: { contains: name, mode: 'insensitive' } },
        ],
      };
    }

    const patients = await this.prisma.patient.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      take: 20,
    });

    return patients;
  }

  async findAll(
    userId: string,
    role: UserRole,
    branchId: string,
    status?: string,
    date?: string,
  ) {
    const where: any = {};

    // Role-based filtering
    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (patient) {
        where.patientId = patient.id;
      }
    } else if (role === UserRole.BRANCH_MANAGER && branchId) {
      where.branchId = branchId;
    }
    // Admin sees all (no filter)

    // Optional filters
    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.appointmentDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return appointments;
  }

  async getPatientAppointments(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        branch: {
          select: {
            name: true,
            address: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    // Return appointments with appointmentDate as full ISO string
    // (do NOT strip to YYYY-MM-DD because that gives the UTC date, not local date)
    const transformed = appointments.map(apt => ({
      ...apt,
      appointmentDate: apt.appointmentDate instanceof Date
        ? apt.appointmentDate.toISOString()
        : String(apt.appointmentDate),
    }));

    return transformed;
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true,
            phone: true,
          },
        },
        branch: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permissions
    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!patient || appointment.patientId !== patient.id) {
        throw new ForbiddenException('You can only view your own appointments');
      }
    } else if (role === UserRole.BRANCH_MANAGER) {
      const manager = await this.prisma.branchManager.findUnique({
        where: { userId },
        select: { branchId: true },
      });
      if (manager && appointment.branchId !== manager.branchId) {
        throw new ForbiddenException('You can only view appointments in your branch');
      }
    }

    return appointment;
  }

  async create(createAppointmentDto: CreateAppointmentDto, userId: string) {
    const { branchId, doctorId, serviceId, appointmentDate, startTime, notes } =
      createAppointmentDto;

    // Get patient ID from user ID
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    // Parse date to get day of week
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // Look up the doctor's slot to get end time
    const doctorSlot = await this.prisma.doctorSlot.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        startTime,
        isActive: true,
      },
    });

    if (!doctorSlot) {
      throw new BadRequestException('Selected time slot is not available');
    }

    // Validate and parse start time
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(startTime)) {
      throw new BadRequestException('Invalid time format. Use HH:mm format (e.g., 09:00)');
    }

    // Use slot's end time instead of calculating based on service duration
    const endTime = doctorSlot.endTime;

    // Use already parsed date for conflict check
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        startTime: {
          lte: endTime,
        },
        endTime: {
          gte: startTime,
        },
        status: 'CONFIRMED',
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('This time slot is no longer available');
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        branchId,
        serviceId,
        appointmentDate: dateObj,
        startTime,
        endTime,
        notes,
        status: 'CONFIRMED',
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    userId: string,
    role: UserRole,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permissions
    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (patient && appointment.patientId !== patient.id) {
        throw new ForbiddenException('You can only update your own appointments');
      }
      // Patients can only add notes, not change status
      if (updateAppointmentDto.status && updateAppointmentDto.status !== appointment.status) {
        throw new ForbiddenException('Patients cannot change appointment status');
      }
    } else if (role === UserRole.BRANCH_MANAGER) {
      const manager = await this.prisma.branchManager.findUnique({
        where: { userId },
        select: { branchId: true },
      });
      if (manager && appointment.branchId !== manager.branchId) {
        throw new ForbiddenException('You can only update appointments in your branch');
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateAppointmentDto,
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    return updated;
  }

  async cancel(id: string, reason: string, userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        patientId: patient.id,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed appointment');
    }

    // Check if appointment is at least 1 hour away (for patients)
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 1) {
      throw new BadRequestException('Cannot cancel appointment less than 1 hour before the scheduled time');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
      },
    });

    return updated;
  }

  async remove(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    await this.prisma.appointment.delete({
      where: { id },
    });

    return { message: 'Appointment deleted successfully' };
  }
}
