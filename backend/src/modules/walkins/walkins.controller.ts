import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalkinsService } from './walkins.service';
import { CurrentUser, Roles } from '../../core/decorators';
import { UserRole } from '../../shared/enums';
import {
  CreateWalkInDto,
  UpdateWalkInStatusDto,
  ConvertToAppointmentDto,
  QueryWalkInDto,
} from './dto';
import { formatList } from '../../shared/utils';

@ApiTags('Walk-ins')
@Controller('walkins')
@ApiBearerAuth()
@Roles(UserRole.BRANCH_MANAGER)
export class WalkinsController {
  constructor(private readonly walkinsService: WalkinsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new walk-in patient (Manager only)' })
  @ApiResponse({ status: 201, description: 'Walk-in registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  async create(
    @CurrentUser('branchId') branchId: string,
    @Body() createWalkInDto: CreateWalkInDto,
    @CurrentUser('sub') managerId: string,
  ) {
    return this.walkinsService.create(branchId, createWalkInDto, managerId);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get walk-in queue for branch (Manager only)' })
  @ApiResponse({ status: 200, description: 'Walk-in queue list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  async getQueue(
    @CurrentUser('branchId') branchId: string,
    @Query() query: QueryWalkInDto,
    @CurrentUser('sub') managerId: string,
  ) {
    const { items, total } = await this.walkinsService.getQueue(
      branchId,
      query,
      managerId,
    );
    return formatList(items, total, {
      page: query.page || 1,
      limit: query.limit || 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get walk-in details (Manager only)' })
  @ApiResponse({ status: 200, description: 'Walk-in details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  @ApiResponse({ status: 404, description: 'Walk-in not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('sub') managerId: string,
  ) {
    return this.walkinsService.findOne(id, branchId, managerId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update walk-in status (Manager only)' })
  @ApiResponse({ status: 200, description: 'Walk-in status updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  @ApiResponse({ status: 404, description: 'Walk-in not found' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() updateDto: UpdateWalkInStatusDto,
    @CurrentUser('sub') managerId: string,
  ) {
    return this.walkinsService.updateStatus(id, branchId, updateDto, managerId);
  }

  @Post(':id/convert')
  @ApiOperation({
    summary: 'Convert walk-in to scheduled appointment (Manager only)',
  })
  @ApiResponse({ status: 200, description: 'Walk-in converted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or time conflict' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - managers only' })
  @ApiResponse({ status: 404, description: 'Walk-in not found' })
  async convertToAppointment(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() convertDto: ConvertToAppointmentDto,
    @CurrentUser('sub') managerId: string,
  ) {
    return this.walkinsService.convertToAppointment(
      id,
      branchId,
      convertDto,
      managerId,
    );
  }
}
