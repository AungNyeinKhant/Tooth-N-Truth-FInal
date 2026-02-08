export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    error?: string,
    meta?: any,
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.meta = meta;
  }

  static success<T>(data: T, message?: string, meta?: any): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message, undefined, meta);
  }

  static error<T>(error: string, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(false, undefined, message, error);
  }
}
