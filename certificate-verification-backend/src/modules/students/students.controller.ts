import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get logged-in student profile' })
  async getProfile(@CurrentUser() currentUser: any) {
    return this.studentsService.findOne(currentUser.userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Count all students', description: 'Super admin use.' })
  async count() {
    return { count: await this.studentsService.countAll() };
  }

  @Get('university/:universityId')
  @ApiOperation({ summary: 'List students by university' })
  @ApiParam({ name: 'universityId', format: 'uuid' })
  async findByUniversity(@Param('universityId') universityId: string) {
    return this.studentsService.findByUniversityId(universityId);
  }

  @Get('university/:universityId/count')
  @ApiOperation({ summary: 'Count students by university' })
  @ApiParam({ name: 'universityId', format: 'uuid' })
  async countByUniversity(@Param('universityId') universityId: string) {
    return { count: await this.studentsService.countByUniversityId(universityId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }
}
