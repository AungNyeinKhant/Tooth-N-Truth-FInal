import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor() {
    super({
      accessType: 'offline', // Request a refresh token
      prompt: 'consent', // Force to consent prompt to ensure refresh token is returned
    });
  }
}
