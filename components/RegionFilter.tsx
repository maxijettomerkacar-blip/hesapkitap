'use client';

import { useState } from 'react';

interface RegionFilterProps {
  regions: string[];
  activeRegion: string;
  onSelect: (region: string) => void;
  onAddRegion: (name: string) => void;
}

export function RegionFilter({ regions, activeRegion, onSelect, onAddRegion }: RegionFilterProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [newRegion, setNewRegion] = useState('');

  return (
    <div className="region-filter-bar">
      <div className="region-buttons">
        <button
          type="button"
          className={`region-btn ${activeRegion === 'Tümü' ? 'active' : ''}`}
          onClick={() => onSelect('Tümü')}
        >
          Tümü
        </button>
        {regions.map((region) => (
          <button
            key={region}
            type="button"
            className={`region-btn ${activeRegion === region ? 'active' : ''}`}
            onClick={() => onSelect(region)}
          >
            {region}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setAddOpen(true)}>
        Bölge Ekle
      </button>

      {addOpen && (
        <div className="modal-overlay active">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>Yeni Bölge</h2>
              <button type="button" className="modal-close-button" onClick={() => setAddOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="newRegion">Bölge Adı</label>
                <input
                  id="newRegion"
                  className="form-control"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const trimmed = newRegion.trim();
                  if (trimmed && !regions.includes(trimmed)) {
                    onAddRegion(trimmed);
                    setNewRegion('');
                    setAddOpen(false);
                  }
                }}
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
