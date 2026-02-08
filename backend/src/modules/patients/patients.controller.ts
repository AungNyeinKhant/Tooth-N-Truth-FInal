import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}
}
