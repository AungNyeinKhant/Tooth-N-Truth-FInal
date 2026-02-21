import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchQueryDto } from './dto/branch-query.dto';
import { Public, Roles } from '../../core/decorators';
import { RolesGuard } from '../../core/guards';
import { JwtAuthGuard } from '../../core/guards';
import { UserRole } from '../../shared/enums';
import { formatList } from '../../shared/utils';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all branches with search, filter, and pagination' })
  @ApiResponse({ status: 200, description: 'List of branches with pagination metadata' })
  async findAll(@Query() query: BranchQueryDto) {
    const { items, total } = await this.branchesService.findAll(query);
    return formatList(items, total, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Public()
  @Get(':id/services')
  @ApiOperation({ summary: 'Get services available at branch' })
  @ApiResponse({ status: 200, description: 'List of services at branch' })
  async getBranchServices(@Param('id') id: string) {
    return this.branchesService.getBranchServices(id);
  }

  @Public()
  @Get(':id/doctors')
  @ApiOperation({ summary: 'Get doctors at branch' })
  @ApiResponse({ status: 200, description: 'List of doctors at branch' })
  async getBranchDoctors(@Param('id') id: string) {
    return this.branchesService.getBranchDoctors(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new branch (Admin only)' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 409, description: 'Branch with this name already exists' })
  async create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a branch (Admin only)' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a branch (Admin only)' })
  @ApiResponse({ status: 200, description: 'Branch deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
