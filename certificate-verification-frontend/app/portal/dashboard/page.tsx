'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { certificatesApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import QRCode from 'qrcode';
import { CertificateDocument, ClassAwardBadge } from '@/components/CertificateDocument';

interface Certificate {
  id: string;
  degree_title: string;
  graduation_year: number;
  class_award: string;
  created_at: string;
  verification_status: string;
  blockchain_transaction_hash?: string;
  university?: { name: string };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [studentData, setStudentData] = useState<any>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const student = localStorage.getItem('student_data');
    
    if (!token || !student) {
      router.push('/portal/login');
      return;
    }
    
    setStudentData(JSON.parse(student));
  }, [router]);

  const { data: certificates, error } = useSWR(
    studentData ? `/certificates/student/${studentData.id}` : null,
    () => certificatesApi.getByStudent(studentData.id).then(res => res.data),
    {
      revalidateOnFocus: false,
      staleTime: 600000, // 10 minutes
    }
  );

  useEffect(() => {
    if (selectedCert) {
      const verificationUrl = `${window.location.origin}/verify/${selectedCert.id}`;
      QRCode.toDataURL(verificationUrl, { width: 200, margin: 2 })
        .then(setQrCodeUrl)
        .catch(() => toast.error('Failed to generate QR code'));
    }
  }, [selectedCert]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('student_data');
    router.push('/');
  };

  const handleDownloadPDF = async (certId: string) => {
    const toastId = toast.loading('Generating PDF certificate...');
    try {
      const response = await certificatesApi.downloadPdf(certId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${studentData.student_id_number}-${certId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download certificate. Please try again.', { id: toastId });
    }
  };

  const handleCopyLink = (certId: string) => {
    const verificationUrl = `${window.location.origin}/verify/${certId}`;
    navigator.clipboard.writeText(verificationUrl);
    toast.success('Verification link copied to clipboard');
  };

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton-shimmer h-8 w-32"></div>
      </div>
    );
  }

  const firstName = studentData.full_name?.split(' ')[0] || 'there';
  const initials =
    studentData.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'S';
  const credentialCount = certificates?.length ?? 0;

  return (
    <div className="min-h-screen bg-canvas-student">
      {/* Top Navigation */}
      <nav className="border-b border-gold-200/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-sm font-semibold text-white ring-2 ring-gold-300 ring-offset-2 ring-offset-white">
              {initials}
            </div>
            <div>
              <p className="font-serif text-lg font-bold leading-tight text-brand-900">{studentData.full_name}</p>
              <p className="text-sm text-slate-500">{studentData.student_id_number}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary text-sm">
            Log Out
          </button>
        </div>
      </nav>

      {/* Celebratory header */}
      <header className="border-b border-gold-200/50 bg-gradient-to-b from-gold-50/70 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Your achievements</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-brand-900">Congratulations, {firstName}</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            {credentialCount > 0
              ? 'Every credential below is permanently verified on the blockchain — yours to share with confidence.'
              : 'Your verified credentials will appear here the moment your institution issues them.'}
          </p>
          {credentialCount > 0 && (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-white/70 px-3 py-1 text-sm font-medium text-brand-800">
              <svg className="h-4 w-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.8 4.7 17.2l1-5.8L1.5 7.2l5.9-.9L10 1z" />
              </svg>
              {credentialCount} verified credential{credentialCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        {error && (
          <div className="status-banner status-banner-error mb-6" role="alert">
            Failed to load certificates. Please try again later.
          </div>
        )}

        {!certificates && !error && (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="card">
                <div className="skeleton-shimmer h-6 w-3/4 mb-4"></div>
                <div className="skeleton-shimmer h-4 w-1/2 mb-2"></div>
                <div className="skeleton-shimmer h-4 w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {certificates && certificates.length === 0 && (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-slate-900 mb-2">No Certificates Found</p>
            <p className="text-sm text-slate-600">Your credentials will appear here once issued by your institution</p>
          </div>
        )}

        {certificates && certificates.length > 0 && (
          <div className="grid gap-7 sm:grid-cols-2">
            {certificates.map((cert: Certificate) => (
              <div
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl"
              >
                {/* decorative gold top border */}
                <div className="h-2 w-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />

                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                      {cert.university?.name || 'Academic Credential'}
                    </p>
                    {cert.verification_status === 'VERIFIED' && (
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-gold-300 ring-offset-1"
                        title="Verified on blockchain"
                      >
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* dominant degree title */}
                  <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-brand-900">
                    {cert.degree_title}
                  </h2>

                  <div className="mt-4">
                    <ClassAwardBadge award={cert.class_award} />
                  </div>

                  <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                    <span>
                      Class of <span className="font-semibold text-slate-700">{cert.graduation_year}</span>
                    </span>
                    <span className="h-3 w-px bg-slate-200" />
                    <span>Issued {new Date(cert.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-auto space-y-3 pt-5">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(cert.id);
                        }}
                        className="btn-secondary flex-1 py-2 text-sm"
                      >
                        Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(cert.id);
                        }}
                        className="btn-primary flex-1 py-2 text-sm"
                      >
                        Share
                      </button>
                    </div>
                    <p className="text-right text-sm font-medium text-gold-600 transition-colors group-hover:text-gold-700">
                      View credential →
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Side Drawer — full credential preview */}
      {selectedCert && (
        <div
          className="overlay-in fixed inset-0 z-50 flex justify-end bg-brand-900/50 backdrop-blur-sm"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="drawer-panel flex h-full w-full max-w-xl flex-col bg-canvas-student shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">Credential</p>
                <h2 className="font-serif text-lg font-bold text-brand-900">{selectedCert.degree_title}</h2>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <CertificateDocument
                universityName={selectedCert.university?.name || studentData?.university?.name}
                studentName={studentData?.full_name}
                degreeTitle={selectedCert.degree_title}
                classAward={selectedCert.class_award}
                graduationYear={selectedCert.graduation_year}
                issuedDate={selectedCert.created_at}
                certificateId={selectedCert.id}
                txHash={selectedCert.blockchain_transaction_hash}
                verified={selectedCert.verification_status === 'VERIFIED'}
                qrDataUrl={qrCodeUrl}
              />
            </div>

            {/* sticky actions */}
            <div className="flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button onClick={() => handleDownloadPDF(selectedCert.id)} className="btn-primary flex-1">
                Download PDF
              </button>
              <button onClick={() => handleCopyLink(selectedCert.id)} className="btn-secondary flex-1">
                Copy verify link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
