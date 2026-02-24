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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import {
  CreateSlotDto,
  UpdateSlotDto,
  QuerySlotDto,
  BulkSlotDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../../core/guards';
import { Roles, CurrentUser } from '../../core/decorators';
import { UserRole } from '../../shared/enums';
import { formatList } from '../../shared/utils';

@ApiTags('Slots')
@Controller('slots')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BRANCH_MANAGER)
@ApiBearerAuth()
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all slots for manager branch' })
  @ApiResponse({ status: 200, description: 'List of slots' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Branch Manager access required' })
  async findAll(
    @Query() query: QuerySlotDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    const { items, total } = await this.slotsService.findAll(branchId, query);
    return formatList(items, total, query);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get all doctors in manager branch (for dropdown)' })
  @ApiResponse({ status: 200, description: 'List of doctors' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Branch Manager access required' })
  async getDoctors(@CurrentUser('branchId') branchId: string) {
    return this.slotsService.getDoctors(branchId);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available slots for a specific date (branch manager)' })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAvailableSlots(
    @Query('date') date: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.slotsService.getAvailableSlots(branchId, date);
  }

  // Public endpoint for patients (no auth required, but needs branchId)
  @Get('public/available')
  @ApiOperation({ summary: 'Get available slots for patients to book (public)' })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  async getPublicAvailableSlots(
    @Query('date') date: string,
    @Query('branchId') branchId: string,
  ) {
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }
    return this.slotsService.getAvailableSlots(branchId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get slot by ID' })
  @ApiResponse({ status: 200, description: 'Slot details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Slot not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.slotsService.findOne(id, branchId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new slot' })
  @ApiResponse({ status: 201, description: 'Slot created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 409, description: 'Slot overlaps with existing slot' })
  async create(
    @Body() createSlotDto: CreateSlotDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.slotsService.create(createSlotDto, branchId);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create slots for multiple days' })
  @ApiResponse({ status: 201, description: 'Slots created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 409, description: 'Some days have overlapping slots' })
  async bulkCreate(
    @Body() bulkSlotDto: BulkSlotDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.slotsService.bulkCreate(bulkSlotDto, branchId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a slot' })
  @ApiResponse({ status: 200, description: 'Slot updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Slot not found' })
  @ApiResponse({ status: 409, description: 'Slot overlaps with existing slot' })
  async update(
    @Param('id') id: string,
    @Body() updateSlotDto: UpdateSlotDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.slotsService.update(id, updateSlotDto, branchId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a slot (soft delete)' })
  @ApiResponse({ status: 200, description: 'Slot deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Slot not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.slotsService.remove(id, branchId);
  }
}
