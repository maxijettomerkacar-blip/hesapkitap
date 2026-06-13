'use client';

import type { DashboardTotals, RegionTotals } from '@/lib/aggregates';
import { formatCurrency } from '@/lib/formatters';

interface KpiBarProps {
  totals: DashboardTotals;
  regionTotals: RegionTotals[];
  hesapTarihi: string;
  activeRegion: string;
}

function KpiCard({
  label,
  value,
  variant = 'neutral',
}: {
  label: string;
  value: string;
  variant?: 'neutral' | 'positive' | 'negative';
}) {
  return (
    <div className={`kpi-card kpi-card--${variant}`}>
      <div className="kpi-card-label">{label}</div>
      <div className="kpi-card-value">{value}</div>
    </div>
  );
}

export function KpiBar({ totals, regionTotals, hesapTarihi, activeRegion }: KpiBarProps) {
  const dateLabel = hesapTarihi
    ? new Date(hesapTarihi).toLocaleDateString('tr-TR')
    : '—';

  return (
    <>
      <div className="kpi-context">
        <span>
          <strong>Hesap Tarihi:</strong> {dateLabel}
        </span>
        <span>
          <strong>Bölge:</strong> {activeRegion}
        </span>
        <span>
          <strong>Veri girilmiş:</strong> {totals.withDataCount} / {totals.businessCount} işletme
        </span>
        <span>
          Ödenmedi: {totals.paymentCounts.Odenmedi} · Ödendi: {totals.paymentCounts.Odendi} · Kısmi:{' '}
          {totals.paymentCounts['Kismi Odeme']} · Kota: {totals.quotaCount}
        </span>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Toplam Paket" value={String(totals.totalPackages)} />
        <KpiCard label="Hakediş (KDV hariç)" value={`${formatCurrency(totals.totalHakedis)} ₺`} />
        <KpiCard label="Toplam KDV" value={`${formatCurrency(totals.totalVat)} ₺`} />
        <KpiCard label="KDV Dahil" value={`${formatCurrency(totals.totalWithVat)} ₺`} variant="neutral" />
        <KpiCard label="Banka Kom." value={`${formatCurrency(totals.totalBankCommission)} ₺`} />
        <KpiCard label="POS Bakiye" value={`${formatCurrency(totals.totalPosBalance)} ₺`} />
        <KpiCard label="Nakit" value={`${formatCurrency(totals.totalCashBalance)} ₺`} />
        <KpiCard
          label="Tarafımıza Ödenecek"
          value={`${formatCurrency(totals.netReceivable)} ₺`}
          variant="positive"
        />
        <KpiCard
          label="Size Ödenecek"
          value={`${formatCurrency(totals.netPayable)} ₺`}
          variant="negative"
        />
      </div>

      {regionTotals.length > 1 && (
        <details className="kpi-region-panel">
          <summary>Bölge kırılımı</summary>
          <table className="kpi-region-table">
            <thead>
              <tr>
                <th>Bölge</th>
                <th>İşletme</th>
                <th>Paket</th>
                <th>Tarafımıza</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {regionTotals.map((r) => (
                <tr key={r.region}>
                  <td>{r.region}</td>
                  <td>{r.businessCount}</td>
                  <td>{r.totalPackages}</td>
                  <td>{formatCurrency(r.netReceivable)} ₺</td>
                  <td>{formatCurrency(r.netPayable)} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </>
  );
}
