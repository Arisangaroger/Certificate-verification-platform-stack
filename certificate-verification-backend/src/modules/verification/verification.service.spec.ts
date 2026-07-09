import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { CertificatesService } from '../certificates/certificates.service';
import { BlockchainService } from '../blockchain/blockchain.service';

describe('VerificationService', () => {
  let service: VerificationService;
  let certificatesService: jest.Mocked<Pick<CertificatesService, 'findByCertificateId' | 'updateDataHash'>>;
  let blockchainService: jest.Mocked<Pick<BlockchainService, 'generateDataHash' | 'getCredential'>>;

  const dataHash = '0x1c361530f42da7d4188ec0d79b1cd32ed3df24c42fe8e3259c33a181378cfb80';
  const issuerDid = 'did:key:zsSOkV7wrCFcKVq6SJwYCth7zFeoO31eam8zJAZc8';

  const baseCertificate = {
    id: 'Vpg3YCjx7i1O',
    degree_title: 'B.Sc. Computer Science',
    graduation_year: 2024,
    class_award: 'First Class Honours',
    data_hash: dataHash,
    verification_status: 'VERIFIED',
    blockchain_transaction_hash: '0xabc123',
    student: {
      full_name: 'Alice Uwimana',
      student_id_number: 'STU-2024-001',
      national_id: '1199780123456789',
    },
    university: {
      name: 'Aurora University',
      did_identifier: issuerDid,
    },
  };

  beforeEach(async () => {
    certificatesService = {
      findByCertificateId: jest.fn(),
      updateDataHash: jest.fn(),
    };

    blockchainService = {
      generateDataHash: jest.fn().mockReturnValue(dataHash),
      getCredential: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: CertificatesService, useValue: certificatesService },
        { provide: BlockchainService, useValue: blockchainService },
      ],
    }).compile();

    service = module.get(VerificationService);
  });

  it('throws NotFoundException when certificate does not exist', async () => {
    certificatesService.findByCertificateId.mockResolvedValue(null);

    await expect(service.verifyCertificate('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when relations are missing', async () => {
    certificatesService.findByCertificateId.mockResolvedValue({
      ...baseCertificate,
      student: null,
      university: null,
    } as any);

    await expect(service.verifyCertificate(baseCertificate.id)).rejects.toThrow(BadRequestException);
  });

  it('returns invalid when recomputed hash does not match stored hash', async () => {
    certificatesService.findByCertificateId.mockResolvedValue(baseCertificate as any);
    blockchainService.generateDataHash.mockReturnValue('0x' + 'a'.repeat(64));

    const result = await service.verifyCertificate(baseCertificate.id);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('tampered');
  });

  it('returns invalid when no on-chain record exists', async () => {
    certificatesService.findByCertificateId.mockResolvedValue(baseCertificate as any);
    blockchainService.getCredential.mockResolvedValue({
      issuerDid: '',
      blockTime: 0,
      isRevoked: false,
      exists: false,
    });

    const result = await service.verifyCertificate(baseCertificate.id);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('No on-chain record found');
  });

  it('returns invalid when credential is revoked on-chain', async () => {
    certificatesService.findByCertificateId.mockResolvedValue(baseCertificate as any);
    blockchainService.getCredential.mockResolvedValue({
      issuerDid,
      blockTime: 1_700_000_000,
      isRevoked: true,
      exists: true,
    });

    const result = await service.verifyCertificate(baseCertificate.id);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('revoked');
  });

  it('returns invalid when on-chain issuer DID does not match database DID', async () => {
    certificatesService.findByCertificateId.mockResolvedValue(baseCertificate as any);
    blockchainService.getCredential.mockResolvedValue({
      issuerDid: 'did:key:different',
      blockTime: 1_700_000_000,
      isRevoked: false,
      exists: true,
    });

    const result = await service.verifyCertificate(baseCertificate.id);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('Issuer DID on chain does not match');
  });

  it('returns valid when all three verification gates pass', async () => {
    certificatesService.findByCertificateId.mockResolvedValue(baseCertificate as any);
    blockchainService.getCredential.mockResolvedValue({
      issuerDid,
      blockTime: 1_700_000_000,
      isRevoked: false,
      exists: true,
    });

    const result = await service.verifyCertificate(baseCertificate.id);

    expect(result.isValid).toBe(true);
    expect(result.certificate.student_name).toBe('Alice Uwimana');
    expect(result.certificate.university_name).toBe('Aurora University');
    expect(result.verification.blockchain_verified).toBe(true);
    expect(result.blockchain.transaction_hash).toBe('0xabc123');
  });

  it('backfills missing data_hash when credential already exists on-chain', async () => {
    certificatesService.findByCertificateId.mockResolvedValue({
      ...baseCertificate,
      data_hash: null,
    } as any);

    blockchainService.getCredential
      .mockResolvedValueOnce({
        issuerDid,
        blockTime: 1_700_000_000,
        isRevoked: false,
        exists: true,
      })
      .mockResolvedValueOnce({
        issuerDid,
        blockTime: 1_700_000_000,
        isRevoked: false,
        exists: true,
      });

    const result = await service.verifyCertificate(baseCertificate.id);

    expect(certificatesService.updateDataHash).toHaveBeenCalledWith(baseCertificate.id, dataHash);
    expect(result.isValid).toBe(true);
  });
});
