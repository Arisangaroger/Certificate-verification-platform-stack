'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { certificatesApi } from '@/lib/api/endpoints';
import useSWR from 'swr';

interface Certificate {
  id: string;
  student_id: string;
  degree_title: string;
  graduation_year: number;
  class_award: string;
  verification_status: string;
  blockchain_transaction_hash?: string;
  created_at: string;
  student?: {
    full_name: string;
    student_id_number: string;
  };
}

export default function AdminHistory() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'issued'>('all');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    setUserData(JSON.parse(user));
  }, [router]);

  const { data: certificates, error, isLoading } = useSWR(
    userData?.university_id ? `/certificates/university/${userData.university_id}` : null,
    () => certificatesApi.getByUniversity(userData.university_id).then(res => res.data)
  );

  // Group certificates by date
  const groupByDate = (certs: Certificate[]) => {
    const grouped: { [key: string]: Certificate[] } = {};
    
    certs?.forEach(cert => {
      const date = new Date(cert.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(cert);
    });
    
    return grouped;
  };

  const filteredCerts = certificates?.filter((cert: Certificate) => {
    if (filter === 'verified') return cert.verification_status === 'VERIFIED';
    if (filter === 'issued') return cert.verification_status === 'ISSUED';
    return true;
  });

  const groupedCerts = groupByDate(filteredCerts || []);

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton-shimmer h-8 w-32"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Credential History</h1>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-brand-800 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                All ({certificates?.length || 0})
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'verified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Verified ({certificates?.filter((c: Certificate) => c.verification_status === 'VERIFIED').length || 0})
              </button>
              <button
                onClick={() => setFilter('issued')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'issued'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Issued ({certificates?.filter((c: Certificate) => c.verification_status === 'ISSUED').length || 0})
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="card">
              <div className="skeleton-shimmer h-6 w-3/4 mb-4"></div>
              <div className="skeleton-shimmer h-4 w-1/2"></div>
            </div>
          )}

          {error && (
            <div className="card bg-red-50 border-red-200 text-red-800">
              <p>Failed to load certificate history</p>
            </div>
          )}

          {!isLoading && !error && filteredCerts?.length === 0 && (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-slate-900 mb-2">No Certificates Found</p>
              <p className="text-sm text-slate-600 mb-4">
                {filter === 'all' 
                  ? 'Start by uploading your first certificate batch'
                  : `No ${filter} certificates found`
                }
              </p>
              <Link href="/admin/upload" className="btn-primary inline-block">
                Upload Certificates
              </Link>
            </div>
          )}

          {/* Timeline View */}
          {!isLoading && !error && filteredCerts && filteredCerts.length > 0 && (
            <div className="space-y-6">
              {Object.entries(groupedCerts).map(([date, certs]) => (
                <div key={date} className="card">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                    <div className="w-2 h-2 bg-brand-800 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-slate-900">{date}</h3>
                    <span className="text-sm text-slate-600">({certs.length} certificate{certs.length > 1 ? 's' : ''})</span>
                  </div>

                  <div className="space-y-3">
                    {certs.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-medium text-slate-900">{cert.student?.full_name}</p>
                            <span className={`inline-flex px-2 py-0.5 text-sm font-medium rounded-full ${
                              cert.verification_status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {cert.verification_status === 'VERIFIED' ? '✓ Verified' : 'Issued'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {cert.degree_title} • {cert.graduation_year} • ID: {cert.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {cert.blockchain_transaction_hash && (
                            <a
                              href={`https://sepolia-optimistic.etherscan.io/tx/${cert.blockchain_transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-brand-800 hover:text-brand-900 flex items-center gap-1"
                              title="View on blockchain"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Blockchain
                            </a>
                          )}
                          <span className="text-sm text-slate-500">
                            {new Date(cert.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
