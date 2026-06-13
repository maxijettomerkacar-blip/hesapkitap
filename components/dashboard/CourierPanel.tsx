'use client';

import { useCallback, useState } from 'react';
import { generateId } from '@/lib/formatters';
import { createClient } from '@/lib/supabase/client';
import {
  deleteCourier,
  upsertCourier,
} from '@/lib/supabase/queries-motor';
import type { Courier } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

interface CourierPanelProps {
  couriers: Courier[];
  regions: string[];
  onChange: () => void;
}

export function CourierPanel({ couriers, regions, onChange }: CourierPanelProps) {
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Courier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Courier | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState(regions[0] ?? '');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const getSupabase = useCallback(() => createClient(), []);

  const openForm = (courier?: Courier) => {
    if (courier) {
      setEditing(courier);
      setName(courier.name);
      setPhone(courier.phone);
      setRegion(courier.region || regions[0] || '');
      setNotes(courier.notes);
      setIsActive(courier.isActive);
    } else {
      setEditing(null);
      setName('');
      setPhone('');
      setRegion(regions[0] ?? '');
      setNotes('');
      setIsActive(true);
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const courier: Courier = {
      id: editing?.id ?? generateId(),
      name: name.trim(),
      phone: phone.trim(),
      region,
      notes,
      isActive,
    };
    try {
      await upsertCourier(getSupabase(), courier);
      setFormOpen(false);
      onChange();
      showToast('Kurye kaydedildi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Kurye kaydedilemedi.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourier(getSupabase(), deleteTarget.id);
      setDeleteTarget(null);
      onChange();
      showToast('Kurye silindi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Silme başarısız.', 'error');
    }
  };

  return (
    <div>
      <div className="motor-toolbar">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openForm()}>
          Kurye Ekle
        </button>
      </div>

      {couriers.length === 0 ? (
        <p className="empty-message">Henüz kurye kaydı yok.</p>
      ) : (
        <div>
          {couriers.map((c) => (
            <div key={c.id} className={`courier-list-item ${!c.isActive ? 'courier-inactive' : ''}`}>
              <div>
                <strong>{c.name}</strong>
                {c.phone && <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>{c.phone}</span>}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {c.region || '—'} {c.isActive ? '' : '(Pasif)'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button type="button" className="btn btn-warning btn-sm" onClick={() => openForm(c)}>
                  Düzenle
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="modal-overlay active drawer-stack-modal">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>{editing ? 'Kurye Düzenle' : 'Yeni Kurye'}</h2>
              <button type="button" className="modal-close-button" onClick={() => setFormOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="cName">Ad Soyad</label>
                <input id="cName" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="cPhone">Telefon</label>
                <input id="cPhone" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="cRegion">Bölge</label>
                <select id="cRegion" className="form-control" value={region} onChange={(e) => setRegion(e.target.value)}>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="">Genel</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cNotes">Not</label>
                <textarea id="cNotes" className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Aktif
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
                İptal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Kurye Sil"
        message={`"${deleteTarget?.name}" silinsin mi?`}
        confirmLabel="Sil"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
