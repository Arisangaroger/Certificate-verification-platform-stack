import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCertificateDto {
  @ApiPropertyOptional({ example: 'B.Sc. Computer Science' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  degree_title?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  graduation_year?: number;

  @ApiPropertyOptional({ example: 'First Class Honours' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  class_award?: string;
}
