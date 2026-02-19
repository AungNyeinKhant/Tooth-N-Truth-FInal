import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserRole } from '../../shared/enums';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';

interface AdminAppointmentsQuery {
  status?: string;
  branchId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async getAdminAppointments(query: AdminAppointmentsQuery) {
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

    // Search by patient name or email
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
      ];
    }

    // Get total count
    const total = await this.prisma.appointment.count({ where });

    // Get paginated appointments
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
    });

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    return appointments;
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

    // Get service duration to calculate end time
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Validate and parse start time
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(startTime)) {
      throw new BadRequestException('Invalid time format. Use HH:mm format (e.g., 09:00)');
    }
    const [startHour, startMin] = startTime.split(':').map(Number);
    let endHour = startHour;
    let endMin = startMin + service.duration;
    while (endMin >= 60) {
      endHour++;
      endMin -= 60;
    }
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    // Check if time slot is available
    const dateObj = new Date(appointmentDate);
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
