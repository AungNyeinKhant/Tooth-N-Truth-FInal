import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'patient1@example.com',
      firstName: 'Alice',
      lastName: 'Wonder',
      role: 'PATIENT',
      branchId: '550e8400-e29b-41d4-a716-446655440001',
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    branchId?: string;
  };
}
