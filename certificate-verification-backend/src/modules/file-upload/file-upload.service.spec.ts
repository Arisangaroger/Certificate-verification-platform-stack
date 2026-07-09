import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import { StudentsService } from '../students/students.service';
import { CertificatesService } from '../certificates/certificates.service';
import { BlockchainService } from '../blockchain/blockchain.service';

describe('FileUploadService', () => {
  let service: FileUploadService;

  const universityId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: StudentsService,
          useValue: {
            findByRegistrationAndNID: jest.fn(),
            createBulk: jest.fn(),
          },
        },
        {
          provide: CertificatesService,
          useValue: {
            createBulk: jest.fn(),
          },
        },
        {
          provide: BlockchainService,
          useValue: {
            generateDataHash: jest.fn().mockReturnValue('0xgeneratedhash'),
          },
        },
      ],
    }).compile();

    service = module.get(FileUploadService);
  });

  describe('processDataArray', () => {
    it('deduplicates students but keeps one certificate per row', () => {
      const rows = [
        {
          student_id_number: 'STU-2024-001',
          national_id: '1199780123456789',
          full_name: 'Alice Uwimana',
          email: 'alice@student.edu',
          degree_title: 'B.Sc. Computer Science',
          graduation_year: '2024',
          class_award: 'First Class Honours',
        },
        {
          student_id_number: 'STU-2024-001',
          national_id: '1199780123456789',
          full_name: 'Alice Uwimana',
          email: 'alice@student.edu',
          degree_title: 'Certificate in Data Science',
          graduation_year: '2025',
          class_award: 'Distinction',
        },
      ];

      const result = service.processDataArray(rows, universityId);

      expect(result.students).toHaveLength(1);
      expect(result.certificates).toHaveLength(2);
      expect(result.students[0].student_id_number).toBe('STU-2024-001');
      expect(result.certificates[0].degree_title).toBe('B.Sc. Computer Science');
      expect(result.certificates[1].degree_title).toBe('Certificate in Data Science');
    });

    it('strips spaces from national_id before storing the student', () => {
      const rows = [
        {
          student_id_number: 'STU-2024-002',
          national_id: '1199 7801 2345 6789',
          full_name: 'Bob Nkurunziza',
          email: 'bob@student.edu',
          degree_title: 'B.A. Economics',
          graduation_year: '2023',
          class_award: 'Second Class Upper',
        },
      ];

      const result = service.processDataArray(rows, universityId);

      expect(result.students[0].national_id).toBe('1199780123456789');
    });

    it('skips rows without student_id_number', () => {
      const result = service.processDataArray(
        [
          {
            full_name: 'Missing ID',
            email: 'missing@student.edu',
            degree_title: 'B.Sc.',
            graduation_year: '2024',
            class_award: 'Pass',
          },
        ],
        universityId,
      );

      expect(result.students).toHaveLength(0);
      expect(result.certificates).toHaveLength(0);
    });
  });
});
