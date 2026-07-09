import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: 'STU2024001' })
  @IsString()
  @IsNotEmpty()
  student_id_number: string;

  @ApiProperty({ example: '1199780123456789' })
  @IsString()
  @IsNotEmpty()
  national_id: string;
}
