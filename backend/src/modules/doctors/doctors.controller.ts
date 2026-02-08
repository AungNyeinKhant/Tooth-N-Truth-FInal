import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}
}
