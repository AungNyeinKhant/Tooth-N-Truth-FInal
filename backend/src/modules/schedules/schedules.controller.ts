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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  QueryScheduleDto,
  BulkScheduleDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../core/guards';
import { Roles, CurrentUser } from '../../core/decorators';
import { UserRole } from '../../shared/enums';
import { formatList } from '../../shared/utils';

@ApiTags('Schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BRANCH_MANAGER)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all schedules for manager branch' })
  @ApiResponse({ status: 200, description: 'List of schedules' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Branch Manager access required' })
  async findAll(
    @Query() query: QueryScheduleDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    const { items, total } = await this.schedulesService.findAll(branchId, query);
    return formatList(items, total, query);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get all doctors in manager branch (for dropdown)' })
  @ApiResponse({ status: 200, description: 'List of doctors' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Branch Manager access required' })
  async getDoctors(@CurrentUser('branchId') branchId: string) {
    return this.schedulesService.getDoctors(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.schedulesService.findOne(id, branchId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 409, description: 'Schedule overlaps with existing' })
  async create(
    @Body() createScheduleDto: CreateScheduleDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.schedulesService.create(createScheduleDto, branchId);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create schedules for multiple days' })
  @ApiResponse({ status: 201, description: 'Schedules created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 409, description: 'Some days already have schedules' })
  async bulkCreate(
    @Body() bulkScheduleDto: BulkScheduleDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.schedulesService.bulkCreate(bulkScheduleDto, branchId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 409, description: 'Schedule overlaps with existing' })
  async update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.schedulesService.update(id, updateScheduleDto, branchId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a schedule (soft delete)' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete - has upcoming appointments' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.schedulesService.remove(id, branchId);
  }
}
