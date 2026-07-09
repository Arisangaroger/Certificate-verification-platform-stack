// Common types used across the application

export interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'REGISTRAR';
}

export interface Student {
  student_id: string;
  student_id_number: string;
  full_name: string;
  email: string;
  phone_number: string;
  national_id: string;
  university_id: string;
}

export interface Certificate {
  id: string; // certificate_id in backend
  student_id: string;
  university_id: string;
  degree_title: string; // Backend field name
  graduation_year: number;
  class_award: string; // Backend field name (e.g., "First Class Honours")
  data_hash: string;
  pdf_url?: string;
  blockchain_transaction_hash?: string;
  verification_status: 'ISSUED' | 'VERIFIED' | 'FAILED';
  created_at: string;
  student?: Student;
  university?: {
    name: string;
  };
}

export interface University {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  wallet_address?: string;
  did_identifier?: string;
  logo_url?: string;
  created_at: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface VerificationResponse {
  isValid: boolean;
  certificate?: {
    certificate_id: string;
    student_name: string;
    student_id_number: string;
    university_name: string;
    degree_title: string;
    graduation_year: number;
    class_award: string;
  };
  blockchain?: {
    transaction_hash: string;
    timestamp: string;
  };
  verification?: {
    database_hash_match: boolean;
    blockchain_verified: boolean;
    status: string;
  };
}
