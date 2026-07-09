import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  VerificationFailureResponseDto,
  VerificationSuccessResponseDto,
} from '../../common/swagger/response.dto';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Get(':certificate_id')
  @ApiOperation({
    summary: 'Verify a certificate (public)',
    description:
      'Runs the three-way match: database lookup, keccak256 hash recalculation, and on-chain registry validation (exists, not revoked, issuer DID match). No authentication required.',
  })
  @ApiParam({ name: 'certificate_id', example: 'Vpg3YCjx7i1O', description: '12-character certificate ID' })
  @ApiOkResponse({
    type: VerificationSuccessResponseDto,
    description: 'Credential is authentic',
  })
  @ApiResponse({
    status: 200,
    type: VerificationFailureResponseDto,
    description: 'Verification failed (invalid or tampered credential)',
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async verify(@Param('certificate_id') certificate_id: string) {
    return this.verificationService.verifyCertificate(certificate_id);
  }
}
