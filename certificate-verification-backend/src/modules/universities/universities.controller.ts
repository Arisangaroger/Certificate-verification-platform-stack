import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UniversitiesService } from './universities.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all universities' })
  findAll() {
    return this.universitiesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get university by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(@Param('id') id: string) {
    return this.universitiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create university', description: 'Super admin only. Auto-generates blockchain identity.' })
  create(@Body() createUniversityDto: CreateUniversityDto) {
    return this.universitiesService.create(createUniversityDto);
  }

  @Post(':id/provision-identity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Provision blockchain identity', description: 'Creates DID and wallet keys if missing.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  provisionIdentity(@Param('id') id: string, @CurrentUser() currentUser: any) {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.university_id !== id) {
      throw new ForbiddenException('You can only provision identity for your own university');
    }
    return this.universitiesService.ensureBlockchainIdentity(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update university', description: 'Super admin only.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(
    @Param('id') id: string,
    @Body() updateUniversityDto: UpdateUniversityDto,
  ) {
    return this.universitiesService.update(id, updateUniversityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete university', description: 'Super admin only.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id') id: string) {
    return this.universitiesService.remove(id);
  }
}
