import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

export interface PatientSearchResult {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search for patients by phone number within a branch
   * Returns patients who have appointments at the branch
   */
  async searchByPhone(phone: string, branchId: string): Promise<PatientSearchResult[] | null> {
    if (!phone || phone.trim().length < 3) {
      return [];
    }

    // Find patients with this phone number who have appointments at this branch
    const patients = await this.prisma.patient.findMany({
      where: {
        user: {
          phone: {
            contains: phone.trim(),
            mode: 'insensitive',
          },
        },
        appointments: {
          some: {
            branchId,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      distinct: ['userId'],
      take: 10,
    });

    if (patients.length === 0) {
      return null;
    }

    return patients.map((patient) => ({
      id: patient.id,
      userId: patient.userId,
      firstName: patient.user.firstName,
      lastName: patient.user.lastName,
      phone: patient.user.phone,
      email: patient.user.email,
    }));
  }
}
