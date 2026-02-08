export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already exists',
    UNAUTHORIZED: 'Unauthorized access',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid token',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email',
    INVALID_PHONE: 'Please enter a valid Myanmar phone number',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    PASSWORD_NO_UPPERCASE: 'Password must contain at least one uppercase letter',
    PASSWORD_NO_LOWERCASE: 'Password must contain at least one lowercase letter',
    PASSWORD_NO_NUMBER: 'Password must contain at least one number',
  },
  DATABASE: {
    RECORD_NOT_FOUND: 'Record not found',
    DUPLICATE_RECORD: 'Record already exists',
  },
};
