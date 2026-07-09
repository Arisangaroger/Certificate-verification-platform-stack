import apiClient from './client';

// Authentication APIs
export const authApi = {
  adminLogin: (email: string, password: string) =>
    apiClient.post('/auth/admin/login', { email, password }),
  
  requestStudentOtp: (student_id_number: string, national_id: string) =>
    apiClient.post('/auth/student/request-otp', { student_id_number, national_id }),
  
  verifyStudentOtp: (student_id_number: string, national_id: string, otp: string) =>
    apiClient.post('/auth/student/verify-otp', { student_id_number, national_id, otp }),
};

// Certificate APIs
export const certificatesApi = {
  getByStudent: (studentId: string) =>
    apiClient.get(`/certificates/student/${studentId}`),
  
  getStats: () => apiClient.get('/certificates/stats'),
  
  getByUniversity: (universityId: string) =>
    apiClient.get(`/certificates/university/${universityId}`),
  
  getStatsByUniversity: (universityId: string) =>
    apiClient.get(`/certificates/university/${universityId}/stats`),
  
  update: (certificateId: string, data: {
    degree_title?: string;
    graduation_year?: number;
    class_award?: string;
  }) => apiClient.patch(`/certificates/${certificateId}`, data),
  
  delete: (certificateId: string) =>
    apiClient.delete(`/certificates/${certificateId}`),
  
  downloadPdf: (certificateId: string) =>
    apiClient.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob',
    }),
};

// File Upload APIs
export const fileUploadApi = {
  uploadBatch: (file: File, university_id: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('university_id', university_id);
    
    return apiClient.post('/file-upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadBatchData: (data: any[], university_id: string) => {
    return apiClient.post('/file-upload/batch-data', {
      data,
      university_id,
    });
  },
};

// Verification APIs
export const verificationApi = {
  verify: (certificate_id: string) =>
    apiClient.get(`/verification/${certificate_id}`),
};

// Universities APIs
export const universitiesApi = {
  getAll: () => apiClient.get('/universities'),
  
  getOne: (id: string) => apiClient.get(`/universities/${id}`),
  
  create: (data: { 
    name: string; 
    email: string; 
    phone_number?: string; 
    wallet_address?: string; 
    did_identifier?: string; 
    logo_url?: string;
  }) => apiClient.post('/universities', data),
  
  update: (id: string, data: Partial<{ 
    name: string; 
    email: string; 
    phone_number?: string; 
    wallet_address?: string; 
    did_identifier?: string; 
    logo_url?: string;
  }>) => apiClient.patch(`/universities/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/universities/${id}`),

  provisionIdentity: (id: string) =>
    apiClient.post(`/universities/${id}/provision-identity`),
};

// Admin Users APIs
export const adminUsersApi = {
  getAll: () => apiClient.get('/admin-users'),
  
  getOne: (id: string) => apiClient.get(`/admin-users/${id}`),
  
  create: (data: { 
    email: string; 
    password: string; 
    full_name: string; 
    role: string; 
    university_id: string;
  }) => apiClient.post('/admin-users', data),
  
  update: (id: string, data: Partial<{ 
    email: string; 
    full_name: string; 
    role: string;
  }>) => apiClient.patch(`/admin-users/${id}`, data),
  
  deactivate: (id: string) => apiClient.patch(`/admin-users/${id}/deactivate`),
  
  activate: (id: string) => apiClient.patch(`/admin-users/${id}/activate`),
  
  delete: (id: string) => apiClient.delete(`/admin-users/${id}`),
};

// Students APIs
export const studentsApi = {
  getProfile: () => apiClient.get('/students/profile'),
  
  getOne: (id: string) => apiClient.get(`/students/${id}`),
  
  getByUniversity: (universityId: string) =>
    apiClient.get(`/students/university/${universityId}`),
  
  getCount: () => apiClient.get('/students/count'),
  
  getCountByUniversity: (universityId: string) =>
    apiClient.get(`/students/university/${universityId}/count`),
};
