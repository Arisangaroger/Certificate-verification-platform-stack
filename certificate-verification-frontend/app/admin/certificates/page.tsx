'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { certificatesApi } from '@/lib/api/endpoints';
import useSWR from 'swr';
import toast from 'react-hot-toast';

interface Certificate {
  id: string;
  student_id: string;
  university_id: string;
  degree_title: string;
  graduation_year: number;
  class_award: string;
  verification_status: 'ISSUED' | 'VERIFIED' | 'FAILED';
  blockchain_transaction_hash?: string;
  created_at: string;
  student?: {
    full_name: string;
    student_id_number: string;
    email: string;
  };
}

export default function CertificatesListPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'ISSUED' | 'VERIFIED' | 'FAILED'>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [editForm, setEditForm] = useState({
    degree_title: '',
    graduation_year: new Date().getFullYear(),
    class_award: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    setUserData(JSON.parse(user));
  }, [router]);

  const { data: certificates, error, isLoading, mutate } = useSWR(
    userData?.university_id ? `/certificates/university/${userData.university_id}` : null,
    () => certificatesApi.getByUniversity(userData.university_id).then(res => res.data)
  );

  const filteredCertificates = certificates?.filter((cert: Certificate) => 
    filter === 'all' ? true : cert.verification_status === filter
  );

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Certificate ID copied');
  };

  const handleEdit = (cert: Certificate) => {
    if (cert.blockchain_transaction_hash) {
      toast.error('Cannot edit certificate that is already on blockchain');
      return;
    }
    setEditingCert(cert);
    setEditForm({
      degree_title: cert.degree_title,
      graduation_year: cert.graduation_year,
      class_award: cert.class_award
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;

    setLoading(true);
    try {
      await certificatesApi.update(editingCert.id, editForm);
      toast.success('Certificate updated successfully');
      mutate();
      setShowEditModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cert: Certificate) => {
    if (cert.blockchain_transaction_hash) {
      toast.error('Cannot delete certificate that is already on blockchain');
      return;
    }

    if (!confirm(`Are you sure you want to delete the certificate for ${cert.student?.full_name}?`)) {
      return;
    }

    try {
      await certificatesApi.delete(cert.id);
      toast.success('Certificate deleted successfully');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
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
          <h1 className="text-3xl font-bold text-slate-900">Certificates</h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-800 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('ISSUED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'ISSUED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Issued
            </button>
            <button
              onClick={() => setFilter('VERIFIED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'VERIFIED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Verified
            </button>
          </div>
        </div>

        {error && (
          <div className="status-banner status-banner-error mb-6" role="alert">
            Failed to load certificates
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

        {filteredCertificates && filteredCertificates.length === 0 && (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-slate-900 mb-2">No Certificates Found</p>
            <p className="text-sm text-slate-600">
              {filter === 'all' ? 'No certificates have been issued yet' : `No ${filter.toLowerCase()} certificates found`}
            </p>
          </div>
        )}

        {filteredCertificates && filteredCertificates.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Degree</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Class Award</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Year</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Issued Date</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((cert: Certificate) => (
                  <tr key={cert.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{cert.student?.full_name}</p>
                        <p className="text-sm text-slate-600">{cert.student?.student_id_number}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">{cert.degree_title}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{cert.class_award}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{cert.graduation_year}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                        cert.verification_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                        cert.verification_status === 'ISSUED' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cert.verification_status === 'ISSUED' ? 'Issued' : cert.verification_status.charAt(0) + cert.verification_status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(cert.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyId(cert.id)}
                          className="text-sm text-brand-800 hover:text-brand-900"
                          title="Copy Certificate ID"
                        >
                          Copy ID
                        </button>
                        {!cert.blockchain_transaction_hash && (
                          <>
                            <button
                              onClick={() => handleEdit(cert)}
                              className="text-sm text-slate-600 hover:text-slate-900"
                              title="Edit certificate"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(cert)}
                              className="text-sm text-red-600 hover:text-red-700"
                              title="Delete certificate"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {cert.blockchain_transaction_hash && (
                          <a
                            href={`https://sepolia-optimistic.etherscan.io/tx/${cert.blockchain_transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1"
                            title="View on blockchain"
                          >
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredCertificates && filteredCertificates.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-600">
            Showing {filteredCertificates.length} of {certificates?.length} certificate(s)
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCert && (
        <div className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 p-4 backdrop-blur-sm">
          <div className="card-prominent max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Edit Certificate
            </h2>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Student:</p>
              <p className="font-medium text-slate-900">{editingCert.student?.full_name}</p>
              <p className="text-sm text-slate-600">{editingCert.student?.student_id_number}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Degree Title *
                </label>
                <input
                  type="text"
                  value={editForm.degree_title}
                  onChange={(e) => setEditForm({ ...editForm, degree_title: e.target.value })}
                  className="input-field"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Graduation Year *
                </label>
                <input
                  type="number"
                  value={editForm.graduation_year}
                  onChange={(e) => setEditForm({ ...editForm, graduation_year: parseInt(e.target.value) })}
                  className="input-field"
                  required
                  min={1900}
                  max={2100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Class Award
                </label>
                <input
                  type="text"
                  value={editForm.class_award}
                  onChange={(e) => setEditForm({ ...editForm, class_award: e.target.value })}
                  className="input-field"
                  placeholder="e.g., First Class, Upper Second"
                  maxLength={100}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
