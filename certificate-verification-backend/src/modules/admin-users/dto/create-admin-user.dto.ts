import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { AdminRole } from '../entities/admin-user.entity';

export class CreateAdminUserDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  university_id?: string;

  @ApiProperty({ example: 'Jane Registrar' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'registrar@university.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: AdminRole, example: AdminRole.REGISTRAR })
  @IsEnum(AdminRole)
  @IsNotEmpty()
  role: AdminRole;
}
