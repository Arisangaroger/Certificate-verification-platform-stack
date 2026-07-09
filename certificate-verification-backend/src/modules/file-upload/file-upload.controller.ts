import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UploadBatchDataDto } from './dto/upload-batch-data.dto';
import { BatchUploadResponseDto } from '../../common/swagger/response.dto';

@ApiTags('File Upload')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('batch')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload Excel batch', description: 'Import students and certificates from .xlsx or .xls file. Creates ISSUED records with computed data_hash.' })
  @ApiOkResponse({ type: BatchUploadResponseDto })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'university_id'],
      properties: {
        file: { type: 'string', format: 'binary' },
        university_id: { type: 'string', format: 'uuid' },
      },
    },
  })
  async uploadBatch(
    @UploadedFile() file: Express.Multer.File,
    @Body('university_id') university_id: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!university_id) {
      throw new BadRequestException('university_id is required');
    }

    const cleanUniversityId = university_id.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(cleanUniversityId)) {
      throw new BadRequestException('Invalid university_id format. Must be a valid UUID.');
    }

    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
    }

    const { students, certificates } = await this.fileUploadService.processExcelFile(
      file.buffer,
      cleanUniversityId,
    );
    
    await this.fileUploadService.processBatch(students, certificates);
    
    return {
      message: 'Batch uploaded successfully',
      studentsCount: students.length,
      certificatesCount: certificates.length,
    };
  }

  @Post('batch-data')
  @Roles('SUPER_ADMIN', 'REGISTRAR')
  @ApiOperation({ summary: 'Upload batch JSON data', description: 'Import pre-parsed student and certificate rows. Creates ISSUED records.' })
  @ApiOkResponse({ type: BatchUploadResponseDto })
  async uploadBatchData(@Body() body: UploadBatchDataDto) {
    const { data, university_id } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Data array is required and must not be empty');
    }

    const cleanUniversityId = university_id.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(cleanUniversityId)) {
      throw new BadRequestException('Invalid university_id format. Must be a valid UUID.');
    }

    const { students, certificates } = this.fileUploadService.processDataArray(data, cleanUniversityId);
    
    await this.fileUploadService.processBatch(students, certificates);
    
    return {
      message: 'Batch uploaded successfully',
      studentsCount: students.length,
      certificatesCount: certificates.length,
    };
  }
}
