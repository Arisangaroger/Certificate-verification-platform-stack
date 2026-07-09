import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, Length } from 'class-validator';

export class IssueToBlockchainDto {
  @ApiProperty({
    type: [String],
    example: ['Vpg3YCjx7i1O', 'bIyUukh5jm40'],
    description: 'Certificate IDs to issue on the Optimism blockchain',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Length(12, 12, { each: true })
  certificateIds: string[];
}
