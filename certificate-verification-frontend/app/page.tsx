'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed z-50 w-full border-b border-white/10 bg-brand-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
                <svg className="h-5 w-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">CertiChain</span>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm text-brand-100 transition-colors hover:text-white">Features</a>
              <a href="#how-it-works" className="text-sm text-brand-100 transition-colors hover:text-white">How It Works</a>
              <a href="#portals" className="text-sm text-brand-100 transition-colors hover:text-white">Portals</a>
              <Link href="/verify" className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-gold-400">
                Verify Certificate
              </Link>
            </div>

            <button
              className="text-white md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-brand-900 md:hidden">
            <div className="space-y-3 px-4 py-4">
              <a href="#features" className="block text-brand-100 hover:text-white">Features</a>
              <a href="#how-it-works" className="block text-brand-100 hover:text-white">How It Works</a>
              <a href="#portals" className="block text-brand-100 hover:text-white">Portals</a>
              <Link href="/verify" className="block rounded-lg bg-gold-500 px-4 py-2 text-center font-semibold text-brand-900">
                Verify Certificate
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        {/* decorative backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="hero-grid absolute inset-0" />
          <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="absolute top-40 -left-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-40">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-400" />
                </span>
                <span>Live on the Optimism blockchain</span>
              </div>

              <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Academic credentials,
                <span className="block text-gold-400">verified forever.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100">
                CertiChain issues tamper-proof degrees to the blockchain and lets anyone confirm
                their authenticity in seconds — no phone calls, no paperwork, no forgeries.
              </p>

              <div className="mt-9 mb-[23px] flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-7 py-3.5 font-semibold text-brand-900 shadow-lg shadow-gold-500/20 transition-all hover:bg-gold-400 hover:shadow-xl"
                >
                  Verify a Certificate
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  University Portal
                </Link>
              </div>

              
            </div>

            {/* Live credential visual */}
            <HeroCredential />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Why CertiChain</p>
            <h2 className="mt-2 font-serif text-4xl font-bold text-slate-900">
              Trust that doesn&apos;t depend on trust.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Three guarantees underpin every credential we issue — each enforced by cryptography, not by a database an administrator can quietly edit.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                eyebrow: 'Integrity',
                tone: 'navy',
                title: 'Impossible to forge',
                body: 'Each degree is hashed and written to the Optimism blockchain. Altering a single character breaks the hash — so tampering is mathematically detectable, not just discouraged.',
                icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
              },
              {
                eyebrow: 'Speed',
                tone: 'gold',
                title: 'Verified in seconds',
                body: 'Employers paste a certificate ID and get an instant, on-chain answer. No emails to a registrar, no waiting days for a reply that may never come.',
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              },
              {
                eyebrow: 'Ownership',
                tone: 'navy',
                title: 'Owned by the student',
                body: 'Graduates hold a permanent, shareable credential and a downloadable PDF with a QR code — independent of whether the institution is still reachable.',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-gold-400/60 hover:shadow-lg"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">{f.eyebrow}</p>

                <div className="mt-3 flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      f.tone === 'gold' ? 'bg-gold-500 text-brand-900' : 'bg-brand-900 text-white'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl font-bold leading-snug text-slate-900">{f.title}</h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">The process</p>
            <h2 className="mt-2 font-serif text-4xl font-bold text-slate-900">From upload to verified in four steps</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              One pipeline, fully auditable end to end
            </p>
          </div>

          <div className="relative grid gap-10 md:grid-cols-4">
            {/* connecting line */}
            <div
              aria-hidden
              className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200 md:block"
            />
            {[
              { title: 'University uploads', body: 'Institutions batch upload graduate data via Excel/CSV, or add individual records.' },
              { title: 'Blockchain issuance', body: 'Each record is hashed and committed to the Optimism blockchain with cryptographic proof.' },
              { title: 'Student access', body: 'Graduates log in to view, download PDFs, and share their verified credentials.' },
              { title: 'Public verification', body: 'Anyone confirms authenticity instantly using the certificate ID — no account needed.' },
            ].map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-900 text-2xl font-bold text-white ring-8 ring-slate-50">
                  {i + 1}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-800 to-brand-900 p-8 text-white">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div>
                <h3 className="font-serif text-2xl font-bold">See it for yourself</h3>
                <p className="mt-1 text-brand-100">Paste any certificate ID and watch the blockchain confirm it in real time.</p>
              </div>
              <Link href="/verify" className="shrink-0 rounded-lg bg-gold-500 px-8 py-4 font-semibold text-brand-900 shadow-lg transition-colors hover:bg-gold-400">
                Verify a Certificate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-600">Get started</p>
            <h2 className="mt-2 font-serif text-4xl font-bold text-slate-900">Access your portal</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Three doors, one source of truth
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
            <Link
              href="/admin/login"
              className="group flex flex-col rounded-xl border border-white/10 bg-brand-900 p-5 text-white transition-colors hover:border-gold-400/40 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Institution</p>
              <h3 className="mt-1 font-serif text-xl font-bold">University Admin</h3>
              <p className="mt-2 text-sm text-brand-100/80">Batch upload, issue to chain, track history</p>
              <div className="mt-4 flex-1 rounded-lg border border-white/10 bg-brand-950/60 p-3">
                <ul className="space-y-2.5 text-sm text-brand-100/85">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-gold-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </span>
                    Batch certificate upload
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-gold-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    Issue credentials on-chain
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-gold-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Issuance history &amp; audit log
                  </li>
                </ul>
              </div>
              <span className="mt-4 text-sm font-medium text-gold-300 underline-offset-4 group-hover:underline">
                Sign in to admin portal
              </span>
            </Link>

            <Link
              href="/portal/login"
              className="group flex flex-col rounded-xl border border-white/10 bg-brand-900 p-5 text-white transition-colors hover:border-gold-400/40 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Graduate</p>
              <h3 className="mt-1 font-serif text-xl font-bold">Student Portal</h3>
              <p className="mt-2 text-sm text-brand-100/80">View credentials, download PDF, share verify link</p>
              <div className="mt-4 flex-1 rounded-lg border border-white/10 bg-brand-950/60 p-3">
                <ul className="space-y-2.5 text-sm text-brand-100/85">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-gold-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Personal credential dashboard
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-gold-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Download official PDF
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-gold-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </span>
                    Share verification link
                  </li>
                </ul>
              </div>
              <span className="mt-4 text-sm font-medium text-gold-300 underline-offset-4 group-hover:underline">
                Sign in to student portal
              </span>
            </Link>

            <Link
              href="/verify"
              className="group flex flex-col rounded-xl border border-white/10 bg-brand-900 p-5 text-white transition-colors hover:border-gold-400/40 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Public</p>
              <h3 className="mt-1 font-serif text-xl font-bold">Verify a Certificate</h3>
              <p className="mt-2 text-sm text-brand-100/80">No account — paste an ID, get an on-chain verdict</p>
              <div className="mt-4 flex-1 rounded-lg border border-white/10 bg-brand-950/60 p-3">
                <ul className="space-y-2.5 text-sm text-brand-100/85">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-emerald-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    No login required
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-emerald-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </span>
                    Enter a certificate ID
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-emerald-300">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    Instant on-chain verdict
                  </li>
                </ul>
              </div>
              <span className="mt-4 text-sm font-medium text-gold-300 underline-offset-4 group-hover:underline">
                Open verification page
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
                  <svg className="h-5 w-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-serif text-xl font-bold">CertiChain</span>
              </div>
              <p className="text-slate-400 text-sm">
                Blockchain-powered academic credential verification platform
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/admin/login" className="hover:text-white">University Portal</Link></li>
                <li><Link href="/portal/login" className="hover:text-white">Student Portal</Link></li>
                <li><Link href="/verify" className="hover:text-white">Verify Certificate</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Technology</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="https://www.optimism.io" target="_blank" rel="noopener noreferrer" className="hover:text-white">Optimism Network</a></li>
                <li><a href="https://ethereum.org" target="_blank" rel="noopener noreferrer" className="hover:text-white">Ethereum</a></li>
                <li className="hover:text-white cursor-pointer">Smart Contracts</li>
                <li className="hover:text-white cursor-pointer">Cryptographic Hashing</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="hover:text-white cursor-pointer">Documentation</li>
                <li className="hover:text-white cursor-pointer">Contact Us</li>
                <li className="hover:text-white cursor-pointer">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer">Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>© 2026 CertiChain. All rights reserved.</p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <span>Secured by</span>
              <span className="font-semibold text-white">Optimism Blockchain</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Faux QR pattern (deterministic so server/client render identically)
const QR_PATTERN = [
  1, 1, 1, 0, 1, 0, 1,
  1, 0, 1, 0, 0, 1, 1,
  1, 1, 0, 1, 1, 0, 1,
  0, 0, 1, 0, 1, 1, 0,
  1, 1, 0, 1, 0, 1, 1,
  0, 1, 1, 0, 1, 0, 1,
  1, 0, 1, 1, 0, 1, 1,
];

function HeroCredential() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0">
      {/* glow */}
      <div aria-hidden className="absolute -inset-8 rounded-[2.5rem] bg-gold-500/10 blur-3xl" />

      <div className="hero-float relative">
        {/* Certificate paper */}
        <div className="certificate-paper relative overflow-hidden rounded-2xl border border-gold-200/70 p-6 shadow-2xl ring-1 ring-black/5">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />

          {/* Scanning beam */}
          <div
            aria-hidden
            className="hero-scan-line pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-emerald-400/0 via-emerald-400/30 to-emerald-400/0"
          />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-900">
                <svg className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.42a12 12 0 01.84 4.42 12 12 0 01-7 10 12 12 0 01-7-10c0-1.55.3-3.03.84-4.42L12 14z" />
                </svg>
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-900">Aurora University</p>
                <p className="text-xs text-slate-500">Office of the Registrar</p>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-400 text-gold-500">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.8 4.7 17.2l1-5.8L1.5 7.2l5.9-.9L10 1z" />
              </svg>
            </div>
          </div>

          {/* Body */}
          <div className="mt-6 text-center">
            <p className="text-[12px] uppercase tracking-[0.18em] text-slate-400">This certifies that</p>
            <p className="mt-1 font-serif text-2xl font-bold text-brand-900">Alex Mwangi</p>
            <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-slate-400">has been awarded the degree of</p>
            <p className="mt-1 font-serif text-lg font-semibold text-brand-800">B.Sc. Computer Science</p>
            <div className="mx-auto mt-3 h-px w-24 bg-gold-300" />
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>Class of 2026</span>
              <span className="text-gold-400">•</span>
              <span>First Class Honours</span>
            </div>
          </div>

          {/* Footer: proof + QR */}
          <div className="mt-6 flex items-center justify-between rounded-lg bg-brand-900/[0.04] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400">On-chain proof</p>
              <p className="truncate font-mono text-[12px] font-medium text-brand-800">0x7f3a…e21b</p>
            </div>
            <div className="grid grid-cols-7 gap-[2px]">
              {QR_PATTERN.map((cell, idx) => (
                <span
                  key={idx}
                  className={`h-[3px] w-[3px] ${cell ? 'bg-brand-900' : 'bg-transparent'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Verified badge */}
        <div className="verified-pop absolute -bottom-4 -right-3">
          <div className="pulse-ring flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xl">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Verified on-chain
          </div>
        </div>

        {/* Floating mini-chip */}
        <div className="absolute -left-4 top-10 hidden rounded-xl border border-white/15 bg-brand-800/90 px-3 py-2 shadow-lg backdrop-blur-sm sm:block">
          <p className="text-xs uppercase tracking-wider text-brand-100">Verified in</p>
          <p className="font-mono text-sm font-bold text-gold-400">0.8s</p>
        </div>
      </div>
    </div>
  );
}
