'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatCurrency, generateId, todayISO } from '@/lib/formatters';
import { getMotorAlert } from '@/lib/motor-alerts';
import { createClient } from '@/lib/supabase/client';
import {
  deleteMotor,
  deleteMotorMaintenance,
  fetchMaintenanceCostTotal,
  fetchMotorMaintenance,
  insertMotorMaintenance,
  upsertMotor,
} from '@/lib/supabase/queries-motor';
import type { Courier, Motor, MotorMaintenance, MotorServiceType } from '@/lib/types';
import { MOTOR_SERVICE_TYPES, MOTOR_STATUS_OPTIONS } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

interface MotorDetailDrawerProps {
  open: boolean;
  motor: Motor | null;
  couriers: Courier[];
  regions: string[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function MotorDetailDrawer({
  open,
  motor,
  couriers,
  regions,
  onClose,
  onSaved,
  onDeleted,
}: MotorDetailDrawerProps) {
  const { showToast } = useToast();
  const getSupabase = useCallback(() => createClient(), []);

  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [courierId, setCourierId] = useState('');
  const [region, setRegion] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [status, setStatus] = useState<Motor['status']>('Aktif');
  const [odometerKm, setOdometerKm] = useState('');
  const [notes, setNotes] = useState('');
  const [maintenance, setMaintenance] = useState<MotorMaintenance[]>([]);
  const [maintCostTotal, setMaintCostTotal] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [maintFormOpen, setMaintFormOpen] = useState(false);
  const [svcDate, setSvcDate] = useState(todayISO());
  const [svcType, setSvcType] = useState<MotorServiceType>('Periyodik Bakım');
  const [svcCost, setSvcCost] = useState('');
  const [svcKm, setSvcKm] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcNextDue, setSvcNextDue] = useState('');

  useEffect(() => {
    if (!motor || !open) return;
    setPlate(motor.plate);
    setBrand(motor.brand);
    setModel(motor.model);
    setCourierId(motor.courierId ?? '');
    setRegion(motor.region);
    setInspectionDate(motor.inspectionDate ?? '');
    setInsuranceExpiry(motor.insuranceExpiry ?? '');
    setStatus(motor.status);
    setOdometerKm(String(motor.odometerKm || ''));
    setNotes(motor.notes);

    const loadMaint = async () => {
      try {
        const supabase = getSupabase();
        const [records, total] = await Promise.all([
          fetchMotorMaintenance(supabase, motor.id),
          fetchMaintenanceCostTotal(supabase, motor.id),
        ]);
        setMaintenance(records);
        setMaintCostTotal(total);
      } catch (e) {
        console.error(e);
      }
    };
    loadMaint();
  }, [motor, open, getSupabase]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!motor) return null;

  const alert = getMotorAlert({
    ...motor,
    plate,
    inspectionDate: inspectionDate || null,
    insuranceExpiry: insuranceExpiry || null,
  });

  const handleSaveMotor = async () => {
    if (!plate.trim()) return;
    try {
      await upsertMotor(getSupabase(), {
        ...motor,
        plate: plate.trim().toUpperCase(),
        brand,
        model,
        courierId: courierId || null,
        region,
        inspectionDate: inspectionDate || null,
        insuranceExpiry: insuranceExpiry || null,
        status,
        odometerKm: parseFloat(odometerKm) || 0,
        notes,
      });
      showToast('Motor kaydedildi.', 'success');
      onSaved();
    } catch (e) {
      console.error(e);
      showToast('Motor kaydedilemedi.', 'error');
    }
  };

  const handleAddMaintenance = async () => {
    try {
      await insertMotorMaintenance(getSupabase(), {
        id: generateId(),
        motorId: motor.id,
        serviceDate: svcDate,
        serviceType: svcType,
        cost: parseFloat(svcCost) || 0,
        odometerKm: parseFloat(svcKm) || 0,
        description: svcDesc,
        nextDueDate: svcNextDue || null,
      });
      const [records, total] = await Promise.all([
        fetchMotorMaintenance(getSupabase(), motor.id),
        fetchMaintenanceCostTotal(getSupabase(), motor.id),
      ]);
      setMaintenance(records);
      setMaintCostTotal(total);
      setMaintFormOpen(false);
      setSvcCost('');
      setSvcDesc('');
      showToast('Bakım kaydı eklendi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Bakım kaydı eklenemedi.', 'error');
    }
  };

  const handleDeleteMaint = async (id: string) => {
    try {
      await deleteMotorMaintenance(getSupabase(), id);
      const records = await fetchMotorMaintenance(getSupabase(), motor.id);
      const total = await fetchMaintenanceCostTotal(getSupabase(), motor.id);
      setMaintenance(records);
      setMaintCostTotal(total);
    } catch (e) {
      console.error(e);
      showToast('Kayıt silinemedi.', 'error');
    }
  };

  const handleDeleteMotor = async () => {
    try {
      await deleteMotor(getSupabase(), motor.id);
      setDeleteOpen(false);
      onDeleted();
      onClose();
      showToast('Motor silindi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Silme başarısız.', 'error');
    }
  };

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <aside className="drawer-panel" role="dialog" aria-modal="true">
          <div className="drawer-header">
            <div>
              <h2>{plate || motor.plate}</h2>
              <div className="drawer-header-meta">
                {brand} {model}
                {alert.level !== 'none' && (
                  <span
                    className={`motor-badge motor-badge--${alert.level === 'danger' ? 'danger' : 'warning'}`}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    {alert.messages[0]}
                  </span>
                )}
              </div>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="drawer-body">
            <div className="drawer-section">
              <h3>Motor Bilgileri</h3>
              <div className="drawer-form-grid">
                <div className="form-group">
                  <label htmlFor="mPlate">Plaka</label>
                  <input id="mPlate" className="form-control" value={plate} onChange={(e) => setPlate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="mStatus">Durum</label>
                  <select id="mStatus" className="form-control" value={status} onChange={(e) => setStatus(e.target.value as Motor['status'])}>
                    {MOTOR_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mBrand">Marka</label>
                  <input id="mBrand" className="form-control" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="mModel">Model</label>
                  <input id="mModel" className="form-control" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="mCourier">Kurye</label>
                  <select id="mCourier" className="form-control" value={courierId} onChange={(e) => setCourierId(e.target.value)}>
                    <option value="">Atanmamış</option>
                    {couriers.filter((c) => c.isActive).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mRegion">Bölge</label>
                  <select id="mRegion" className="form-control" value={region} onChange={(e) => setRegion(e.target.value)}>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mInsp">Muayene Tarihi</label>
                  <input id="mInsp" type="date" className="form-control" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="mIns">Sigorta Bitiş</label>
                  <input id="mIns" type="date" className="form-control" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="mKm">Km</label>
                  <input id="mKm" type="number" className="form-control" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} />
                </div>
                <div className="form-group full">
                  <label htmlFor="mNotes">Not</label>
                  <textarea id="mNotes" className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>Bakım Geçmişi</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Toplam: {formatCurrency(maintCostTotal)} ₺
                </span>
              </div>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginBottom: '0.75rem' }} onClick={() => setMaintFormOpen(true)}>
                Yeni Bakım Kaydı
              </button>
              {maintenance.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Kayıt yok.</p>
              ) : (
                <ul className="maintenance-timeline">
                  {maintenance.map((m) => (
                    <li key={m.id}>
                      <strong>{new Date(m.serviceDate).toLocaleDateString('tr-TR')}</strong> — {m.serviceType}
                      {m.cost > 0 && ` · ${formatCurrency(m.cost)} ₺`}
                      {m.description && <div style={{ color: 'var(--text-muted)' }}>{m.description}</div>}
                      {m.nextDueDate && (
                        <div style={{ fontSize: '0.75rem' }}>Sonraki: {new Date(m.nextDueDate).toLocaleDateString('tr-TR')}</div>
                      )}
                      <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: '0.35rem' }} onClick={() => handleDeleteMaint(m.id)}>
                        Sil
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn btn-success" onClick={handleSaveMotor}>
              Kaydet
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>
              Motoru Sil
            </button>
          </div>
        </aside>
      </div>

      {maintFormOpen && (
        <div className="modal-overlay active drawer-stack-modal">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>Yeni Bakım Kaydı</h2>
              <button type="button" className="modal-close-button" onClick={() => setMaintFormOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tarih</label>
                <input type="date" className="form-control" value={svcDate} onChange={(e) => setSvcDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Tür</label>
                <select className="form-control" value={svcType} onChange={(e) => setSvcType(e.target.value as MotorServiceType)}>
                  {MOTOR_SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Maliyet (₺)</label>
                <input type="number" step="0.01" className="form-control" value={svcCost} onChange={(e) => setSvcCost(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Km</label>
                <input type="number" className="form-control" value={svcKm} onChange={(e) => setSvcKm(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Sonraki Tarih</label>
                <input type="date" className="form-control" value={svcNextDue} onChange={(e) => setSvcNextDue(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea className="form-control" rows={2} value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setMaintFormOpen(false)}>
                İptal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddMaintenance}>
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Motor Sil"
        message={`"${motor.plate}" silinsin mi?`}
        confirmLabel="Sil"
        danger
        onConfirm={handleDeleteMotor}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
