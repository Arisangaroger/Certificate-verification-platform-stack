import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags('Admin Users')
@ApiBearerAuth('JWT-auth')
@Controller('admin-users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @ApiOperation({ summary: 'Create admin user' })
  async create(
    @Body() createAdminUserDto: CreateAdminUserDto,
    @CurrentUser() currentUser: any,
  ) {
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.create(createAdminUserDto);
    }

    if (createAdminUserDto.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only create admin users for your own university');
    }

    return this.adminUsersService.create(createAdminUserDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'REGISTRAR', 'VIEWER')
  @ApiOperation({ summary: 'List admin users' })
  async findAll(@CurrentUser() currentUser: any) {
    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.findAll();
    }

    return this.adminUsersService.findByUniversity(currentUser.university_id);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'REGISTRAR', 'VIEWER')
  @ApiOperation({ summary: 'Get admin user by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return adminUser;
    }
    
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only view admin users from your own university');
    }

    return adminUser;
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @ApiOperation({ summary: 'Update admin user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @Param('id') id: string,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
    @CurrentUser() currentUser: any,
  ) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.update(id, updateAdminUserDto);
    }
    
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only update admin users from your own university');
    }

    return this.adminUsersService.update(id, updateAdminUserDto);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @ApiOperation({ summary: 'Deactivate admin user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async deactivate(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.deactivate(id);
    }
    
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only deactivate admin users from your own university');
    }

    return this.adminUsersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @ApiOperation({ summary: 'Activate admin user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async activate(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.activate(id);
    }
    
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only activate admin users from your own university');
    }

    return this.adminUsersService.activate(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @ApiOperation({ summary: 'Delete admin user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminUser = await this.adminUsersService.findOne(id);
    
    if (!adminUser) {
      throw new ForbiddenException('Admin user not found');
    }

    if (adminUser.id === currentUser.userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      return this.adminUsersService.remove(id);
    }
    
    if (adminUser.university_id !== currentUser.university_id) {
      throw new ForbiddenException('You can only delete admin users from your own university');
    }

    return this.adminUsersService.remove(id);
  }
}
