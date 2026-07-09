'use client';

import { useEffect, useState } from 'react';
import { verificationApi } from '@/lib/api/endpoints';
import { use } from 'react';
import Link from 'next/link';
import { CertificateDocument } from '@/components/CertificateDocument';
import { VerifyHeader } from '@/components/VerifyHeader';

interface VerificationResult {
  isValid: boolean;
  certificate?: {
    certificate_id: string;
    student_name: string;
    student_id_number: string;
    degree_title: string;
    graduation_year: number;
    class_award: string;
    university_name: string;
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
  message?: string;
}

export default function VerifyCertificate({ params }: { params: Promise<{ certificate_id: string }> }) {
  const { certificate_id } = use(params);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyCredential = async () => {
      try {
        const response = await verificationApi.verify(certificate_id);
        setResult(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Verification failed');
        setResult({ 
          isValid: false, 
          message: err.response?.data?.message || 'Certificate not found or invalid' 
        });
      } finally {
        setLoading(false);
      }
    };

    if (certificate_id) {
      verifyCredential();
    }
  }, [certificate_id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <VerifyHeader />
        <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="card-prominent text-center max-w-md">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-800 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying Credential</h2>
          <p className="text-sm text-slate-600 mb-4">
            Running three-way verification check...
          </p>
          <div className="space-y-2 text-sm text-left">
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-4 rounded-full"></div>
              <span className="text-slate-600">Checking database records</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-4 rounded-full"></div>
              <span className="text-slate-600">Computing hash verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-4 rounded-full"></div>
              <span className="text-slate-600">Validating blockchain record</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <VerifyHeader />
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="card-prominent text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verification Error</h2>
            <p className="text-sm text-slate-600">{error || 'An unexpected error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  const cert = result.certificate;
  const explorerUrl = result.blockchain?.transaction_hash
    ? `https://sepolia-optimistic.etherscan.io/tx/${result.blockchain.transaction_hash}`
    : null;

  return (
    <div className="min-h-screen bg-slate-100">
      <VerifyHeader />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {result.isValid && cert ? (
          <div className="space-y-6">
            {/* The verification moment — official certificate of authenticity */}
            <section className="card-prominent relative overflow-hidden text-center">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />

              <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white ring-8 ring-emerald-100 pulse-ring">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.35em] text-emerald-700">Verified</p>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-slate-400">Certificate of Authenticity</p>

              <h1 className="mt-6 font-serif text-4xl font-bold text-brand-900">{cert.student_name}</h1>
              <p className="mt-2 font-serif text-lg text-brand-800">{cert.degree_title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {cert.university_name} · Class of {cert.graduation_year}
                {cert.class_award ? ` · ${cert.class_award}` : ''}
              </p>

              <div className="mx-auto my-6 h-px w-28 bg-gold-300" />

              <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                <OptimismMark />
                <span className="text-sm font-medium text-slate-600">Recorded on the Optimism blockchain</span>
              </div>
            </section>

            {/* Formal certificate document */}
            <CertificateDocument
              universityName={cert.university_name}
              studentName={cert.student_name}
              degreeTitle={cert.degree_title}
              classAward={cert.class_award}
              graduationYear={cert.graduation_year}
              issuedDate={result.blockchain?.timestamp}
              certificateId={cert.certificate_id}
              txHash={result.blockchain?.transaction_hash}
              verified={result.isValid}
            />

            {/* Verification report */}
            {result.verification && (
              <section className="card-prominent">
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Verification report</h2>
                    <p className="text-sm text-slate-500">Independent checks run at request time</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    All checks passed
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  <ReportRow
                    ok={result.verification.database_hash_match}
                    title="Database integrity"
                    desc="The stored record matches its original issued hash."
                  />
                  <ReportRow
                    ok={result.verification.blockchain_verified}
                    title="On-chain proof"
                    desc="The credential hash is present on the Optimism ledger."
                  />
                  <ReportRow
                    ok={result.verification.database_hash_match && result.verification.blockchain_verified}
                    title="Tamper check"
                    desc="No modifications detected since the moment of issuance."
                  />
                </div>

                {result.blockchain?.transaction_hash && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Transaction hash</p>
                      {explorerUrl && (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-800 hover:text-brand-900"
                        >
                          View on explorer
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <p className="mt-1 break-all font-mono text-sm text-slate-700">{result.blockchain.transaction_hash}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          /* Failed state — prominent and unambiguous */
          <section className="card-prominent relative overflow-hidden text-center">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-500" />

            <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white ring-8 ring-red-100">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.35em] text-red-700">Not Verified</p>
            <h1 className="mt-4 text-3xl font-bold text-brand-900">Verification failed</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
              {result.message || 'This certificate could not be verified. It may be invalid, expired, or tampered with.'}
            </p>

            <div className="mx-auto mt-6 inline-flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certificate ID</span>
              <span className="font-mono text-sm text-slate-700">{certificate_id}</span>
            </div>

            <div className="mt-7">
              <Link href="/verify" className="btn-primary inline-block">
                Try another certificate
              </Link>
            </div>
          </section>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-brand-800 hover:text-brand-900">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Optimism network trust mark (brand red roundel)
function OptimismMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF0420]" aria-hidden>
      <span className="block h-1.5 w-1.5 rounded-full bg-white" />
    </span>
  );
}

function ReportRow({ ok, title, desc }: { ok: boolean; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div
        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
        }`}
      >
        {ok ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <span className={`text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {ok ? 'Passed' : 'Failed'}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
