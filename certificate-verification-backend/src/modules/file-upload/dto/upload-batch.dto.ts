import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class UploadBatchDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Excel file (.xlsx or .xls) containing students and certificates',
  })
  file: Express.Multer.File;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  university_id: string;
}
