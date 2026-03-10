import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, SetPasswordDto } from './dto';
import { Public } from '../../core/decorators';
import { CurrentUser } from '../../core/decorators';
import { GoogleOAuthGuard } from '../../core/guards';

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

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // GoogleOAuthGuard initiates the OAuth flow automatically
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  async googleAuthRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!req.user) {
      // Redirect to frontend login with error (frontend runs on port 3001)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=GoogleLoginFailed`);
    }

    // Generate tokens for the authenticated user
    const result = await this.authService.generateTokens(req.user);
    
    // Set refresh token in HttpOnly cookie
    this.setRefreshTokenCookie(res, result.refreshToken);
    
    // Redirect to frontend callback page with the short-lived access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set password for Google-only user' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  @ApiResponse({ status: 400, description: 'User already has a password' })
  @ApiCookieAuth()
  async setPassword(
    @CurrentUser('sub') userId: string,
    @Body() setPasswordDto: SetPasswordDto,
  ) {
    return this.authService.setPassword(userId, setPasswordDto.newPassword);
  }

  @Post('unlink-google')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Google account from user profile' })
  @ApiResponse({ status: 200, description: 'Google account unlinked successfully' })
  @ApiResponse({ status: 400, description: 'Cannot unlink - no password set' })
  @ApiCookieAuth()
  async unlinkGoogle(@CurrentUser('sub') userId: string) {
    return this.authService.unlinkGoogle(userId);
  }

  @Get('google-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google account linking status' })
  @ApiResponse({ status: 200, description: 'Google status retrieved' })
  @ApiCookieAuth()
  async getGoogleStatus(@CurrentUser('sub') userId: string) {
    return this.authService.getGoogleStatus(userId);
  }
}
