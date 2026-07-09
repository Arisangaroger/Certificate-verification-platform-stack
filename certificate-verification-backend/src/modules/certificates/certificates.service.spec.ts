import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificatesService } from './certificates.service';
import { Certificate } from './entities/certificate.entity';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let repository: jest.Mocked<
    Pick<
      Repository<Certificate>,
      'findOne' | 'update' | 'delete' | 'create' | 'save' | 'count' | 'find'
    >
  >;

  const issuedCertificate: Certificate = {
    id: 'Vpg3YCjx7i1O',
    student_id: 'student-uuid',
    university_id: 'university-uuid',
    degree_title: 'B.Sc. Computer Science',
    graduation_year: 2024,
    class_award: 'First Class Honours',
    data_hash: '0xhash',
    pdf_url: null,
    blockchain_transaction_hash: null,
    verification_status: 'ISSUED',
    created_at: new Date(),
  } as Certificate;

  const verifiedCertificate: Certificate = {
    ...issuedCertificate,
    verification_status: 'VERIFIED',
    blockchain_transaction_hash: '0xtxhash',
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((value) => value as Certificate),
      save: jest.fn(async (value) => value as Certificate),
      count: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        {
          provide: getRepositoryToken(Certificate),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(CertificatesService);
  });

  describe('update', () => {
    it('updates an ISSUED certificate', async () => {
      repository.findOne
        .mockResolvedValueOnce(issuedCertificate)
        .mockResolvedValueOnce({
          ...issuedCertificate,
          degree_title: 'B.Sc. Information Technology',
        });

      const updated = await service.update(issuedCertificate.id, {
        degree_title: 'B.Sc. Information Technology',
      });

      expect(repository.update).toHaveBeenCalledWith(issuedCertificate.id, {
        degree_title: 'B.Sc. Information Technology',
      });
      expect(updated.degree_title).toBe('B.Sc. Information Technology');
    });

    it('blocks update when certificate is already on blockchain', async () => {
      repository.findOne.mockResolvedValue(verifiedCertificate);

      await expect(
        service.update(verifiedCertificate.id, { degree_title: 'Changed Degree' }),
      ).rejects.toThrow('Cannot edit certificate that is already on blockchain');
    });
  });

  describe('delete', () => {
    it('deletes an ISSUED certificate', async () => {
      repository.findOne.mockResolvedValue(issuedCertificate);

      await service.delete(issuedCertificate.id);

      expect(repository.delete).toHaveBeenCalledWith(issuedCertificate.id);
    });

    it('blocks delete when certificate is already on blockchain', async () => {
      repository.findOne.mockResolvedValue(verifiedCertificate);

      await expect(service.delete(verifiedCertificate.id)).rejects.toThrow(
        'Cannot delete certificate that is already on blockchain',
      );
    });
  });

  describe('getStats', () => {
    it('returns total, verified, and issued counts', async () => {
      repository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(4);

      await expect(service.getStats()).resolves.toEqual({
        total: 10,
        verified: 6,
        issued: 4,
      });
    });
  });
});
