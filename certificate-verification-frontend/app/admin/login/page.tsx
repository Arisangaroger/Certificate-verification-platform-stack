'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/endpoints';
import validators from '@/lib/validators';
import toast from 'react-hot-toast';
import { PasswordInput } from '@/components/PasswordInput';
import { AuthShell } from '@/components/AuthShell';

const ADMIN_HIGHLIGHTS = [
  { title: 'Batch-issue at scale', desc: 'Upload a spreadsheet and mint hundreds of certificates at once.' },
  { title: 'Immutable on-chain records', desc: 'Every credential is hashed and anchored — impossible to forge.' },
  { title: 'Instant public verification', desc: 'Anyone can confirm authenticity in seconds, no calls required.' },
];

function AdminPanel() {
  return (
    <div className="max-w-sm">
      <h2 className="text-2xl font-semibold leading-snug text-white">
        Issue credentials your institution can stand behind.
      </h2>
      <ul className="mt-8 space-y-5">
        {ADMIN_HIGHLIGHTS.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15 ring-1 ring-gold-400/30">
              <svg className="h-3.5 w-3.5 text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-sm leading-relaxed text-white/55">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Optimism network · Operational
      </div>
    </div>
  );
}

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    // Validate email
    const emailValidation = validators.email(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    if (!password) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.adminLogin(email, password);
      
      // Store authentication data
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      toast.success('Login successful');
      router.push('/admin/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      variant="admin"
      
      title="Welcome back"
      subtitle="Sign in to issue, manage, and verify your institution's certificates."
      panel={<AdminPanel />}
      altPrompt={{ text: 'Looking for your own credentials?', href: '/portal/login', label: 'Student login' }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            className={`input-field ${emailError ? 'input-error' : ''}`}
            placeholder="admin@university.edu"
            disabled={loading}
            required
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {emailError}
            </p>
          )}
        </div>

        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          autoComplete="current-password"
        />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in to dashboard'}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500">
          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Protected by encrypted, role-based access
        </p>
      </form>
    </AuthShell>
  );
}
