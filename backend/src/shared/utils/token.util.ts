import { v4 as uuidv4, validate } from 'uuid';

export class TokenUtil {
  static generateToken(): string {
    return uuidv4();
  }

  static isValidUUID(str: string): boolean {
    return validate(str);
  }
}
