import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Public } from '../../core/decorators';
import { CurrentUser } from '../../core/decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Set refresh token as HttpOnly cookie
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Clear refresh token cookie
   */
  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiCookieAuth()
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    
    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    
    // Return only access token and user (refresh token is in cookie)
    return {
      accessToken: result.tokens.accessToken,
      user: result.user,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new patient' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiCookieAuth()
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    
    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    
    // Return only access token and user (refresh token is in cookie)
    return {
      accessToken: result.tokens.accessToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiCookieAuth()
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new Error('Refresh token not found in cookies');
    }
    
    const result = await this.authService.refreshToken(refreshToken);
    
    // Set new refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    
    // Return only access token and user
    return {
      accessToken: result.tokens.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiCookieAuth()
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear refresh token cookie
    this.clearRefreshTokenCookie(res);
    
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser('sub') userId: string) {
    return this.authService.getCurrentUser(userId);
  }
}
