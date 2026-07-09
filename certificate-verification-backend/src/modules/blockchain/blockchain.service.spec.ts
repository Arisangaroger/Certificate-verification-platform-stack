import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let originalOperatorKey: string | undefined;
  let originalRegistryAddress: string | undefined;

  const validTestPrivateKey =
    '0xac0974bec39a17e36ba4a6f4ed47108f14dbcd8d4c446f295ce54aba8984ac99';
  const validTestRegistryAddress = '0xC244d92B2bdEE4f755734C601C156D9B67774ec3';

  const sampleCertificate = {
    degree_title: 'Bachelor of Science in Computer Science',
    graduation_year: 2024,
    student: {
      student_id_number: 'STU-2024-001',
      national_id: '1199780123456789',
      full_name: 'Alice Uwimana',
    },
  };

  beforeEach(() => {
    originalOperatorKey = process.env.OPERATOR_PRIVATE_KEY;
    originalRegistryAddress = process.env.CREDENTIAL_REGISTRY_ADDRESS;
    process.env.OPERATOR_PRIVATE_KEY = validTestPrivateKey;
    process.env.CREDENTIAL_REGISTRY_ADDRESS = validTestRegistryAddress;
    service = new BlockchainService();
  });

  afterEach(() => {
    if (originalOperatorKey === undefined) {
      delete process.env.OPERATOR_PRIVATE_KEY;
    } else {
      process.env.OPERATOR_PRIVATE_KEY = originalOperatorKey;
    }

    if (originalRegistryAddress === undefined) {
      delete process.env.CREDENTIAL_REGISTRY_ADDRESS;
    } else {
      process.env.CREDENTIAL_REGISTRY_ADDRESS = originalRegistryAddress;
    }
  });

  describe('buildDataString', () => {
    it('concatenates student and degree fields in canonical order', () => {
      expect(service.buildDataString(sampleCertificate)).toBe(
        'STU-2024-0011199780123456789Alice UwimanaBachelor of Science in Computer Science2024',
      );
    });

    it('uses empty strings for missing optional fields', () => {
      expect(
        service.buildDataString({
          degree_title: 'B.Sc.',
          graduation_year: 2023,
          student: {},
        }),
      ).toBe('B.Sc.2023');
    });
  });

  describe('generateDataHash', () => {
    it('returns a deterministic keccak256 hash with 0x prefix', () => {
      const hash = service.generateDataHash(sampleCertificate);

      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(hash).toBe(service.generateDataHash(sampleCertificate));
    });

    it('matches ethers keccak256 of the canonical data string', () => {
      const dataString = service.buildDataString(sampleCertificate);
      const expected = ethers.keccak256(ethers.toUtf8Bytes(dataString));

      expect(service.generateDataHash(sampleCertificate)).toBe(expected);
    });

    it('changes when any hashed field changes', () => {
      const baseHash = service.generateDataHash(sampleCertificate);
      const alteredHash = service.generateDataHash({
        ...sampleCertificate,
        degree_title: 'Bachelor of Arts',
      });

      expect(alteredHash).not.toBe(baseHash);
    });
  });

  describe('issueCertificatesBatch', () => {
    it('rejects an empty certificate batch', async () => {
      await expect(service.issueCertificatesBatch([], 'did:key:zTest')).rejects.toThrow(
        'Empty certificate batch',
      );
    });

    it('requires OPERATOR_PRIVATE_KEY to be configured', async () => {
      delete process.env.OPERATOR_PRIVATE_KEY;

      await expect(
        service.issueCertificatesBatch([sampleCertificate], 'did:key:zTest'),
      ).rejects.toThrow('Blockchain operator key is not configured on the server');
    });

    it('requires CREDENTIAL_REGISTRY_ADDRESS to be configured', async () => {
      delete process.env.CREDENTIAL_REGISTRY_ADDRESS;

      await expect(
        service.issueCertificatesBatch([sampleCertificate], 'did:key:zTest'),
      ).rejects.toThrow('Credential registry contract address is not configured on the server');
    });
  });
});
