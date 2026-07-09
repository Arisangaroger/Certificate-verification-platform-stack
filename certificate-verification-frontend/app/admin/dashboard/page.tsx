'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { certificatesApi, studentsApi } from '@/lib/api/endpoints';

interface StatsData {
  total: number;
  verified: number;
  issued: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  
  // Fetch certificate stats with SWR
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR<StatsData>(
    userData ? (userData.role === 'SUPER_ADMIN' ? '/certificates/stats' : `/certificates/university/${userData.university_id}/stats`) : null,
    () => {
      if (userData.role === 'SUPER_ADMIN') {
        return certificatesApi.getStats().then(res => res.data);
      } else {
        return certificatesApi.getStatsByUniversity(userData.university_id).then(res => res.data);
      }
    }
  );

  // Fetch students count
  const { data: studentsCount, isLoading: studentsLoading } = useSWR(
    userData ? (userData.role === 'SUPER_ADMIN' ? '/students/count' : `/students/university/${userData.university_id}/count`) : null,
    () => {
      if (userData.role === 'SUPER_ADMIN') {
        return studentsApi.getCount().then(res => res.data.count);
      } else {
        return studentsApi.getCountByUniversity(userData.university_id).then(res => res.data.count);
      }
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    setUserData(JSON.parse(user));
  }, [router]);

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton-shimmer h-8 w-32"></div>
      </div>
    );
  }

  const isSuperAdmin = userData.role === 'SUPER_ADMIN';

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{isSuperAdmin ? 'Super Admin' : 'Operations'}</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
          </div>

          {/* Stats Cards - Clickable for regular admins, static for super admin */}
          {isSuperAdmin ? (
            // Super Admin - Static cards (no navigation)
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="card-stat card-stat-brand">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total Certificates</p>
                      {statsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-slate-900">{stats?.total ?? 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="card-stat card-stat-verified">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Verified</p>
                      {statsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-emerald-600">{stats?.verified ?? 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="card-stat card-stat-pending">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Issued</p>
                      {statsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-amber-600">{stats?.issued ?? 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="card-stat card-stat-brand">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total Graduates</p>
                      {studentsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-brand-800">{studentsCount ?? 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Regular Admin - Clickable cards (with navigation)
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Link href="/admin/certificates" className="card-stat card-stat-brand cursor-pointer transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total Certificates</p>
                      {statsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-slate-900">{stats?.total ?? 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/certificates" className="card-stat card-stat-verified cursor-pointer transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Verified</p>
                      {statsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-emerald-600">{stats?.verified ?? 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/certificates" className="card-stat card-stat-pending cursor-pointer transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Issued</p>
                      {statsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-amber-600">{stats?.issued ?? 0}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Link href="/admin/students" className="card-stat card-stat-brand cursor-pointer transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Total Graduates</p>
                      {studentsLoading ? (
                        <div className="skeleton-shimmer h-8 w-16"></div>
                      ) : (
                        <p className="text-2xl font-bold text-brand-800">{studentsCount ?? 0}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-1">Click to view all students</p>
                    </div>
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/history" className="card-stat card-stat-pending cursor-pointer transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Batch History</p>
                      <p className="text-2xl font-bold text-slate-900">View All</p>
                      <p className="text-sm text-slate-500 mt-1">View all upload history</p>
                    </div>
                    <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {isSuperAdmin && (
                <>
                  <Link
                    href="/admin/universities"
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Manage Universities</p>
                      <p className="text-sm text-slate-600">Add or edit universities</p>
                    </div>
                  </Link>

                  <Link
                    href="/admin/users"
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Manage Admin Users</p>
                      <p className="text-sm text-slate-600">Add or edit admin users</p>
                    </div>
                  </Link>
                </>
              )}

              <Link
                href="/admin/upload"
                className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Issue New Batch</p>
                  <p className="text-sm text-slate-600">Upload CSV/Excel file</p>
                </div>
              </Link>

              <Link
                href="/admin/history"
                className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">View History</p>
                  <p className="text-sm text-slate-600">Review past batches</p>
                </div>
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
}
