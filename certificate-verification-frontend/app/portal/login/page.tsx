'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/endpoints';
import validators from '@/lib/validators';
import toast from 'react-hot-toast';
import { AuthShell } from '@/components/AuthShell';

/** Decorative preview of a verified credential — shows the student what awaits inside. */
function StudentPanel() {
  return (
    <div className="max-w-sm">
      <h2 className="text-2xl font-semibold leading-snug text-white">
        Your achievements, provable anywhere.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/55">
        One secure login to view, download, and share your blockchain-verified diploma.
      </p>

      <div className="relative mt-9">
        {/* stacked card shadow for depth */}
        <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-white/5" />
        <div className="relative rotate-[-2deg] rounded-2xl bg-white p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Verified Credential
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">University of Excellence</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-gold-300 ring-offset-1">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>

          <p className="mt-4 text-lg font-bold tracking-tight text-slate-900">Alate K. Mugisha</p>
          <p className="text-sm text-slate-600">BSc, Computer Science</p>
          <span className="mt-2 inline-flex rounded-md bg-gold-50 px-2 py-0.5 text-[12px] font-semibold text-gold-700">
            First Class Honours · 2025
          </span>

          <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400">On-chain tx</p>
              <p className="truncate font-mono text-[12px] text-slate-600">0x7f3a…e21b</p>
            </div>
            {/* faux QR */}
            <div className="grid h-10 w-10 grid-cols-4 grid-rows-4 gap-px rounded bg-brand-900 p-1">
              {[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1].map((on, i) => (
                <span key={i} className={on ? 'rounded-[1px] bg-white' : ''} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentLogin() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [loading, setLoading] = useState(false);
  
  // Credentials step
  const [studentId, setStudentId] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [studentIdError, setStudentIdError] = useState('');
  const [nationalIdError, setNationalIdError] = useState('');
  
  // OTP step
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentIdError('');
    setNationalIdError('');
    
    // Validate student ID
    const studentIdValidation = validators.studentId(studentId);
    if (!studentIdValidation.valid) {
      setStudentIdError(studentIdValidation.error || '');
      return;
    }
    
    // Validate national ID
    const nationalIdValidation = validators.nationalId(nationalId);
    if (!nationalIdValidation.valid) {
      setNationalIdError(nationalIdValidation.error || '');
      return;
    }

    setLoading(true);
    try {
      await authApi.requestStudentOtp(studentId, nationalId);
      setStep('otp');
      toast.success('OTP sent to your registered phone number');
    } catch (error: any) {
      const message = error.response?.data?.message || 'No matching record found for the provided information.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    
    // Validate OTP
    const otpValidation = validators.otp(otp);
    if (!otpValidation.valid) {
      setOtpError(otpValidation.error || '');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyStudentOtp(studentId, nationalId, otp);
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('student_data', JSON.stringify(response.data.student));
      toast.success('Login successful');
      router.push('/portal/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid verification code';
      setOtpError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isOtp = step === 'otp';

  return (
    <AuthShell
      variant="student"
     
      title={isOtp ? 'Enter your access code' : 'Access your credentials'}
      subtitle={
        isOtp
          ? 'We sent a 6-digit code to your registered contact. Enter it below to continue.'
          : 'Verify your identity with your registration and national ID to receive a one-time code.'
      }
      panel={<StudentPanel />}
      altPrompt={{ text: 'Are you a university admin?', href: '/admin/login', label: 'Admin login' }}
    >
      {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label htmlFor="student-id" className="block text-sm font-medium text-slate-700 mb-1">
                  Registration Number
                </label>
                <input
                  id="student-id"
                  type="text"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setStudentIdError('');
                  }}
                  className={`input-field ${studentIdError ? 'input-error' : ''}`}
                  placeholder="Enter your registration number"
                  disabled={loading}
                  required
                  aria-invalid={!!studentIdError}
                  aria-describedby={studentIdError ? 'student-id-error' : undefined}
                />
                {studentIdError && (
                  <p id="student-id-error" className="mt-1 text-sm text-red-600" role="alert">
                    {studentIdError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="national-id" className="block text-sm font-medium text-slate-700 mb-1">
                  National ID Number (16 digits)
                </label>
                <input
                  id="national-id"
                  type="text"
                  value={nationalId}
                  onChange={(e) => {
                    // Allow only digits, max 16
                    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setNationalId(value);
                    setNationalIdError('');
                  }}
                  className={`input-field ${nationalIdError ? 'input-error' : ''}`}
                  placeholder="1234567890123456"
                  maxLength={16}
                  disabled={loading}
                  required
                  aria-invalid={!!nationalIdError}
                  aria-describedby={nationalIdError ? 'national-id-error' : undefined}
                />
                {nationalIdError && (
                  <p id="national-id-error" className="mt-1 text-sm text-red-600" role="alert">
                    {nationalIdError}
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-500">
                  Enter exactly 16 digits
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Verifying...' : 'Request Access Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-emerald-800">
                  A 6-digit verification code has been sent to your registered email address
                </p>
              </div>

              <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-slate-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="otp-code"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setOtpError('');
                  }}
                  className={`input-field text-center text-2xl tracking-widest ${otpError ? 'input-error' : ''}`}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  required
                  aria-invalid={!!otpError}
                  aria-describedby={otpError ? 'otp-error' : undefined}
                />
                {otpError && (
                  <p id="otp-error" className="mt-1 text-sm text-red-600" role="alert">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setOtp('');
                    setOtpError('');
                  }}
                  disabled={loading}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Verifying...' : 'Verify & Access'}
                </button>
              </div>
            </form>
      )}
    </AuthShell>
  );
}
