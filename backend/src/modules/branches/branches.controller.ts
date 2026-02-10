import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { Public } from '../../core/decorators';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active branches' })
  @ApiResponse({ status: 200, description: 'List of all active branches' })
  async findAll() {
    return this.branchesService.findAll();
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
}
