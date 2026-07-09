import { ReactNode } from 'react';
import Link from 'next/link';

type AuthVariant = 'admin' | 'student';

interface AuthShellProps {
  variant: AuthVariant;
  
  title: string;
  subtitle: string;
  /** Custom content rendered inside the branded left panel. */
  panel: ReactNode;
  /** Cross-link to the other portal, shown under the form. */
  altPrompt?: { text: string; href: string; label: string };
  children: ReactNode;
}

function BrandMark({ tag }: { tag: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 shadow-lg shadow-black/20">
        <svg className="h-6 w-6 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="font-serif text-lg font-bold tracking-tight text-white">CertiChain</p>
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-gold-300">{tag}</p>
      </div>
    </div>
  );
}

/** Low-opacity hand-built SVG texture: guilloché rings + chain links. */
function PanelDecor({ variant }: { variant: AuthVariant }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* soft glows */}
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

      {/* guilloché concentric rings — academic seal motif */}
      <svg
        className="absolute -right-16 top-1/3 h-[28rem] w-[28rem] text-white/[0.06]"
        viewBox="0 0 400 400"
        fill="none"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={i} cx="200" cy="200" r={40 + i * 18} stroke="currentColor" strokeWidth="1" />
        ))}
        <circle cx="200" cy="200" r="34" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
      </svg>

      {/* chain-link motif */}
      <svg
        className={`absolute bottom-10 left-8 h-40 w-40 ${
          variant === 'student' ? 'text-gold-300/15' : 'text-white/[0.07]'
        }`}
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="14" y="40" width="46" height="28" rx="14" transform="rotate(-30 37 54)" />
        <rect x="56" y="52" width="46" height="28" rx="14" transform="rotate(-30 79 66)" />
      </svg>

      {/* fine dot grid */}
      <svg className="absolute inset-0 h-full w-full text-white/[0.04]" aria-hidden>
        <defs>
          <pattern id={`dots-${variant}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${variant})`} />
      </svg>
    </div>
  );
}

export function AuthShell({ variant, title, subtitle, panel, altPrompt, children }: AuthShellProps) {
  const panelGradient =
    variant === 'student'
      ? 'bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700'
      : 'bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900';

  const panelTag = variant === 'student' ? 'Student Portal' : 'Institution Admin';

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Brand panel ---------- */}
      <aside className={`relative hidden flex-col justify-between overflow-hidden p-12 lg:flex ${panelGradient}`}>
        <PanelDecor variant={variant} />

        <div className="relative z-10">
          <BrandMark tag={panelTag} />
        </div>

        <div className="relative z-10 my-10">{panel}</div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-white/50">
          <svg className="h-4 w-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 1l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V4l7-3z"
              clipRule="evenodd"
            />
          </svg>
          <span>Secured on-chain · Tamper-proof academic credentials</span>
        </div>
      </aside>

      {/* ---------- Form column ---------- */}
      <main className="flex flex-col bg-slate-50">
        {/* top bar */}
        <div className="flex items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-2 lg:invisible">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800">
              <svg className="h-5 w-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span className="font-serif font-bold tracking-tight text-slate-900">CertiChain</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-brand-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>

        {/* centered form */}
        <div className="flex flex-1 items-center justify-center px-6 pb-14 sm:px-10">
          <div className="w-full max-w-md">
           
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

            <div className="mt-8">{children}</div>

            {altPrompt && (
              <p className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
                {altPrompt.text}{' '}
                <Link href={altPrompt.href} className="font-semibold text-brand-800 hover:text-brand-900">
                  {altPrompt.label}
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
