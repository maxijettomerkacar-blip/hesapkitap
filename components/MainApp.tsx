'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { calculateRow, calculateRowForSave } from '@/lib/calculations';
import { formatCurrency, generateId, todayISO } from '@/lib/formatters';
import { buildReportText } from '@/lib/report-text';
import { createClient } from '@/lib/supabase/client';
import {
  addRegion,
  deleteBusiness,
  ensureInitialData,
  fetchBusinesses,
  fetchHesapTarihi,
  fetchRegions,
  fetchTableEntries,
  importBackupData,
  insertSavedReport,
  saveHesapTarihi,
  upsertBusiness,
  upsertTableEntry,
} from '@/lib/supabase/queries';
import type { BackupData, Business, PaymentStatus, QuotaStatus, TableEntry } from '@/lib/types';
import {
  PAYMENT_STATUS_OPTIONS,
  QUOTA_STATUS_OPTIONS,
  createDefaultTableEntry,
} from '@/lib/types';
import { BusinessModal } from '@/components/BusinessModal';
import { RegionFilter } from '@/components/RegionFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export function MainApp() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tableData, setTableData] = useState<Record<string, TableEntry>>({});
  const [regions, setRegions] = useState<string[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState('Tümü');
  const [hesapTarihi, setHesapTarihi] = useState(todayISO());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const [confirmImport, setConfirmImport] = useState<BackupData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Business | null>(null);
  const [cancelledPrompt, setCancelledPrompt] = useState<{ businessId: string; value: string } | null>(
    null,
  );
  const [savingReportId, setSavingReportId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      await ensureInitialData(supabase);
      const [biz, entries, regs, tarih] = await Promise.all([
        fetchBusinesses(supabase),
        fetchTableEntries(supabase),
        fetchRegions(supabase),
        fetchHesapTarihi(supabase),
      ]);
      setBusinesses(biz);
      setTableData(entries);
      setRegions(regs);
      setHesapTarihi(tarih || todayISO());
    } catch (e) {
      console.error(e);
      showToast('Veriler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBusinesses = useMemo(() => {
    const list =
      activeRegionFilter === 'Tümü'
        ? businesses
        : businesses.filter((b) => b.region === activeRegionFilter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
  }, [businesses, activeRegionFilter]);

  const getEntry = (businessId: string): TableEntry => {
    return tableData[businessId] ?? createDefaultTableEntry(businessId);
  };

  const updateEntryField = async (
    businessId: string,
    field: keyof TableEntry,
    value: string | number,
  ) => {
    const current = getEntry(businessId);
    const updated: TableEntry = { ...current, [field]: value };
    setTableData((prev) => ({ ...prev, [businessId]: updated }));
    try {
      await upsertTableEntry(getSupabase(), updated);
    } catch (e) {
      console.error(e);
      showToast('Kayıt güncellenemedi.', 'error');
    }
  };

  const handleSaveBusiness = async (business: Business) => {
    try {
      await upsertBusiness(getSupabase(), business);
      setBusinesses((prev) => {
        const idx = prev.findIndex((b) => b.id === business.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = business;
          return next;
        }
        return [...prev, business];
      });
      if (!tableData[business.id]) {
        const entry = createDefaultTableEntry(business.id);
        await upsertTableEntry(getSupabase(), entry);
        setTableData((prev) => ({ ...prev, [business.id]: entry }));
      }
      setModalOpen(false);
      setEditingBusiness(null);
      showToast('İşletme kaydedildi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('İşletme kaydedilemedi.', 'error');
    }
  };

  const handleDeleteBusiness = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBusiness(getSupabase(), deleteConfirm.id);
      setBusinesses((prev) => prev.filter((b) => b.id !== deleteConfirm.id));
      setTableData((prev) => {
        const next = { ...prev };
        delete next[deleteConfirm.id];
        return next;
      });
      showToast('İşletme silindi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Silme işlemi başarısız.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleAddRegion = async (name: string) => {
    try {
      await addRegion(getSupabase(), name);
      setRegions((prev) => [...prev, name]);
      showToast('Bölge eklendi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Bölge eklenemedi (zaten var olabilir).', 'error');
    }
  };

  const handleHesapTarihiChange = async (date: string) => {
    setHesapTarihi(date);
    try {
      await saveHesapTarihi(getSupabase(), date);
    } catch (e) {
      console.error(e);
      showToast('Hesap tarihi kaydedilemedi.', 'error');
    }
  };

  const exportData = async () => {
    try {
      const supabase = getSupabase();
      const [biz, entries, regs, reportsRes] = await Promise.all([
        fetchBusinesses(supabase),
        fetchTableEntries(supabase),
        fetchRegions(supabase),
        supabase.from('saved_reports').select('*'),
      ]);
      const tableDataExport: Record<string, Omit<TableEntry, 'businessId'>> = {};
      Object.values(entries).forEach((e) => {
        const { businessId, ...rest } = e;
        tableDataExport[businessId] = rest;
      });
      const backup = {
        app: 'MaxiHesaplama',
        version: 'v6',
        date: new Date().toISOString(),
        data: {
          businesses: biz,
          tableData: tableDataExport,
          savedReports: (reportsRes.data ?? []).map((r: Record<string, unknown>) => ({
            reportId: r.id,
            businessId: r.business_id,
            businessName: r.business_name,
            businessRegion: r.business_region,
            hesapTarihi: r.hesap_tarihi,
            normalPackages: r.normal_packages,
            distantPackages: r.distant_packages,
            totalPackages: r.total_packages,
            normalPackageFeeAtSave: r.normal_fee_at_save,
            distantPackageFeeAtSave: r.distant_fee_at_save,
            vatRateAtSave: r.vat_rate_at_save,
            hakedis: r.hakedis,
            vatAmount: r.vat_amount,
            totalWithVat: r.total_with_vat,
            bankCommission: r.bank_commission,
            posBalance: r.pos_balance,
            cashBalance: r.cash_balance,
            netTotal: r.net_total,
            paymentStatus: r.payment_status,
            hasQuota: r.has_quota,
            notes: r.notes,
            savedAt: r.saved_at,
          })),
          regions: regs,
        },
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maxi_yedek_${todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Yedek indirildi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Dışa aktarma başarısız.', 'error');
    }
  };

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(String(e.target?.result)) as BackupData;
        if (backup.app !== 'MaxiHesaplama') {
          showToast('Geçersiz yedek dosyası.', 'error');
          return;
        }
        setConfirmImport(backup);
      } catch {
        showToast('Dosya okunamadı.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!confirmImport) return;
    try {
      await importBackupData(getSupabase(), confirmImport.data);
      await loadData();
      showToast('Yedek başarıyla yüklendi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('İçe aktarma başarısız.', 'error');
    } finally {
      setConfirmImport(null);
    }
  };

  const copyReport = async (business: Business, cancelledPackages: number) => {
    const entry = getEntry(business.id);
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
    const text = buildReportText({
      business,
      entry,
      hesapTarihi,
      ...result,
      cancelledPackages,
    });
    try {
      await navigator.clipboard.writeText(text);
      showToast(`"${business.name}" raporu panoya kopyalandı.`, 'success');
    } catch {
      showToast('Panoya kopyalanamadı.', 'error');
    }
  };

  const saveReport = async (business: Business) => {
    const entry = getEntry(business.id);
    const result = calculateRowForSave({
      normalPackages: entry.normalPackages,
      distantPackages: entry.distantPackages,
      bankCommission: entry.bankCommission,
      posBalance: entry.posBalance,
      cashBalance: entry.cashBalance,
      normalFee: business.normalFee,
      distantFee: business.distantFee,
      vat: business.vat,
    });
    setSavingReportId(business.id);
    try {
      await insertSavedReport(getSupabase(), {
        id: generateId(),
        businessId: business.id,
        businessName: business.name,
        businessRegion: business.region,
        hesapTarihi,
        normalPackages: entry.normalPackages,
        distantPackages: entry.distantPackages,
        totalPackages: result.totalPackages,
        normalFeeAtSave: business.normalFee,
        distantFeeAtSave: business.distantFee,
        vatRateAtSave: business.vat,
        hakedis: result.hakedis,
        vatAmount: result.vatAmount,
        totalWithVat: result.totalWithVat,
        bankCommission: entry.bankCommission,
        posBalance: entry.posBalance,
        cashBalance: entry.cashBalance,
        netTotal: result.netTotal,
        paymentStatus: entry.paymentStatus,
        hasQuota: entry.hasQuota,
        notes: entry.notes,
        savedAt: new Date().toISOString(),
      });
      showToast('Rapor kaydedildi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Rapor kaydedilemedi.', 'error');
    } finally {
      setSavingReportId(null);
    }
  };

  if (loading) {
    return <div className="container"><p className="loading-text">Yükleniyor...</p></div>;
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>İşletme Hakediş Hesaplama</h1>
        <div className="controls-bar">
          <div className="date-control">
            <label htmlFor="hesapTarihi">Hesap Tarihi:</label>
            <input
              type="date"
              id="hesapTarihi"
              value={hesapTarihi}
              onChange={(e) => handleHesapTarihiChange(e.target.value)}
            />
          </div>
          <div className="main-actions">
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDataMenuOpen((v) => !v)}
              >
                Veri Yönetimi
              </button>
              {dataMenuOpen && (
                <div className="dropdown-menu">
                  <button type="button" onClick={() => { setDataMenuOpen(false); exportData(); }}>
                    Dışa Aktar (Yedek Al)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDataMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    İçe Aktar (Yedekten Dön)
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileImport(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingBusiness(null);
                setModalOpen(true);
              }}
            >
              Yeni İşletme Ekle
            </button>
            <Link href="/reports" className="btn btn-info">
              Kayıtları Göster
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn btn-secondary btn-sm">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>

      <RegionFilter
        regions={regions}
        activeRegion={activeRegionFilter}
        onSelect={setActiveRegionFilter}
        onAddRegion={handleAddRegion}
      />

      <main className="content-area">
        <div className="table-responsive">
          <table id="calculationTable" className="data-table">
            <thead>
              <tr>
                {[
                  { lines: ['S/N'], title: 'Sıra Numarası' },
                  { lines: ['İşletme'], title: 'İşletmenin Adı' },
                  { lines: ['0-5km', 'P.'], title: '0-5 km paket sayısı' },
                  { lines: ['5+km', 'P.'], title: '5+ km paket sayısı' },
                  { lines: ['Toplam', 'P.'], title: 'Toplam paket' },
                  { lines: ['Hakediş', '(₺)'], title: 'KDV hariç hakediş' },
                  { lines: ['KDV', '(₺)'], title: 'KDV tutarı' },
                  { lines: ['KDV', 'Dahil ₺'], title: 'KDV dahil toplam' },
                  { lines: ['Banka', 'Kom. ₺'], title: 'Banka komisyonu' },
                  { lines: ['Pos', 'Bakiye ₺'], title: 'POS bakiye' },
                  { lines: ['Nakit', '(₺)'], title: 'Nakit bakiye' },
                  { lines: ['Net', 'Alacak/Ver.'], title: 'Alacak / Verecek net tutar' },
                  { lines: ['Ödeme', 'Dur.'], title: 'Ödeme durumu' },
                  { lines: ['Kota?'], title: 'Kota durumu' },
                  { lines: ['Açıklama'], title: 'Notlar' },
                  { lines: ['İşlemler'], title: 'Düzenle / Sil' },
                  { lines: ['Rapor', '/ Kayıt'], title: 'Kopyala / Kaydet' },
                ].map(({ lines, title }) => (
                  <th key={title} title={title}>
                    <span className="th-label">
                      {lines.map((line, i) => (
                        <span key={i}>
                          {i > 0 && <br />}
                          {line}
                        </span>
                      ))}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={17} className="empty-row">
                    Bu bölgede işletme bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((business, index) => {
                  const entry = getEntry(business.id);
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
                  return (
                    <tr key={business.id}>
                      <td>{index + 1}</td>
                      <td title={business.name}>{business.name}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          min={0}
                          value={entry.normalPackages || ''}
                          onChange={(e) =>
                            updateEntryField(
                              business.id,
                              'normalPackages',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          min={0}
                          value={entry.distantPackages || ''}
                          onChange={(e) =>
                            updateEntryField(
                              business.id,
                              'distantPackages',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="calculated-field">{result.totalPackages}</td>
                      <td className="calculated-field">{formatCurrency(result.hakedis)}</td>
                      <td className="calculated-field">{formatCurrency(result.vatAmount)}</td>
                      <td className="calculated-field">{formatCurrency(result.totalWithVat)}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          step="0.01"
                          value={entry.bankCommission || ''}
                          onChange={(e) =>
                            updateEntryField(
                              business.id,
                              'bankCommission',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          step="0.01"
                          value={entry.posBalance || ''}
                          onChange={(e) =>
                            updateEntryField(
                              business.id,
                              'posBalance',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          step="0.01"
                          value={entry.cashBalance || ''}
                          onChange={(e) =>
                            updateEntryField(
                              business.id,
                              'cashBalance',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>
                      <td className="calculated-field">{formatCurrency(result.netTotal)}</td>
                      <td>
                        <select
                          className="form-control form-control-sm"
                          value={entry.paymentStatus}
                          onChange={(e) =>
                            updateEntryField(
                              business.id,
                              'paymentStatus',
                              e.target.value as PaymentStatus,
                            )
                          }
                        >
                          {PAYMENT_STATUS_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-control form-control-sm"
                          value={entry.hasQuota}
                          onChange={(e) =>
                            updateEntryField(business.id, 'hasQuota', e.target.value as QuotaStatus)
                          }
                        >
                          {QUOTA_STATUS_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={entry.notes}
                          onChange={(e) => updateEntryField(business.id, 'notes', e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={() => {
                              setEditingBusiness(business);
                              setModalOpen(true);
                            }}
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirm(business)}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-info"
                            onClick={() =>
                              setCancelledPrompt({ businessId: business.id, value: '0' })
                            }
                          >
                            Kopyala
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            disabled={savingReportId === business.id}
                            onClick={() => saveReport(business)}
                          >
                            {savingReportId === business.id ? 'Kaydediliyor...' : 'Kaydet'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      <BusinessModal
        open={modalOpen}
        business={editingBusiness}
        regions={regions}
        onClose={() => {
          setModalOpen(false);
          setEditingBusiness(null);
        }}
        onSave={handleSaveBusiness}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="İşletme Sil"
        message={deleteConfirm ? `"${deleteConfirm.name}" silinsin mi?` : ''}
        confirmLabel="Sil"
        danger
        onConfirm={handleDeleteBusiness}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmDialog
        open={!!confirmImport}
        title="Yedekten Geri Yükle"
        message="Mevcut veriler silinecek ve yedekteki veriler yüklenecek. Onaylıyor musunuz?"
        confirmLabel="Yükle"
        danger
        onConfirm={runImport}
        onCancel={() => setConfirmImport(null)}
      />

      {cancelledPrompt && (
        <div className="modal-overlay active">
          <div className="modal-content-wrapper">
            <div className="modal-header">
              <h2>İptal Edilen Paket</h2>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setCancelledPrompt(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>İptal edilen paket sayısı (isteğe bağlı)</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  value={cancelledPrompt.value}
                  onChange={(e) =>
                    setCancelledPrompt({ ...cancelledPrompt, value: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelledPrompt(null)}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const biz = businesses.find((b) => b.id === cancelledPrompt.businessId);
                  if (biz) {
                    copyReport(biz, parseInt(cancelledPrompt.value, 10) || 0);
                  }
                  setCancelledPrompt(null);
                }}
              >
                Raporu Kopyala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
