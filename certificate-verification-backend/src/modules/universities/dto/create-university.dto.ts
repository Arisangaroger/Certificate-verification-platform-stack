import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreateUniversityDto {
  @ApiProperty({ example: 'Aurora University' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'registrar@aurora.edu' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '+250788000000' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone_number?: string;

  @ApiPropertyOptional({ example: '0x22614252CEa754Ac8eFaCfAe4Cb5C6917C39C020' })
  @IsOptional()
  @IsString()
  @MaxLength(42)
  wallet_address?: string;

  @ApiPropertyOptional({ example: 'did:key:z6Mk...' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  did_identifier?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logo_url?: string;
}
