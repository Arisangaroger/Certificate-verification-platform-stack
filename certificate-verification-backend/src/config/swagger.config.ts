import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  AdminLoginResponseDto,
  BatchUploadResponseDto,
  CertificateStatsDto,
  IssueToBlockchainResponseDto,
  MessageResponseDto,
  StudentLoginResponseDto,
  VerificationFailureResponseDto,
  VerificationSuccessResponseDto,
} from '../common/swagger/response.dto';

const SWAGGER_DESCRIPTION = `
## Certificate Verification Platform API

REST API for issuing academic credentials, anchoring them on **Optimism Sepolia L2**, and verifying authenticity through a **three-way match** (database + hash + blockchain).

### Base URL
All routes are prefixed with \`/api\`.

### Authentication
1. **Admin** — \`POST /api/auth/admin/login\` with email and password. Copy the \`access_token\` from the response.
2. **Student** — \`POST /api/auth/student/request-otp\`, then \`POST /api/auth/student/verify-otp\`. Copy the returned \`access_token\`.
3. Click **Authorize** (top right), paste \`Bearer <token>\` or just the token (Swagger adds Bearer automatically for JWT-auth).

### Typical admin workflow
1. Login as admin → create university → upload Excel batch (\`ISSUED\`) → issue to blockchain (\`VERIFIED\`) → share certificate ID or PDF QR for public verification.

### Public verification
\`GET /api/verification/{certificate_id}\` — no authentication required.

### Certificate statuses
- \`ISSUED\` — stored in database only; hash computed but not yet on-chain.
- \`VERIFIED\` — minted on Optimism Sepolia; public verification succeeds.
- \`REVOKED\` — revoked on-chain; verification fails.

### Blockchain
Contract: \`CredentialRegistry\` on Optimism Sepolia. Each certificate is stored as a \`keccak256\` hash commitment linked to the issuing university's \`did:key\` identifier.
`.trim();

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('CertiChain API')
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion('1.0.0')
    .setContact('CertiChain Platform', '', 'support@certichain.local')
    .addServer('http://localhost:3000', 'Local development (port 3000)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT from POST /api/auth/admin/login or POST /api/auth/student/verify-otp',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Service health check')
    .addTag('Auth', 'Admin login and student OTP authentication')
    .addTag('Universities', 'University management and blockchain identity (DID)')
    .addTag('Admin Users', 'Institution admin account management')
    .addTag('Students', 'Student records (JWT required)')
    .addTag('Certificates', 'Certificate CRUD, PDF download, and blockchain issuance')
    .addTag('Verification', 'Public certificate verification (no auth)')
    .addTag('File Upload', 'Batch student and certificate import from Excel')
    .build();

  const extraModels = [
    AdminLoginResponseDto,
    StudentLoginResponseDto,
    BatchUploadResponseDto,
    IssueToBlockchainResponseDto,
    VerificationSuccessResponseDto,
    VerificationFailureResponseDto,
    CertificateStatsDto,
    MessageResponseDto,
  ];

  const document = SwaggerModule.createDocument(app, config, {
    extraModels,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'CertiChain API — Swagger',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
    },
  });

  // Raw OpenAPI JSON for assessors / Postman import
  app.getHttpAdapter().get('/api/docs-json', (_req, res) => {
    res.json(document);
  });

  exportOpenApiSpec(document);
}

function exportOpenApiSpec(document: object): void {
  try {
    const docsDir = join(process.cwd(), '..', 'docs');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(
      join(docsDir, 'swagger.json'),
      JSON.stringify(document, null, 2),
      'utf8',
    );
  } catch {
    // Non-fatal if filesystem is read-only in production
  }
}
