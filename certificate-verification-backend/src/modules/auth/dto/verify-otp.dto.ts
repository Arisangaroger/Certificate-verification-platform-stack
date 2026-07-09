import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'STU2024001' })
  @IsString()
  @IsNotEmpty()
  student_id_number: string;

  @ApiProperty({ example: '1199780123456789' })
  @IsString()
  @IsNotEmpty()
  national_id: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
