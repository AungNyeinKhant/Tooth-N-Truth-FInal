import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { decrypt, encrypt } from '../../shared/utils/encryption.util';

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get the OAuth URL for connecting Google Calendar
   */
  getCalendarConnectUrl(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/api/calendar/callback';
    
    const scopes = [
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' ');
    
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&select_account=true`;
  }

  /**
   * Handle calendar OAuth callback - store tokens for patient
   */
  async handleCalendarCallback(code: string, userId: string): Promise<{ message: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/api/calendar/callback';
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key';

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new BadRequestException(`Failed to exchange code for tokens: ${error}`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(access_token, encryptionKey);
    const encryptedRefreshToken = encrypt(refresh_token, encryptionKey);

    // Store tokens in patient record
    await this.prisma.patient.update({
      where: { userId },
      data: {
        googleAccessToken: encryptedAccessToken,
        googleRefreshToken: encryptedRefreshToken,
        googleTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        googleCalendarConnected: true,
        calendarSyncEnabled: true,
        lastCalendarSyncAt: new Date(),
      },
    });

    return { message: 'Google Calendar connected successfully' };
  }

  /**
   * Get calendar connection status for a patient
   */
  async getCalendarStatus(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    return {
      isConnected: patient?.googleCalendarConnected || false,
      syncEnabled: patient?.calendarSyncEnabled || false,
      lastSyncAt: patient?.lastCalendarSyncAt,
    };
  }

  /**
   * Toggle calendar sync on/off
   */
  async toggleCalendarSync(userId: string, enabled: boolean) {
    await this.prisma.patient.update({
      where: { userId },
      data: { calendarSyncEnabled: enabled },
    });

    return { message: `Calendar sync ${enabled ? 'enabled' : 'disabled'}` };
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnectCalendar(userId: string) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key';

    // Try to revoke the token (optional - if we have stored access token)
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (patient?.googleAccessToken) {
      try {
        const accessToken = decrypt(patient.googleAccessToken, encryptionKey);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: 'POST',
        });
      } catch (e) {
        // Ignore errors - token might be expired
      }
    }

    // Clear tokens from database
    await this.prisma.patient.update({
      where: { userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiresAt: null,
        googleCalendarConnected: false,
        calendarSyncEnabled: false,
      },
    });

    return { message: 'Google Calendar disconnected' };
  }

  /**
   * Get decrypted access token for API calls
   */
  async getAccessToken(userId: string): Promise<string | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient?.googleAccessToken) {
      return null;
    }

    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key';
    
    // Check if token is expired
    if (patient.googleTokenExpiresAt && new Date() > patient.googleTokenExpiresAt) {
      // Need to refresh token
      const newAccessToken = await this.refreshAccessToken(userId);
      return newAccessToken;
    }

    return decrypt(patient.googleAccessToken, encryptionKey);
  }

  /**
   * Refresh expired access token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient?.googleRefreshToken) {
      throw new BadRequestException('No refresh token found');
    }

    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key';
    const refreshToken = decrypt(patient.googleRefreshToken, encryptionKey);
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to refresh access token');
    }

    const tokens = await response.json();
    const { access_token, expires_in } = tokens;

    // Update stored tokens
    await this.prisma.patient.update({
      where: { userId },
      data: {
        googleAccessToken: encrypt(access_token, encryptionKey),
        googleTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        lastCalendarSyncAt: new Date(),
      },
    });

    return access_token;
  }

  /**
   * Create a calendar event for an appointment
   */
  async createCalendarEvent(
    userId: string,
    appointmentId: string,
    eventData: {
      summary: string;
      description?: string;
      startTime: Date;
      endTime: Date;
    },
  ): Promise<string> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) {
      throw new BadRequestException('Calendar not connected');
    }

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'Asia/Manila',
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'Asia/Manila',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Failed to create calendar event: ${error}`);
    }

    const event = await response.json();

    // Store event ID in appointment
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { googleCalendarEventId: event.id },
    });

    return event.id;
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(
    userId: string,
    appointmentId: string,
    eventData: {
      summary?: string;
      description?: string;
      startTime?: Date;
      endTime?: Date;
    },
  ): Promise<void> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) {
      return; // Calendar not connected, skip
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment?.googleCalendarEventId) {
      return; // No event to update
    }

    const updateBody: any = {};
    if (eventData.summary) updateBody.summary = eventData.summary;
    if (eventData.description) updateBody.description = eventData.description;
    if (eventData.startTime) {
      updateBody.start = {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'Asia/Manila',
      };
    }
    if (eventData.endTime) {
      updateBody.end = {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'Asia/Manila',
      };
    }

    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.googleCalendarEventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody),
      },
    );
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(userId: string, appointmentId: string): Promise<void> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) {
      return;
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment?.googleCalendarEventId) {
      return;
    }

    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.googleCalendarEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // Clear event ID from appointment
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { googleCalendarEventId: null },
    });
  }
}
