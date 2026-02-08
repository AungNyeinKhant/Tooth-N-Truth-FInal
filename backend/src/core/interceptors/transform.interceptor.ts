import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../../shared/dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already an ApiResponseDto, return it as is
        if (data instanceof ApiResponseDto) {
          return data;
        }
        // Otherwise, wrap it in a success response
        return ApiResponseDto.success(data);
      }),
    );
  }
}
