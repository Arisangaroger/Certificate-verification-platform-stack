import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class UploadBatchDataDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Parsed rows from the Excel batch upload',
  })
  @IsArray()
  @IsNotEmpty()
  data: Record<string, unknown>[];

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  university_id: string;
}
