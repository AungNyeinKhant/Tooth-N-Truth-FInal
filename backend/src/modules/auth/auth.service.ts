import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserRole } from '../../shared/enums';
import { PasswordUtil } from '../../shared/utils';
import { ERROR_MESSAGES } from '../../shared/constants';
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

  }

  async validateOAuthLogin(profile: any) {
    const { googleId, email, firstName, lastName, profileImage } = profile;

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
      return user;
    }

    // 2. Check if user exists with this email (Link Account)
    user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        branchManager: true,
      },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          googleEmail: email,
          profileImage: user.profileImage || profileImage,
        },
        include: {
          patient: true,
          branchManager: true,
        },
      });
      return user;
    }

    // 3. Auto-register new Patient
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
          create: {}, // Create empty patient relation
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
}
