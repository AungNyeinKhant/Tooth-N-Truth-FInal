import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID:
        configService.get<string>("GOOGLE_CLIENT_ID") || "placeholder-id",
      clientSecret:
        configService.get<string>("GOOGLE_CLIENT_SECRET") ||
        "placeholder-secret",
      callbackURL:
        configService.get<string>("GOOGLE_CALLBACK_URL") ||
        "http://localhost:3001/api/auth/google/callback",
      scope: ["email", "profile"],
      prompt: "select_account",
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id, photos } = profile;

    const userProfile = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName || "",
      profileImage: photos[0]?.value,
      accessToken,
      refreshToken,
    };

    // We pass this back to the AuthService to handle database logic
    const user = await this.authService.validateOAuthLogin(userProfile);
    done(null, user);
  }
}
