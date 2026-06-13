'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { MotorOpsPasswordModal } from '@/components/dashboard/MotorOpsPasswordModal';

interface MotorOpsShellProps {
  children: ReactNode;
  canAccessDashboard?: boolean;
}

/** Operasyon sayfası — hakediş/dashboard menüsü yok */
export function MotorOpsShell({ children, canAccessDashboard = false }: MotorOpsShellProps) {
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="motor-ops-layout">
      <header className="motor-ops-topbar">
        <div className="motor-ops-topbar-inner">
          <div className="motor-ops-brand">
            <h1>Motor Yönetim</h1>
            <span>Operasyon · Plaka &amp; Kurye</span>
          </div>
          <div className="motor-ops-actions">
            {canAccessDashboard && (
              <Link href="/dashboard/motors" className="btn btn-outline-primary btn-sm">
                Motorlar Sayfası
              </Link>
            )}
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPasswordOpen(true)}>
              Şifre Değiştir
            </button>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btn-secondary btn-sm">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="motor-ops-main">{children}</main>
      <MotorOpsPasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
