'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateRow, calculateRowForSave } from '@/lib/calculations';
import { formatCurrency, generateId } from '@/lib/formatters';
import { buildReportText } from '@/lib/report-text';
import { createClient } from '@/lib/supabase/client';
import {
  deleteBusiness,
  insertSavedReport,
  upsertBusiness,
  upsertTableEntry,
} from '@/lib/supabase/queries';
import type { Business, PaymentStatus, QuotaStatus, TableEntry } from '@/lib/types';
import {
  PAYMENT_STATUS_OPTIONS,
  QUOTA_STATUS_OPTIONS,
} from '@/lib/types';
import { BusinessSettingsModal } from '@/components/dashboard/BusinessSettingsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

const draftKey = (businessId: string) => `maxi_draft_${businessId}`;

interface EntryDrawerProps {
  open: boolean;
  business: Business | null;
  initialEntry: TableEntry;
  hesapTarihi: string;
  regions: string[];
  onClose: () => void;
  onSaved: (entry: TableEntry) => void;
  onBusinessUpdated: (business: Business) => void;
  onBusinessDeleted: (businessId: string) => void;
}

export function EntryDrawer({
  open,
  business,
  initialEntry,
  hesapTarihi,
  regions,
  onClose,
  onSaved,
  onBusinessUpdated,
  onBusinessDeleted,
}: EntryDrawerProps) {
  const { showToast } = useToast();
  const [entry, setEntry] = useState<TableEntry>(initialEntry);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(business);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelledPrompt, setCancelledPrompt] = useState(false);
  const [cancelledValue, setCancelledValue] = useState('');
  const [saving, setSaving] = useState(false);

  const getSupabase = useCallback(() => createClient(), []);

  useEffect(() => {
    if (!business || !open) return;
    setCurrentBusiness(business);
    const draft = typeof window !== 'undefined' ? localStorage.getItem(draftKey(business.id)) : null;
    if (draft) {
      try {
        setEntry(JSON.parse(draft) as TableEntry);
        return;
      } catch {
        /* use initial */
      }
    }
    setEntry(initialEntry);
  }, [business, open, initialEntry]);

  useEffect(() => {
    if (!open || !business) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !settingsOpen && !deleteOpen && !cancelledPrompt) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, business, settingsOpen, deleteOpen, cancelledPrompt, onClose]);

  const result = useMemo(() => {
    if (!currentBusiness) return null;
    return calculateRow({
      normalPackages: entry.normalPackages,
      distantPackages: entry.distantPackages,
      bankCommission: entry.bankCommission,
      posBalance: entry.posBalance,
      cashBalance: entry.cashBalance,
      normalFee: currentBusiness.normalFee,
      distantFee: currentBusiness.distantFee,
      vat: currentBusiness.vat,
    });
  }, [entry, currentBusiness]);

  const updateField = <K extends keyof TableEntry>(field: K, value: TableEntry[K]) => {
    setEntry((prev) => {
      const next = { ...prev, [field]: value };
      if (currentBusiness) {
        localStorage.setItem(draftKey(currentBusiness.id), JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!currentBusiness) return;
    setSaving(true);
    try {
      await upsertTableEntry(getSupabase(), entry);
      localStorage.removeItem(draftKey(currentBusiness.id));
      onSaved(entry);
      showToast('Kayıt güncellendi.', 'success');
      onClose();
    } catch (e) {
      console.error(e);
      showToast('Kayıt güncellenemedi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyReport = async (cancelledPackages: number) => {
    if (!currentBusiness || !result) return;
    const text = buildReportText({
      business: currentBusiness,
      entry,
      hesapTarihi,
      ...result,
      cancelledPackages,
    });
    try {
      await navigator.clipboard.writeText(text);
      showToast('Rapor panoya kopyalandı.', 'success');
    } catch {
      showToast('Panoya kopyalanamadı.', 'error');
    }
    setCancelledPrompt(false);
  };

  const handleSaveReport = async () => {
    if (!currentBusiness) return;
    const calc = calculateRowForSave({
      normalPackages: entry.normalPackages,
      distantPackages: entry.distantPackages,
      bankCommission: entry.bankCommission,
      posBalance: entry.posBalance,
      cashBalance: entry.cashBalance,
      normalFee: currentBusiness.normalFee,
      distantFee: currentBusiness.distantFee,
      vat: currentBusiness.vat,
    });
    setSaving(true);
    try {
      await insertSavedReport(getSupabase(), {
        id: generateId(),
        businessId: currentBusiness.id,
        businessName: currentBusiness.name,
        businessRegion: currentBusiness.region,
        hesapTarihi,
        normalPackages: entry.normalPackages,
        distantPackages: entry.distantPackages,
        totalPackages: calc.totalPackages,
        normalFeeAtSave: currentBusiness.normalFee,
        distantFeeAtSave: currentBusiness.distantFee,
        vatRateAtSave: currentBusiness.vat,
        hakedis: calc.hakedis,
        vatAmount: calc.vatAmount,
        totalWithVat: calc.totalWithVat,
        bankCommission: entry.bankCommission,
        posBalance: entry.posBalance,
        cashBalance: entry.cashBalance,
        netTotal: calc.netTotal,
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
      setSaving(false);
    }
  };

  const handleBusinessSave = async (updated: Business) => {
    try {
      await upsertBusiness(getSupabase(), updated);
      setCurrentBusiness(updated);
      onBusinessUpdated(updated);
      setSettingsOpen(false);
      showToast('İşletme ayarları kaydedildi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('İşletme kaydedilemedi.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!currentBusiness) return;
    try {
      await deleteBusiness(getSupabase(), currentBusiness.id);
      localStorage.removeItem(draftKey(currentBusiness.id));
      onBusinessDeleted(currentBusiness.id);
      setDeleteOpen(false);
      onClose();
      showToast('İşletme silindi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Silme başarısız.', 'error');
    }
  };

  if (!currentBusiness) return null;

  const netNegative = (result?.netTotal ?? 0) < 0;

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="presentation"
      >
        <aside
          className="drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="entry-drawer-title"
        >
          <div className="drawer-header">
            <div>
              <h2 id="entry-drawer-title">{currentBusiness.name}</h2>
              <div className="drawer-header-meta">
                {currentBusiness.region} · Hesap:{' '}
                {hesapTarihi
                  ? new Date(hesapTarihi).toLocaleDateString('tr-TR')
                  : '—'}
              </div>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose} aria-label="Kapat">
              ✕
            </button>
          </div>

          <div className="drawer-body">
            <div className="drawer-section">
              <h3>Paket Girişi</h3>
              <div className="drawer-form-grid">
                <div className="form-group">
                  <label htmlFor="np">0-5 km Paket</label>
                  <input
                    id="np"
                    type="number"
                    min={0}
                    className="form-control"
                    value={entry.normalPackages || ''}
                    onChange={(e) =>
                      updateField('normalPackages', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dp">5+ km Paket</label>
                  <input
                    id="dp"
                    type="number"
                    min={0}
                    className="form-control"
                    value={entry.distantPackages || ''}
                    onChange={(e) =>
                      updateField('distantPackages', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <h3>Parasal Giriş</h3>
              <div className="drawer-form-grid">
                <div className="form-group">
                  <label htmlFor="bk">Banka Kom. (₺)</label>
                  <input
                    id="bk"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={entry.bankCommission || ''}
                    onChange={(e) =>
                      updateField('bankCommission', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pos">POS Bakiye (₺)</label>
                  <input
                    id="pos"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={entry.posBalance || ''}
                    onChange={(e) => updateField('posBalance', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nakit">Nakit (₺)</label>
                  <input
                    id="nakit"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={entry.cashBalance || ''}
                    onChange={(e) => updateField('cashBalance', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <h3>Durum</h3>
              <div className="drawer-form-grid">
                <div className="form-group">
                  <label htmlFor="pay">Ödeme Dur.</label>
                  <select
                    id="pay"
                    className="form-control"
                    value={entry.paymentStatus}
                    onChange={(e) =>
                      updateField('paymentStatus', e.target.value as PaymentStatus)
                    }
                  >
                    {PAYMENT_STATUS_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="quota">Kota?</label>
                  <select
                    id="quota"
                    className="form-control"
                    value={entry.hasQuota}
                    onChange={(e) => updateField('hasQuota', e.target.value as QuotaStatus)}
                  >
                    {QUOTA_STATUS_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <label htmlFor="notes">Açıklama</label>
                  <textarea
                    id="notes"
                    className="form-control"
                    rows={3}
                    value={entry.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {result && (
              <div className="drawer-section">
                <h3>Hesap Özeti</h3>
                <div className="calc-preview">
                  <div className="calc-preview-item">
                    <span>Toplam Paket</span>
                    <span>{result.totalPackages}</span>
                  </div>
                  <div className="calc-preview-item">
                    <span>Hakediş</span>
                    <span>{formatCurrency(result.hakedis)} ₺</span>
                  </div>
                  <div className="calc-preview-item">
                    <span>KDV</span>
                    <span>{formatCurrency(result.vatAmount)} ₺</span>
                  </div>
                  <div className="calc-preview-item">
                    <span>KDV Dahil</span>
                    <span>{formatCurrency(result.totalWithVat)} ₺</span>
                  </div>
                  <div
                    className={`calc-preview-item full ${netNegative ? 'net-negative' : 'net-positive'}`}
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <span>Net Alacak/Verecek</span>
                    <span>{formatCurrency(result.netTotal)} ₺</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Ücretler: 0-5km {formatCurrency(currentBusiness.normalFee)} ₺ · 5+km{' '}
                  {formatCurrency(currentBusiness.distantFee)} ₺ · KDV %{currentBusiness.vat}
                </p>
              </div>
            )}
          </div>

          <div className="drawer-footer">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSave}
              disabled={saving}
            >
              Kaydet
            </button>
            <button
              type="button"
              className="btn btn-info btn-sm"
              onClick={() => setCancelledPrompt(true)}
            >
              Rapor Kopyala
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveReport}
              disabled={saving}
            >
              Rapor Kaydet
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => setSettingsOpen(true)}
            >
              İşletme Ayarları
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Sil
            </button>
          </div>
        </aside>
      </div>

      <BusinessSettingsModal
        open={settingsOpen}
        business={currentBusiness}
        regions={regions}
        onClose={() => setSettingsOpen(false)}
        onSave={handleBusinessSave}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="İşletmeyi Sil"
        message={`"${currentBusiness.name}" silinsin mi?`}
        confirmLabel="Sil"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {cancelledPrompt && (
        <div className="modal-overlay active drawer-stack-modal">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>İptal Edilen Paket</h2>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setCancelledPrompt(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="cancelled">İptal paket sayısı (opsiyonel)</label>
                <input
                  id="cancelled"
                  type="number"
                  min={0}
                  className="form-control"
                  value={cancelledValue}
                  onChange={(e) => setCancelledValue(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelledPrompt(false)}
              >
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleCopyReport(parseFloat(cancelledValue) || 0)}
              >
                Kopyala
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
