'use client';

import { calculateRow } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import type { Business, TableEntry } from '@/lib/types';
import { createDefaultTableEntry } from '@/lib/types';

interface DashboardTableProps {
  businesses: Business[];
  tableData: Record<string, TableEntry>;
  onEdit: (business: Business) => void;
}

export function DashboardTable({ businesses, tableData, onEdit }: DashboardTableProps) {
  if (businesses.length === 0) {
    return <p className="empty-message">Bu filtrede işletme bulunmamaktadır.</p>;
  }

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>S/N</th>
            <th className="col-sticky-business">İşletme</th>
            <th>0-5km</th>
            <th>5+km</th>
            <th>Toplam</th>
            <th>Hakediş</th>
            <th>KDV</th>
            <th>KDV Dahil</th>
            <th>Banka</th>
            <th>POS</th>
            <th>Nakit</th>
            <th>Net</th>
            <th>Ödeme</th>
            <th>Kota</th>
            <th>Not</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business, index) => {
            const entry = tableData[business.id] ?? createDefaultTableEntry(business.id);
            const result = calculateRow({
              normalPackages: entry.normalPackages,
              distantPackages: entry.distantPackages,
              bankCommission: entry.bankCommission,
              posBalance: entry.posBalance,
              cashBalance: entry.cashBalance,
              normalFee: business.normalFee,
              distantFee: business.distantFee,
              vat: business.vat,
            });
            const netNegative = result.netTotal < 0;

            return (
              <tr key={business.id}>
                <td>{index + 1}</td>
                <td className="col-business col-sticky-business" title={business.name}>
                  {business.name}
                </td>
                <td>{entry.normalPackages || '—'}</td>
                <td>{entry.distantPackages || '—'}</td>
                <td>{result.totalPackages || '—'}</td>
                <td>{formatCurrency(result.hakedis)}</td>
                <td>{formatCurrency(result.vatAmount)}</td>
                <td>{formatCurrency(result.totalWithVat)}</td>
                <td>{formatCurrency(entry.bankCommission)}</td>
                <td>{formatCurrency(entry.posBalance)}</td>
                <td>{formatCurrency(entry.cashBalance)}</td>
                <td className={netNegative ? 'col-net col-net-negative' : 'col-net'}>
                  {formatCurrency(result.netTotal)} ₺
                </td>
                <td>{entry.paymentStatus}</td>
                <td>{entry.hasQuota}</td>
                <td>
                  <span className="notes-preview" title={entry.notes}>
                    {entry.notes || '—'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onEdit(business)}
                  >
                    Giriş
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
