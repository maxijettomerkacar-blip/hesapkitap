'use client';

import { useEffect, useState } from 'react';
import type { Business } from '@/lib/types';
import { generateId } from '@/lib/formatters';

interface BusinessModalProps {
  open: boolean;
  business: Business | null;
  regions: string[];
  onClose: () => void;
  onSave: (business: Business) => void;
}

export function BusinessModal({ open, business, regions, onClose, onSave }: BusinessModalProps) {
  const [name, setName] = useState('');
  const [normalFee, setNormalFee] = useState('');
  const [distantFee, setDistantFee] = useState('');
  const [vat, setVat] = useState('');
  const [region, setRegion] = useState(regions[0] ?? '');

  useEffect(() => {
    if (business) {
      setName(business.name);
      setNormalFee(String(business.normalFee));
      setDistantFee(String(business.distantFee));
      setVat(String(business.vat));
      setRegion(business.region);
    } else {
      setName('');
      setNormalFee('');
      setDistantFee('');
      setVat('');
      setRegion(regions[0] ?? '');
    }
  }, [business, regions, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: business?.id ?? generateId(),
      name: name.trim(),
      normalFee: parseFloat(normalFee) || 0,
      distantFee: parseFloat(distantFee) || 0,
      vat: parseFloat(vat) || 0,
      region,
    });
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content-wrapper">
        <div className="modal-header">
          <h2>{business ? 'İşletmeyi Düzenle' : 'Yeni İşletme Ekle'}</h2>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="businessName">İşletme Adı</label>
              <input
                id="businessName"
                className="form-control"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="normalPackageFee">Normal Paket Ücreti (0-5 km)</label>
              <input
                id="normalPackageFee"
                type="number"
                step="0.01"
                className="form-control"
                required
                value={normalFee}
                onChange={(e) => setNormalFee(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="distantPackageFee">Uzak Paket Ücreti (5+ km)</label>
              <input
                id="distantPackageFee"
                type="number"
                step="0.01"
                className="form-control"
                required
                value={distantFee}
                onChange={(e) => setDistantFee(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vatRate">KDV Oranı (%)</label>
              <input
                id="vatRate"
                type="number"
                step="0.1"
                className="form-control"
                required
                value={vat}
                onChange={(e) => setVat(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="businessRegion">Bölge</label>
              <select
                id="businessRegion"
                className="form-control"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary">
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
