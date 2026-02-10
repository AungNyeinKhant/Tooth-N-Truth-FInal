import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { Public } from '../../core/decorators';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'List of all services' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}
