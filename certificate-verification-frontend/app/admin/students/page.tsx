'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { studentsApi } from '@/lib/api/endpoints';
import useSWR from 'swr';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  student_id_number: string;
  full_name: string;
  email: string;
  phone_number?: string;
  national_id: string;
  university_id: string;
  created_at: string;
  certificates?: Array<{
    id: string;
    degree_title: string;
    verification_status: string;
  }>;
}

export default function StudentsListPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    setUserData(JSON.parse(user));
  }, [router]);

  const { data: students, error, isLoading } = useSWR(
    userData?.university_id ? `/students/university/${userData.university_id}` : null,
    () => studentsApi.getByUniversity(userData.university_id).then(res => res.data)
  );

  const filteredStudents = students?.filter((student: Student) =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied');
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton-shimmer h-8 w-32"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="text-sm text-brand-800 hover:text-brand-900 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Graduates</h1>
          
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="status-banner status-banner-error mb-6" role="alert">
            Failed to load students
          </div>
        )}

        {isLoading && (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card">
                <div className="skeleton-shimmer h-6 w-3/4 mb-4"></div>
                <div className="skeleton-shimmer h-4 w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {filteredStudents && filteredStudents.length === 0 && (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-lg font-medium text-slate-900 mb-2">No Students Found</p>
            <p className="text-sm text-slate-600">
              {searchTerm ? 'No students match your search' : 'No students have been registered yet'}
            </p>
          </div>
        )}

        {filteredStudents && filteredStudents.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Student ID</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Full Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">National ID</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Certificates</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Registered</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student: Student) => (
                  <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-slate-900">{student.student_id_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{student.full_name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">{student.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">{student.phone_number || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-slate-600">{student.national_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {student.certificates?.length || 0}
                        </span>
                        {student.certificates && student.certificates.length > 0 && (
                          <div className="flex gap-1">
                            {student.certificates.map(cert => (
                              <span
                                key={cert.id}
                                className={`w-2 h-2 rounded-full ${
                                  cert.verification_status === 'VERIFIED' ? 'bg-emerald-500' :
                                  cert.verification_status === 'ISSUED' ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                title={cert.degree_title}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">
                        {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleCopyEmail(student.email)}
                        className="text-sm text-brand-800 hover:text-brand-900"
                        title="Copy Email"
                      >
                        Copy Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredStudents && filteredStudents.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-600">
            Showing {filteredStudents.length} of {students?.length} student(s)
          </div>
        )}
      </div>
    </div>
  );
}
