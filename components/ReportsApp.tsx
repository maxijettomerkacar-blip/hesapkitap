'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { buildReportTextFromSaved } from '@/lib/report-text';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { createClient } from '@/lib/supabase/client';
import { deleteSavedReport, fetchSavedReports } from '@/lib/supabase/queries';
import type { SavedReport } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

type SortColumn = keyof SavedReport | 'savedAt';
type SortDir = 'asc' | 'desc';

export function ReportsApp() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDir }>({
    column: 'savedAt',
    direction: 'desc',
  });
  const [detailReport, setDetailReport] = useState<SavedReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedReport | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSavedReports(getSupabase());
      setReports(data);
    } catch (e) {
      console.error(e);
      showToast('Raporlar yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const displayed = useMemo(() => {
    let list = [...reports];
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      list = list.filter((r) => r.businessName.toLowerCase().includes(q));
    }
    if (dateFilter) {
      list = list.filter((r) => r.hesapTarihi === dateFilter);
    }
    if (paymentFilter) {
      list = list.filter((r) => r.paymentStatus === paymentFilter);
    }
    list.sort((a, b) => {
      let valA: string | number = a[sort.column as keyof SavedReport] as string | number;
      let valB: string | number = b[sort.column as keyof SavedReport] as string | number;
      if (['totalPackages', 'totalWithVat', 'netTotal'].includes(sort.column)) {
        valA = Number(valA);
        valB = Number(valB);
      } else if (['savedAt', 'hesapTarihi'].includes(sort.column)) {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [reports, nameFilter, dateFilter, paymentFilter, sort]);

  const handleSort = (column: SortColumn) => {
    setSort((prev) => ({
      column,
      direction:
        prev.column === column
          ? prev.direction === 'asc'
            ? 'desc'
            : 'asc'
          : ['savedAt', 'hesapTarihi', 'totalPackages', 'totalWithVat', 'netTotal'].includes(column)
            ? 'desc'
            : 'asc',
    }));
  };

  const copyReport = async (report: SavedReport) => {
    try {
      await navigator.clipboard.writeText(buildReportTextFromSaved(report));
      showToast('Rapor panoya kopyalandı.', 'success');
    } catch {
      showToast('Panoya kopyalanamadı.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSavedReport(getSupabase(), deleteTarget.id);
      setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast('Kayıt silindi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Silme başarısız.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const sortableColumns: { key: SortColumn; label: string }[] = [
    { key: 'savedAt', label: 'Kayıt Z.' },
    { key: 'hesapTarihi', label: 'Hesap Tar.' },
    { key: 'businessName', label: 'İşletme Adı' },
    { key: 'totalPackages', label: 'Toplam P.' },
    { key: 'totalWithVat', label: 'KDV Dahil (₺)' },
    { key: 'netTotal', label: 'Alacak/Verecek (₺)' },
    { key: 'paymentStatus', label: 'Ödeme Dur.' },
  ];

  return (
    <div className="report-container">
      <header className="report-header">
        <h1>Kaydedilmiş Hakediş Raporları</h1>
        <Link href="/" className="btn btn-secondary btn-sm nav-back">
          Ana Sayfaya Dön
        </Link>
      </header>

      <div className="filters-bar">
        <div className="form-group">
          <label htmlFor="filterBusinessName">İşletme Adı:</label>
          <input
            id="filterBusinessName"
            type="text"
            className="form-control form-control-sm"
            placeholder="İşletme adına göre filtrele..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="filterHesapTarihi">Hesap Tarihi:</label>
          <input
            id="filterHesapTarihi"
            type="date"
            className="form-control form-control-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="filterPaymentStatus">Ödeme Durumu:</label>
          <select
            id="filterPaymentStatus"
            className="form-control form-control-sm"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Odenmedi">Ödenmedi</option>
            <option value="Odendi">Ödendi</option>
            <option value="Kismi Odeme">Kısmi Ödeme</option>
          </select>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setNameFilter('');
            setDateFilter('');
            setPaymentFilter('');
          }}
        >
          Filtreleri Temizle
        </button>
      </div>

      <main className="content-area">
        {loading ? (
          <p className="loading-text">Yükleniyor...</p>
        ) : displayed.length === 0 ? (
          <p id="noReportsMessage" className="empty-message">
            Gösterilecek kayıtlı rapor bulunmamaktadır.
          </p>
        ) : (
          <div className="table-responsive reports-table-wrap">
            <table id="savedReportsTable" className="data-table">
              <thead>
                <tr>
                  {sortableColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`sortable ${sort.column === col.key ? sort.direction : ''}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th>Kota?</th>
                  <th>Açıklama</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((report) => (
                  <tr key={report.id}>
                    <td>{formatDateTime(report.savedAt)}</td>
                    <td>{formatDate(report.hesapTarihi)}</td>
                    <td>{report.businessName}</td>
                    <td>{report.totalPackages}</td>
                    <td className="text-right">{formatCurrency(report.totalWithVat)} ₺</td>
                    <td
                      className="text-right"
                      style={{
                        color:
                          report.netTotal < 0
                            ? 'var(--success-dark)'
                            : report.netTotal > 0
                              ? 'var(--danger-dark)'
                              : undefined,
                      }}
                    >
                      {formatCurrency(report.netTotal)} ₺
                    </td>
                    <td>{report.paymentStatus}</td>
                    <td>{report.hasQuota}</td>
                    <td title={report.notes}>
                      {report.notes && report.notes.length > 30
                        ? report.notes.substring(0, 27) + '...'
                        : report.notes || '-'}
                    </td>
                    <td className="action-cell-reports">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setDetailReport(report)}
                      >
                        Detay
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-info"
                        onClick={() => copyReport(report)}
                      >
                        Kopyala
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteTarget(report)}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {detailReport && (
        <div className="modal-overlay active" onClick={() => setDetailReport(null)}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {detailReport.businessName} - Rapor Detayları (
                {formatDate(detailReport.hesapTarihi)})
              </h2>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setDetailReport(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="report-detail-grid">
                {[
                  ['Kayıt ID', detailReport.id],
                  ['İşletme ID', detailReport.businessId],
                  ['Kayıt Zamanı', formatDateTime(detailReport.savedAt)],
                  ['Hesap Tarihi (Rapor)', formatDate(detailReport.hesapTarihi)],
                  ['İşletme Adı', detailReport.businessName],
                  ['sep', 'Paket Bilgileri (Kayıt Anı)'],
                  ['Normal Paket Ücreti (0-5km)', `${formatCurrency(detailReport.normalFeeAtSave)} ₺`],
                  ['Uzak Paket Ücreti (5+km)', `${formatCurrency(detailReport.distantFeeAtSave)} ₺`],
                  ['Sistem Paketi Paket Sayısı', detailReport.normalPackages],
                  ['Uzak ve İlave Paket Sayısı', detailReport.distantPackages],
                  ['Toplam Paket Sayısı', detailReport.totalPackages],
                  ['sep', 'Hakediş Detayları (Kayıt Anı)'],
                  ['Hakediş (KDV Hariç)', `${formatCurrency(detailReport.hakedis)} ₺`],
                  ['KDV Oranı (%)', detailReport.vatRateAtSave],
                  ['KDV Tutarı', `${formatCurrency(detailReport.vatAmount)} ₺`],
                  ['KDV Dahil Toplam', `${formatCurrency(detailReport.totalWithVat)} ₺`],
                  ['sep', 'Ek İşlemler & Mahsuplaşma (Kayıt Anı)'],
                  ['Banka Komisyonu', `${formatCurrency(detailReport.bankCommission)} ₺`],
                  ['POS Bakiye', `${formatCurrency(detailReport.posBalance)} ₺`],
                  ['Nakit Bakiye', `${formatCurrency(detailReport.cashBalance)} ₺`],
                  ['Net Alacak/Verecek', `${formatCurrency(detailReport.netTotal)} ₺`],
                  ['sep', 'Diğer Bilgiler (Kayıt Anı)'],
                  ['Ödeme Durumu', detailReport.paymentStatus],
                  ['Kota Durumu', detailReport.hasQuota],
                  ['Açıklama', detailReport.notes || '-'],
                ].map((item, i) => {
                  if (item[0] === 'sep') {
                    return (
                      <div key={`sep-${i}`} className="detail-separator">
                        {item[1]}
                      </div>
                    );
                  }
                  return (
                    <div key={`row-${i}`} className="detail-row-pair">
                      <div className="detail-label">{item[0]}:</div>
                      <div className="detail-value">{item[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDetailReport(null)}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Kaydı Sil"
        message={
          deleteTarget
            ? `"${deleteTarget.businessName}" (${formatDate(deleteTarget.hesapTarihi)}) kaydı silinsin mi?`
            : ''
        }
        confirmLabel="Sil"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
