'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

function NavIcon({ children }: { children: ReactNode }) {
  return <span aria-hidden>{children}</span>;
}

interface DashboardShellProps {
  children: ReactNode;
  hesapTarihi?: string;
  onHesapTarihiChange?: (value: string) => void;
}

export function DashboardShell({ children, hesapTarihi, onHesapTarihiChange }: DashboardShellProps) {
  const pathname = usePathname();
  const isMotors = pathname.startsWith('/dashboard/motors');
  const isDashboard = pathname === '/dashboard';

  return (
    <div className="dashboard-layout">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-inner">
            <div className="dashboard-brand">
              <h1>MaxiHesaplama</h1>
              <span>Yeni Sistem — Dashboard</span>
            </div>

            <nav className="dashboard-nav-tabs" aria-label="Ana menü">
              <Link
                href="/dashboard"
                className={`dashboard-nav-tab ${isDashboard ? 'active' : ''}`}
              >
                Hakediş
              </Link>
              <Link
                href="/dashboard/motors"
                className={`dashboard-nav-tab ${isMotors ? 'active' : ''}`}
              >
                Motorlar
              </Link>
              <Link href="/reports" className="dashboard-nav-tab">
                Kayıtlar
              </Link>
            </nav>

            <div className="dashboard-top-actions">
              {hesapTarihi !== undefined && onHesapTarihiChange && (
                <div className="date-control">
                  <label htmlFor="dashHesapTarihi">Hesap Tarihi:</label>
                  <input
                    type="date"
                    id="dashHesapTarihi"
                    value={hesapTarihi}
                    onChange={(e) => onHesapTarihiChange(e.target.value)}
                  />
                </div>
              )}
              <Link href="/" className="btn btn-outline-primary btn-sm">
                Klasik Görünüm
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn btn-secondary btn-sm">
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </header>

        {children}
      </div>

      <nav className="dashboard-bottom-nav" aria-label="Mobil menü">
        <Link href="/dashboard" className={isDashboard ? 'active' : ''}>
          <NavIcon>📊</NavIcon>
          Hakediş
        </Link>
        <Link href="/dashboard/motors" className={isMotors ? 'active' : ''}>
          <NavIcon>🏍</NavIcon>
          Motorlar
        </Link>
        <Link href="/">
          <NavIcon>↩</NavIcon>
          Klasik
        </Link>
      </nav>
    </div>
  );
}
