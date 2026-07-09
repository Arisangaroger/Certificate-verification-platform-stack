import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { AdminRole } from '../entities/admin-user.entity';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ example: 'Jane Registrar' })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({ example: 'registrar@university.edu' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'NewSecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: AdminRole })
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
