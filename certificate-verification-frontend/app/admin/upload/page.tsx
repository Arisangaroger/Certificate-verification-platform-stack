'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fileUploadApi } from '@/lib/api/endpoints';
import validators from '@/lib/validators';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface BatchRow {
  id: string;
  student_id_number: string;
  national_id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string;
  degree_title: string;
  graduation_year: string | number;
  class_award: string;
  errors: string[];
}

export default function AdminUpload() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'review' | 'processing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [hasErrors, setHasErrors] = useState(false);
  const [universityId, setUniversityId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    const parsedUser = JSON.parse(user);
    setUserData(parsedUser);
    
    // Automatically set university_id from user data
    if (parsedUser.university_id) {
      setUniversityId(parsedUser.university_id);
    }
  }, [router]);

  const validateRow = (row: any, index: number): BatchRow => {
    const errors: string[] = [];
    
    // Validate required fields
    if (!row.student_id_number?.toString().trim()) {
      errors.push('Student ID is required');
    }
    
    // Validate national ID - strip spaces and check for 16 digits
    const nationalIdStr = row.national_id?.toString().replace(/\s/g, '') || '';
    if (!nationalIdStr) {
      errors.push('National ID is required');
    } else if (!/^\d{16}$/.test(nationalIdStr)) {
      errors.push('National ID must be exactly 16 digits (spaces will be removed)');
    }
    
    if (!row.full_name?.toString().trim()) {
      errors.push('Full name is required');
    }
    
    const emailStr = row.email?.toString().trim() || '';
    if (!emailStr) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      errors.push('Invalid email format');
    }
    
    if (!row.degree_title?.toString().trim()) {
      errors.push('Degree title is required');
    }
    
    if (!row.graduation_year) {
      errors.push('Graduation year is required');
    } else {
      const year = parseInt(row.graduation_year.toString());
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 2000 || year > currentYear) {
        errors.push(`Graduation year must be between 2000 and ${currentYear}`);
      }
    }
    
    if (!row.class_award?.toString().trim()) {
      errors.push('Class award is required');
    }
    
    return {
      id: `row-${index}`,
      student_id_number: row.student_id_number?.toString() || '',
      national_id: nationalIdStr, // Store without spaces
      full_name: row.full_name?.toString() || '',
      email: emailStr,
      phone: row.phone?.toString() || '',
      photo_url: row.photo_url?.toString() || '',
      degree_title: row.degree_title?.toString() || '',
      graduation_year: row.graduation_year?.toString() || '',
      class_award: row.class_award?.toString() || '',
      errors,
    };
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const validatedRows = jsonData.map((row, index) => validateRow(row, index));
      setRows(validatedRows);
      setHasErrors(validatedRows.some(row => row.errors.length > 0));
      setStep('review');
      
      if (validatedRows.some(row => row.errors.length > 0)) {
        toast.error('Validation errors found. Please fix all errors before submitting.');
      } else {
        toast.success('File validated successfully');
      }
    } catch (error) {
      toast.error('Failed to parse file. Please ensure it is a valid Excel file.');
      setFile(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleCellEdit = (rowId: string, field: keyof BatchRow, value: string) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.id === rowId) {
          const updatedRow = { ...row, [field]: value };
          const rowIndex = prevRows.findIndex(r => r.id === rowId);
          return validateRow(updatedRow, rowIndex);
        }
        return row;
      });
      
      setHasErrors(updatedRows.some(row => row.errors.length > 0));
      return updatedRows;
    });
  };

  const handleDeleteRow = (rowId: string) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter(row => row.id !== rowId);
      setHasErrors(updatedRows.some(row => row.errors.length > 0));
      return updatedRows;
    });
    toast.success('Row deleted');
  };

  const handleSubmit = async () => {
    if (hasErrors) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }
    
    if (rows.length === 0) {
      toast.error('No data to submit');
      return;
    }
    
    if (!universityId) {
      toast.error('University ID is required');
      return;
    }
    
    setStep('processing');
    
    try {
      // Convert edited rows to the format expected by backend
      const batchData = rows.map(row => ({
        student_id_number: row.student_id_number,
        national_id: row.national_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        photo_url: row.photo_url,
        degree_title: row.degree_title,
        graduation_year: parseInt(row.graduation_year.toString()),
        class_award: row.class_award,
      }));
      
      // Send edited data as JSON instead of original file
      await fileUploadApi.uploadBatchData(batchData, universityId);
      toast.success('Batch uploaded and minted successfully');
      router.push('/admin/dashboard');
    } catch (error: any) {
      setStep('review');
      const message = error.response?.data?.message || 'Failed to upload batch';
      toast.error(message);
    }
  };

  if (step === 'processing') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="card-prominent text-center max-w-md">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-800 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Minting to Blockchain</h2>
          <p className="text-sm text-slate-600 mb-4">
            Please wait while we process your batch and mint certificates to the Optimism network...
          </p>
          <div className="skeleton-shimmer h-2 w-full rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/admin/dashboard" className="text-sm text-brand-800 hover:text-brand-900 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Issue New Batch</h1>

        {step === 'upload' && (
          <div className="card-prominent max-w-2xl mx-auto">
            {/* Show university info (read-only for non-super-admins, editable for super-admins) */}
            {userData?.role === 'SUPER_ADMIN' ? (
              <div className="mb-6">
                <label htmlFor="university-id" className="block text-sm font-medium text-slate-700 mb-1">
                  University ID *
                </label>
                <input
                  id="university-id"
                  type="text"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="input-field"
                  placeholder="Enter university UUID"
                  required
                />
                <p className="text-sm text-slate-500 mt-1">
                  As Super Admin, you can manually enter any university UUID
                </p>
              </div>
            ) : (
              <div className="mb-6 bg-brand-50 border border-brand-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Uploading for your university
                    </p>
                    <p className="text-sm text-slate-600 mb-2">
                      Certificates will be issued under your institution's profile
                    </p>
                    {universityId && (
                      <p className="text-sm text-slate-500 font-mono bg-white px-2 py-1 rounded border border-slate-200">
                        {universityId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-brand-400 transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-900 mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-slate-600">Supports .xlsx, .xls, and .csv files</p>
              </label>
            </div>

            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900 mb-2">Required columns in your Excel file:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>student_id_number</strong> - Student ID number</li>
                <li>• <strong>national_id</strong> - National ID (16 digits)</li>
                <li>• <strong>full_name</strong> - Student full name</li>
                <li>• <strong>email</strong> - Student email address</li>
                <li>• <strong>phone</strong> - Phone number (optional)</li>
                <li>• <strong>photo_url</strong> - Photo URL (optional)</li>
                <li>• <strong>degree_title</strong> - Name of the degree</li>
                <li>• <strong>graduation_year</strong> - Year of graduation (2000-{new Date().getFullYear()})</li>
                <li>• <strong>class_award</strong> - Class of award (e.g., First Class Honours)</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div>
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-800 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    Data Processing Info
                  </p>
                  <p className="text-sm text-slate-600">
                    Spaces in National IDs will be automatically removed (e.g., "1 1991 7 0034562 1 47" becomes "1199170034562147")
                  </p>
                </div>
              </div>
            </div>

            {hasErrors && (
              <div className="status-banner status-banner-error mb-6" role="alert">
                <strong>Validation Errors:</strong> {rows.filter(r => r.errors.length > 0).length} row(s) contain errors. Fix or delete them before submitting.
              </div>
            )}

            <div className="card-prominent mb-6">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Review batch</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Preview before minting</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Confirm row data below, then authorize issuance to the blockchain.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="card-stat card-stat-brand">
                  <p className="text-sm text-slate-600">Total Rows</p>
                  <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
                </div>
                <div className="card-stat card-stat-verified">
                  <p className="text-sm text-slate-600">Valid Rows</p>
                  <p className="text-2xl font-bold text-emerald-600">{rows.filter(r => r.errors.length === 0).length}</p>
                </div>
                <div className="card-stat card-stat-error">
                  <p className="text-sm text-slate-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{rows.filter(r => r.errors.length > 0).length}</p>
                </div>
              </div>
            </div>

            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Student ID</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">National ID</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Full Name</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Phone</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Photo URL</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Degree Title</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Year</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Class Award</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={`border-b border-slate-100 ${row.errors.length > 0 ? 'bg-red-50' : ''}`}>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={row.student_id_number}
                          onChange={(e) => handleCellEdit(row.id, 'student_id_number', e.target.value)}
                          className="input-field text-sm py-1 min-w-[120px]"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={row.national_id}
                          onChange={(e) => handleCellEdit(row.id, 'national_id', e.target.value)}
                          className="input-field text-sm py-1 min-w-[140px]"
                          maxLength={16}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={row.full_name}
                          onChange={(e) => handleCellEdit(row.id, 'full_name', e.target.value)}
                          className="input-field text-sm py-1 min-w-[180px]"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => handleCellEdit(row.id, 'email', e.target.value)}
                          className="input-field text-sm py-1 min-w-[200px]"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={row.phone}
                          onChange={(e) => handleCellEdit(row.id, 'phone', e.target.value)}
                          className="input-field text-sm py-1 min-w-[120px]"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={row.photo_url}
                          onChange={(e) => handleCellEdit(row.id, 'photo_url', e.target.value)}
                          className="input-field text-sm py-1 min-w-[200px]"
                          placeholder="https://..."
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={row.degree_title}
                          onChange={(e) => handleCellEdit(row.id, 'degree_title', e.target.value)}
                          className="input-field text-sm py-1 min-w-[180px]"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={row.graduation_year}
                          onChange={(e) => handleCellEdit(row.id, 'graduation_year', e.target.value)}
                          className="input-field text-sm py-1 min-w-[100px]"
                          min="2000"
                          max={new Date().getFullYear()}
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={row.class_award}
                          onChange={(e) => handleCellEdit(row.id, 'class_award', e.target.value)}
                          className="input-field text-sm py-1 min-w-[150px]"
                          placeholder="e.g., First Class"
                        />
                      </td>
                      <td className="py-3 px-2">
                        {row.errors.length > 0 ? (
                          <div className="group relative">
                            <span className="text-sm text-red-600 cursor-help">
                              {row.errors.length} error(s)
                            </span>
                            <div className="hidden group-hover:block absolute z-10 bg-slate-900 text-white text-sm rounded p-2 mt-1 w-48">
                              {row.errors.map((err, idx) => (
                                <div key={idx}>• {err}</div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-emerald-600">✓ Valid</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-red-600 hover:text-red-700 text-sm whitespace-nowrap"
                          aria-label="Delete row"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  setStep('upload');
                  setRows([]);
                  setFile(null);
                  setHasErrors(false);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={hasErrors || rows.length === 0}
                className="btn-primary"
              >
                Authorize & Mint to Blockchain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
