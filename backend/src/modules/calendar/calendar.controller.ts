import { Controller, Get, Post, Query, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../../core/guards';
import { CurrentUser } from '../../core/decorators';
import { Request } from 'express';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google Calendar OAuth URL' })
  getCalendarConnectUrl(@CurrentUser('sub') userId: string) {
    const url = this.calendarService.getCalendarConnectUrl();
    return { url };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Google Calendar OAuth callback' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
  ) {
    if (!code) {
      return {
        success: false,
        message: 'No authorization code provided',
      };
    }

    try {
      // state contains the userId
      await this.calendarService.handleCalendarCallback(code, state);
      return {
        success: true,
        message: 'Google Calendar connected successfully! You can close this window.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect: ${error.message}`,
      };
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get calendar connection status' })
  getCalendarStatus(@CurrentUser('sub') userId: string) {
    return this.calendarService.getCalendarStatus(userId);
  }

  @Post('toggle-sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle calendar sync on/off' })
  toggleSync(
    @CurrentUser('sub') userId: string,
    @Query('enabled') enabled: string,
  ) {
    return this.calendarService.toggleCalendarSync(userId, enabled === 'true');
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Calendar' })
  disconnectCalendar(@CurrentUser('sub') userId: string) {
    return this.calendarService.disconnectCalendar(userId);
  }
}
