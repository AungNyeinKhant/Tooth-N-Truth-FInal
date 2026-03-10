import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserRole } from '../../shared/enums';
import { PasswordUtil } from '../../shared/utils';
import { ERROR_MESSAGES } from '../../shared/constants';
import { encrypt } from '../../shared/utils/encryption.util';
import {
  LoginDto,
  RegisterDto,
  TokenResponseDto,
} from './dto';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  branchId?: string;
}

interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ tokens: GeneratedTokens; user: any }> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        patient: true,
        branchManager: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Check if user has a password (Google OAuth users don't)
    if (!user.password) {
      throw new UnauthorizedException('This account uses Google Sign-in. Please login with Google.');
    }

    const isPasswordValid = await PasswordUtil.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchManager?.branchId,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ tokens: GeneratedTokens; user: any }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_EXISTS);
    }

    const hashedPassword = await PasswordUtil.hash(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        role: UserRole.PATIENT,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        profileImage: registerDto.profileImage || null,
        patient: {
          create: {
            dateOfBirth: registerDto.dateOfBirth
              ? new Date(registerDto.dateOfBirth)
              : null,
            address: registerDto.address,
            emergencyContact: registerDto.emergencyContact,
          },
        },
      },
      include: {
        patient: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: GeneratedTokens; user: any }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          patient: true,
          branchManager: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
      }

      const tokens = await this.generateTokens(user);

      return {
        tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          branchId: user.branchManager?.branchId,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        profileImage: true,
        createdAt: true,
        patient: true,
        branchManager: {
          select: {
            branchId: true,
            branch: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    return user;
  }

  async validateOAuthLogin(profile: any) {
    const { googleId, email, firstName, lastName, profileImage, accessToken, refreshToken } = profile;
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key';

    // 1. Check if user exists with googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId },
      include: {
        patient: true,
        branchManager: true,
      },
    });

    if (user) {
      // Update profile image if missing
      if (!user.profileImage && profileImage) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { profileImage },
          include: { patient: true, branchManager: true },
        });
      }
      // Update tokens if provided (for re-authentication)
      if (refreshToken && user.patient) {
        const encryptedRefreshToken = encrypt(refreshToken, encryptionKey);
        const encryptedAccessToken = encrypt(accessToken, encryptionKey);
        
        await this.prisma.patient.update({
          where: { userId: user.id },
          data: {
            googleRefreshToken: encryptedRefreshToken,
            googleAccessToken: encryptedAccessToken,
            googleCalendarConnected: true,
          },
        });
      }
      return user;
    }

    // 2. Check if user exists with this email (Link Account or new Google login)
    user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        branchManager: true,
      },
    });

    // Prepare data for update
    const updateData: any = {
      googleId,
      googleEmail: email,
      profileImage: user?.profileImage || profileImage,
    };

    // If patient exists and we have tokens, store them
    let patientUpdateData: any = {};
    if (refreshToken && user?.patient) {
      const encryptedRefreshToken = encrypt(refreshToken, encryptionKey);
      const encryptedAccessToken = encrypt(accessToken, encryptionKey);
      patientUpdateData = {
        googleRefreshToken: encryptedRefreshToken,
        googleAccessToken: encryptedAccessToken,
        googleCalendarConnected: true,
      };
    }

    if (user) {
      // If user already has a googleId, this is a "relink" - update to new Google account
      if (user.googleId && user.googleId !== googleId) {
        // Re-linking: clear old calendar tokens and set new ones
        patientUpdateData = {
          ...patientUpdateData,
          googleRefreshToken: refreshToken ? encrypt(refreshToken, encryptionKey) : null,
          googleAccessToken: accessToken ? encrypt(accessToken, encryptionKey) : null,
          googleCalendarConnected: !!refreshToken,
          calendarSyncEnabled: !!refreshToken,
        };
      }

      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          patient: true,
          branchManager: true,
        },
      });

      // Update patient tokens if exists
      if (user.patient && Object.keys(patientUpdateData).length > 0) {
        await this.prisma.patient.update({
          where: { userId: user.id },
          data: patientUpdateData,
        });
      }
      return user;
    }

    // 3. Auto-register new Patient
    let patientData: any = {};
    if (refreshToken) {
      patientData = {
        googleRefreshToken: encrypt(refreshToken, encryptionKey),
        googleAccessToken: encrypt(accessToken, encryptionKey),
        googleCalendarConnected: true,
      };
    }

    user = await this.prisma.user.create({
      data: {
        email,
        googleEmail: email,
        googleId,
        role: UserRole.PATIENT,
        firstName,
        lastName,
        profileImage,
        patient: {
          create: patientData,
        },
      },
      include: {
        patient: true,
        branchManager: true,
      },
    });

    return user;
  }

  async generateTokens(user: any): Promise<GeneratedTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchManager?.branchId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Set password for a user (Google-only users who want to set a password)
   */
  async setPassword(userId: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    // Check if user already has a password
    if (user.password) {
      throw new BadRequestException('User already has a password. Use change password instead.');
    }

    const hashedPassword = await PasswordUtil.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password set successfully' };
  }

  /**
   * Unlink Google account from user profile
   */
  async unlinkGoogle(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    // Check if user has Google account linked
    if (!user.googleId) {
      throw new BadRequestException('No Google account is linked to this profile.');
    }

    // Check if user has a password (cannot unlink if Google-only)
    if (!user.password) {
      throw new BadRequestException(
        'Cannot unlink Google account. Please set a password first.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId: null,
        googleEmail: null,
      },
    });

    return { message: 'Google account unlinked successfully' };
  }

  /**
   * Get user's Google account linking status
   */
  async getGoogleStatus(userId: string): Promise<{
    isLinked: boolean;
    googleEmail: string | null;
    hasPassword: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleId: true,
        googleEmail: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    return {
      isLinked: !!user.googleId,
      googleEmail: user.googleEmail,
      hasPassword: !!user.password,
    };
  }
}
