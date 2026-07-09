'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VerifyHeader } from '@/components/VerifyHeader';

export default function VerifyPage() {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateId.trim()) {
      return;
    }
    
    router.push(`/verify/${certificateId.trim()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <VerifyHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card-prominent">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-900">
                <svg className="h-7 w-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-brand-900">Verify a Credential</h1>
              <p className="mt-1 text-sm text-slate-600">Enter a certificate ID to confirm its authenticity on-chain</p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="certificate-id" className="block text-sm font-medium text-slate-700 mb-1">
                Certificate ID
              </label>
              <input
                id="certificate-id"
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                className="input-field"
                placeholder="Enter certificate ID or UUID"
                required
              />
              <p className="mt-1 text-sm text-slate-500">
                The certificate ID can be found on the certificate document or shared link
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
            >
              Verify Certificate
            </button>
          </form>

            <div className="mt-6 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                All verifications are checked live against blockchain records on Optimism.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
