'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles?: ('SUPER_ADMIN' | 'REGISTRAR')[];
};

const NAV: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/admin/universities',
    label: 'Universities',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    roles: ['SUPER_ADMIN'],
  },
  {
    href: '/admin/users',
    label: 'Admin Users',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['SUPER_ADMIN'],
  },
  {
    href: '/admin/upload',
    label: 'Upload Batch',
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  },
  {
    href: '/admin/blockchain',
    label: 'Blockchain',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    roles: ['REGISTRAR'],
  },
  {
    href: '/admin/history',
    label: 'Credential History',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; role?: 'SUPER_ADMIN' | 'REGISTRAR' } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_data');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const role = user?.role;
  const items = NAV.filter((item) => !item.roles || (role && item.roles.includes(role)));
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    router.push('/');
  };

  const portalLabel = role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Portal';
  const roleLabel = role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'REGISTRAR' ? 'Registrar' : 'Member';
  const initial = user?.email?.[0]?.toUpperCase() || 'A';

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col bg-brand-900 text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500">
            <svg className="h-5 w-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="font-serif text-lg font-bold tracking-tight">CertiChain</p>
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-gold-300">{portalLabel}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Menu</p>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    {/* gold left-accent for the active item (Linear-style) */}
                    {active && (
                      <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-gold-500" />
                    )}
                    <span
                      className={`transition-opacity ${
                        active ? 'text-gold-400' : 'opacity-60 group-hover:opacity-100'
                      }`}
                    >
                      <NavIcon d={item.icon} />
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-semibold ring-2 ring-gold-500/40">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.email || 'Administrator'}</p>
              <p className="text-[12px] font-medium uppercase tracking-wider text-gold-300/80">{roleLabel}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-800/40 bg-brand-900 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
            <svg className="h-5 w-5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="font-serif font-bold tracking-tight">CertiChain</span>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold-300">{portalLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                isActive(item.href) ? 'bg-white/10 text-gold-300' : 'text-white/60 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-white/60 hover:text-white">
            Log Out
          </button>
        </div>
      </header>
    </>
  );
}
