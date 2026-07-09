import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'registrar@university.edu' })
  email: string;

  @ApiProperty({ example: 'Jane Registrar' })
  full_name: string;

  @ApiProperty({ enum: ['SUPER_ADMIN', 'REGISTRAR', 'VIEWER'] })
  role: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  university_id: string | null;
}

export class AdminLoginResponseDto {
  @ApiProperty({ description: 'JWT bearer token for protected admin routes' })
  access_token: string;

  @ApiProperty({ type: AdminUserSummaryDto })
  user: AdminUserSummaryDto;
}

export class StudentSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'STU2024001' })
  student_id_number: string;

  @ApiProperty({ example: 'Alice Uwimana' })
  full_name: string;

  @ApiProperty({ example: 'alice@student.edu' })
  email: string;
}

export class StudentLoginResponseDto {
  @ApiProperty({ description: 'JWT bearer token for student routes' })
  access_token: string;

  @ApiProperty({ type: StudentSummaryDto })
  student: StudentSummaryDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}

export class BatchUploadResponseDto {
  @ApiProperty({ example: 'Batch uploaded successfully' })
  message: string;

  @ApiProperty({ example: 25 })
  studentsCount: number;

  @ApiProperty({ example: 25 })
  certificatesCount: number;
}

export class IssueToBlockchainResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '0xabc123...' })
  transactionHash: string;

  @ApiProperty({ example: 10 })
  certificatesIssued: number;

  @ApiProperty({
    example: 'https://sepolia-optimistic.etherscan.io/tx/0xabc123...',
  })
  explorerUrl: string;
}

export class CertificateSummaryDto {
  @ApiProperty({ example: 'Vpg3YCjx7i1O' })
  certificate_id: string;

  @ApiProperty({ example: 'Alice Uwimana' })
  student_name: string;

  @ApiProperty({ example: 'STU2024001' })
  student_id_number: string;

  @ApiProperty({ example: 'B.Sc. Computer Science' })
  degree_title: string;

  @ApiProperty({ example: 2024 })
  graduation_year: number;

  @ApiPropertyOptional({ example: 'First Class Honours' })
  class_award?: string;

  @ApiProperty({ example: 'Aurora University' })
  university_name: string;
}

export class VerificationBlockchainDto {
  @ApiPropertyOptional({ example: '0xabc123...' })
  transaction_hash?: string;

  @ApiPropertyOptional({ example: '2024-06-15T10:30:00.000Z' })
  timestamp?: string;
}

export class VerificationMetaDto {
  @ApiProperty({ example: true })
  database_hash_match: boolean;

  @ApiProperty({ example: true })
  blockchain_verified: boolean;

  @ApiProperty({ enum: ['ISSUED', 'VERIFIED', 'REVOKED'] })
  status: string;
}

export class VerificationSuccessResponseDto {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiProperty({ type: CertificateSummaryDto })
  certificate: CertificateSummaryDto;

  @ApiProperty({ type: VerificationBlockchainDto })
  blockchain: VerificationBlockchainDto;

  @ApiProperty({ type: VerificationMetaDto })
  verification: VerificationMetaDto;

  @ApiProperty({
    example: 'Credential is authentic and has not been tampered with.',
  })
  message: string;
}

export class VerificationFailureResponseDto {
  @ApiProperty({ example: false })
  isValid: boolean;

  @ApiProperty({
    example: 'No on-chain record found for this credential hash.',
  })
  message: string;
}

export class CertificateStatsDto {
  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 85 })
  verified: number;

  @ApiProperty({ example: 35 })
  issued: number;
}
