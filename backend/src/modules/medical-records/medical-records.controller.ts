import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';

@ApiTags('Medical Records')
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}
}
