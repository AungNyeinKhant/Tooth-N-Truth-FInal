import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto, QueryDoctorDto } from './dto';
import { Public, Roles } from '../../core/decorators';
import { RolesGuard } from '../../core/guards';
import { JwtAuthGuard } from '../../core/guards';
import { UserRole } from '../../shared/enums';
import { formatList } from '../../shared/utils';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all doctors with search, filter, pagination' })
  @ApiResponse({ status: 200, description: 'List of doctors with pagination metadata' })
  async findAll(@Query() query: QueryDoctorDto) {
    const { items, total } = await this.doctorsService.findAll(query);
    return formatList(items, total, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID with schedules' })
  @ApiResponse({ status: 200, description: 'Doctor details with schedules' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Public()
  @Get(':id/schedules')
  @ApiOperation({ summary: 'Get doctor schedules' })
  @ApiResponse({ status: 200, description: 'Doctor schedules' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async getDoctorSchedules(@Param('id') id: string) {
    return this.doctorsService.getDoctorSchedules(id);
  }

  @Public()
  @Get(':id/available-slots')
  @ApiOperation({ summary: 'Get available time slots for doctor' })
  @ApiResponse({ status: 200, description: 'Available time slots' })
  async getAvailableSlots(
    @Param('id') doctorId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.doctorsService.getAvailableSlots(doctorId, date, serviceId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new doctor (Admin only)' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  @ApiResponse({ status: 409, description: 'Doctor with this email already exists' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorsService.create(createDoctorDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a doctor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Doctor updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Doctor or Branch not found' })
  @ApiResponse({ status: 409, description: 'Doctor with this email already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a doctor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Doctor deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete doctor with existing appointments' })
  async remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}
