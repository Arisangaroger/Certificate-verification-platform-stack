'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { certificatesApi, universitiesApi } from '@/lib/api/endpoints';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface Certificate {
  id: string;
  student_id: string;
  university_id: string;
  degree_title: string;
  graduation_year: number;
  class_award: string;
  verification_status: string;
  blockchain_transaction_hash?: string;
  data_hash?: string;
  created_at: string;
  student?: {
    full_name: string;
    student_id_number: string;
    national_id: string;
  };
}

interface University {
  id: string;
  name: string;
  did_identifier?: string;
  wallet_address?: string;
}

export default function BlockchainManagementPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());
  const [isIssuing, setIsIssuing] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [university, setUniversity] = useState<University | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    const parsedUser = JSON.parse(user);
    setUserData(parsedUser);

    // Load university details
    if (parsedUser.university_id) {
      apiClient.get(`/universities/${parsedUser.university_id}`)
        .then(res => setUniversity(res.data))
        .catch(err => console.error('Failed to load university:', err));
    }
  }, [router]);

  // Fetch certificates that haven't been issued to blockchain yet
  const { data: certificates, error, isLoading, mutate } = useSWR(
    userData?.university_id ? `/certificates/university/${userData.university_id}` : null,
    () => certificatesApi.getByUniversity(userData.university_id).then(res => res.data)
  );

  const pendingCertificates = certificates?.filter((cert: Certificate) => 
    !cert.blockchain_transaction_hash && cert.verification_status !== 'REVOKED'
  );

  const issuedCertificates = certificates?.filter((cert: Certificate) => 
    cert.blockchain_transaction_hash
  );

  const toggleCertSelection = (certId: string) => {
    const newSelection = new Set(selectedCerts);
    if (newSelection.has(certId)) {
      newSelection.delete(certId);
    } else {
      newSelection.add(certId);
    }
    setSelectedCerts(newSelection);
  };

  const selectAll = () => {
    if (pendingCertificates) {
      setSelectedCerts(new Set(pendingCertificates.map((c: Certificate) => c.id)));
    }
  };

  const deselectAll = () => {
    setSelectedCerts(new Set());
  };

  const handleProvisionIdentity = async () => {
    if (!userData?.university_id) return;

    setIsProvisioning(true);
    const toastId = toast.loading('Generating blockchain identity...');

    try {
      const response = await universitiesApi.provisionIdentity(userData.university_id);
      setUniversity(response.data);
      toast.success('Blockchain identity configured successfully', { id: toastId });
    } catch (error: any) {
      console.error('Identity provisioning failed:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to configure blockchain identity';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message), { id: toastId });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleIssueToBlockchain = async () => {
    if (selectedCerts.size === 0) {
      toast.error('Please select at least one certificate');
      return;
    }

    setIsIssuing(true);

    try {
      const response = await apiClient.post(
        `/certificates/issue-to-blockchain/${userData.university_id}`,
        {
          certificateIds: Array.from(selectedCerts)
        }
      );

      toast.success(
        `✅ ${selectedCerts.size} certificate(s) issued to blockchain!`,
        { duration: 5000 }
      );

      // Show transaction details
      if (response.data.transactionHash) {
        toast.success(
          <div>
            <p className="font-medium">View on Blockchain</p>
            <a 
              href={response.data.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-800 hover:text-brand-900 underline"
            >
              {response.data.transactionHash.slice(0, 10)}...
            </a>
          </div>,
          { duration: 10000 }
        );
      }

      // Refresh certificates list and university identity
      mutate();
      if (userData?.university_id) {
        apiClient.get(`/universities/${userData.university_id}`)
          .then(res => setUniversity(res.data))
          .catch(err => console.error('Failed to reload university:', err));
      }
      setSelectedCerts(new Set());

    } catch (error: any) {
      console.error('Blockchain issuance failed:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to issue certificates to blockchain';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setIsIssuing(false);
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
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/dashboard" 
            className="text-sm text-brand-800 hover:text-brand-900 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Blockchain Management</h1>
          <p className="text-slate-600">Issue certificates to Optimism blockchain for immutable verification</p>
        </div>

        {/* University Blockchain Status */}
        {university && (
          <div className="card mb-6 bg-gradient-to-r from-brand-50 to-gold-50 border-brand-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">University Blockchain Identity</h3>
                {university.did_identifier ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-700">
                      <span className="font-medium">DID:</span>{' '}
                      <code className="bg-white px-2 py-0.5 rounded text-sm">
                        {university.did_identifier}
                      </code>
                    </p>
                    {university.wallet_address && (
                      <p className="text-slate-700">
                        <span className="font-medium">Wallet:</span>{' '}
                        <code className="bg-white px-2 py-0.5 rounded text-sm">
                          {university.wallet_address}
                        </code>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-amber-700 text-sm">
                      Blockchain identity not configured yet. Generate one to issue certificates on-chain.
                    </p>
                    <button
                      onClick={handleProvisionIdentity}
                      disabled={isProvisioning}
                      className="px-4 py-2 bg-brand-800 text-white rounded-lg hover:bg-brand-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isProvisioning ? 'Generating...' : 'Generate Blockchain Identity'}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                ✓ Connected
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card-stat card-stat-pending">
            <p className="text-sm text-slate-600 mb-1">Pending Issuance</p>
            <p className="text-2xl font-bold text-slate-900">
              {pendingCertificates?.length || 0}
            </p>
          </div>
          <div className="card-stat card-stat-verified">
            <p className="text-sm text-slate-600 mb-1">On Blockchain</p>
            <p className="text-2xl font-bold text-emerald-600">
              {issuedCertificates?.length || 0}
            </p>
          </div>
          <div className="card-stat card-stat-brand">
            <p className="text-sm text-slate-600 mb-1">Selected</p>
            <p className="text-2xl font-bold text-brand-800">
              {selectedCerts.size}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {pendingCertificates && pendingCertificates.length > 0 && (
          <div className="card mb-6 bg-brand-50 border-brand-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Ready to Issue {selectedCerts.size > 0 && `(${selectedCerts.size} selected)`}
                </h3>
                <p className="text-sm text-slate-600">
                  Select certificates below and click "Issue to Blockchain"
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-4 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors"
                >
                  Deselect All
                </button>
                <button
                  onClick={handleIssueToBlockchain}
                  disabled={selectedCerts.size === 0 || isIssuing || isProvisioning}
                  className="px-6 py-2 bg-brand-800 text-white rounded-lg hover:bg-brand-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {isIssuing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Issuing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Issue to Blockchain
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Certificates Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Pending Certificates</h2>
          
          {isLoading && (
            <div className="card">
              <div className="skeleton-shimmer h-6 w-3/4 mb-4"></div>
              <div className="skeleton-shimmer h-4 w-1/2"></div>
            </div>
          )}

          {error && (
            <div className="status-banner status-banner-error">
              Failed to load certificates
            </div>
          )}

          {pendingCertificates && pendingCertificates.length === 0 && (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-emerald-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-slate-900 mb-2">All Caught Up!</p>
              <p className="text-sm text-slate-600">No pending certificates. All have been issued to blockchain.</p>
            </div>
          )}

          {pendingCertificates && pendingCertificates.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedCerts.size === pendingCertificates.length}
                        onChange={e => e.target.checked ? selectAll() : deselectAll()}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Degree</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Year</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Certificate ID</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCertificates.map((cert: Certificate) => (
                    <tr 
                      key={cert.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                        selectedCerts.has(cert.id) ? 'bg-brand-50' : ''
                      }`}
                      onClick={() => toggleCertSelection(cert.id)}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedCerts.has(cert.id)}
                          onChange={() => toggleCertSelection(cert.id)}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{cert.student?.full_name}</p>
                          <p className="text-sm text-slate-600">{cert.student?.student_id_number}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">{cert.degree_title}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{cert.graduation_year}</td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded">{cert.id}</code>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(cert.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Issued Certificates Section */}
        {issuedCertificates && issuedCertificates.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">On Blockchain</h2>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Degree</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Certificate ID</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Transaction</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedCertificates.map((cert: Certificate) => (
                    <tr key={cert.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{cert.student?.full_name}</p>
                          <p className="text-sm text-slate-600">{cert.student?.student_id_number}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">{cert.degree_title}</td>
                      <td className="py-3 px-4">
                        <code className="text-sm bg-slate-100 px-2 py-1 rounded">{cert.id}</code>
                      </td>
                      <td className="py-3 px-4">
                        {cert.blockchain_transaction_hash && (
                          <a
                            href={`https://sepolia-optimistic.etherscan.io/tx/${cert.blockchain_transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-800 hover:text-brand-900 underline flex items-center gap-1"
                          >
                            {cert.blockchain_transaction_hash.slice(0, 10)}...
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-full bg-emerald-100 text-emerald-800">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          On-Chain
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
