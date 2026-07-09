import { ReactNode } from 'react';

export interface CertificateDocumentProps {
  universityName?: string;
  studentName?: string;
  degreeTitle: string;
  classAward: string;
  graduationYear: number | string;
  issuedDate?: string;
  certificateId: string;
  txHash?: string;
  verified?: boolean;
  qrDataUrl?: string;
}

type Tier = 'gold' | 'silver' | 'bronze' | 'neutral';

export function awardTier(award: string): Tier {
  const a = (award || '').toLowerCase();
  if (a.includes('first') || a.includes('distinction') || a.includes('summa') || a.includes('1:1')) return 'gold';
  if (a.includes('upper') || a.includes('2:1') || a.includes('magna') || a.includes('merit')) return 'silver';
  if (a.includes('second') || a.includes('2:2') || a.includes('cum laude') || a.includes('credit')) return 'silver';
  if (a.includes('third') || a.includes('pass') || a.includes('3:')) return 'bronze';
  return 'neutral';
}

const tierStyles: Record<Tier, { badge: string; dot: string; label: string }> = {
  gold: {
    badge: 'bg-gradient-to-r from-gold-100 to-gold-200 text-gold-700 ring-1 ring-gold-400/60',
    dot: 'text-gold-500',
    label: 'Honours',
  },
  silver: {
    badge: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 ring-1 ring-slate-300',
    dot: 'text-slate-400',
    label: 'Honours',
  },
  bronze: {
    badge: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 ring-1 ring-amber-300',
    dot: 'text-amber-600',
    label: 'Award',
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    dot: 'text-slate-400',
    label: 'Award',
  },
};

export function ClassAwardBadge({ award, className = '' }: { award: string; className?: string }) {
  const ts = tierStyles[awardTier(award)];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${ts.badge} ${className}`}>
      <svg className={`h-3.5 w-3.5 ${ts.dot}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.8 4.7 17.2l1-5.8L1.5 7.2l5.9-.9L10 1z" />
      </svg>
      {award}
    </span>
  );
}

function CornerFlourish({ className }: { className: string }) {
  return (
    <svg className={`absolute h-12 w-12 text-gold-400/70 ${className}`} viewBox="0 0 48 48" fill="none" stroke="currentColor">
      <path d="M2 2h20" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 2v20" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 6h10M6 6v10" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <circle cx="2" cy="2" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BlockchainSeal() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full text-gold-400" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="31" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
      </svg>
      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-brand-900 shadow-inner">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function CertificateDocument({
  universityName,
  studentName,
  degreeTitle,
  classAward,
  graduationYear,
  issuedDate,
  certificateId,
  txHash,
  verified = false,
  qrDataUrl,
}: CertificateDocumentProps) {
  const tier = awardTier(classAward);
  const ts = tierStyles[tier];
  const issued = issuedDate
    ? new Date(issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="certificate-paper relative overflow-hidden rounded-lg shadow-xl shadow-brand-900/10 ring-1 ring-brand-900/10">
      {/* gold top bar */}
      <div className="h-2 w-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />

      {/* inner double-rule frame */}
      <div className="relative m-3 rounded border border-brand-900/15 sm:m-4">
        <div className="pointer-events-none absolute inset-1 rounded-sm border border-gold-300/50" />

        <CornerFlourish className="left-2 top-2" />
        <CornerFlourish className="right-2 top-2 -scale-x-100" />
        <CornerFlourish className="bottom-2 left-2 -scale-y-100" />
        <CornerFlourish className="bottom-2 right-2 -scale-100" />

        <div className="px-6 py-9 text-center sm:px-10 sm:py-11">
          {/* University */}
          <p className="font-serif text-base font-semibold uppercase tracking-[0.22em] text-brand-800 sm:text-lg">
            {universityName || 'Issuing Institution'}
          </p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-600">
            Certificate of Degree
          </p>

          {/* certify line */}
          <p className="mt-8 text-sm italic text-slate-500">This is to certify that</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
            {studentName || 'Credential Holder'}
          </h2>

          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-500">
            has satisfied all requirements and is hereby awarded the degree of
          </p>
          <h3 className="mt-3 font-serif text-xl font-semibold text-brand-800 sm:text-2xl">{degreeTitle}</h3>

          {/* award badge */}
          <div className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${ts.badge}`}>
            <span className={`inline-flex ${ts.dot}`}>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 1l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.8 4.7 17.2l1-5.8L1.5 7.2l5.9-.9L10 1z" />
              </svg>
            </span>
            <span>{classAward}</span>
          </div>

          {/* divider with seal */}
          <div className="mt-9 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-300 sm:w-24" />
            <BlockchainSeal />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-300 sm:w-24" />
          </div>

          {/* meta */}
          <div className="mt-7 flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
            <MetaItem label="Conferred" value={graduationYear} />
            {issued && <MetaItem label="Issued" value={issued} />}
            <MetaItem
              label="Status"
              value={
                verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                  </span>
                ) : (
                  <span className="text-amber-600">Issued</span>
                )
              }
            />
          </div>
        </div>

        {/* verification footer */}
        <div className="flex flex-col items-center gap-4 border-t border-dashed border-brand-900/15 bg-brand-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Credential ID</p>
            <p className="truncate font-mono text-sm text-slate-700">{certificateId}</p>
            {txHash && (
              <>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">On-chain transaction</p>
                <p className="max-w-[16rem] truncate font-mono text-sm text-slate-700 sm:max-w-[20rem]">{txHash}</p>
              </>
            )}
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center">
              <img src={qrDataUrl} alt="Verification QR code" className="h-20 w-20 rounded-md border border-slate-200 bg-white p-1" />
              <p className="mt-1 text-xs text-slate-400">Scan to verify</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
