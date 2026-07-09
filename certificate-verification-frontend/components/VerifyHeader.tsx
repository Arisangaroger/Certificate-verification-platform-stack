import Link from 'next/link';

export function VerifyHeader() {
  return (
    <header className="border-b border-brand-800 bg-brand-900 text-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500">
          <svg className="h-5 w-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="font-semibold tracking-tight">Blockchain Verification</p>
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-300">
            CertiChain · Optimism Network
          </p>
        </div>
        <Link href="/" className="ml-auto text-sm font-medium text-white/60 transition-colors hover:text-white">
          Home
        </Link>
      </div>
    </header>
  );
}
