'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { downloadCsv, exportMotorsCsv } from '@/lib/export-csv';
import { formatCurrency, generateId } from '@/lib/formatters';
import { getMotorAlert } from '@/lib/motor-alerts';
import { createClient } from '@/lib/supabase/client';
import {
  fetchCouriers,
  fetchMaintenanceCostTotal,
  fetchMotors,
  upsertMotor,
} from '@/lib/supabase/queries-motor';
import { fetchRegions } from '@/lib/supabase/queries';
import type { Courier, Motor } from '@/lib/types';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { CourierPanel } from '@/components/dashboard/CourierPanel';
import { MotorDetailDrawer } from '@/components/dashboard/MotorDetailDrawer';
import { useToast } from '@/components/ui/Toast';

type Tab = 'motors' | 'couriers';

export function MotorApp() {
  const { showToast } = useToast();
  const getSupabase = useCallback(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [motors, setMotors] = useState<Motor[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [regions, setRegions] = useState<string[]>(['İskele', 'Barbaros']);
  const [tab, setTab] = useState<Tab>('motors');
  const [search, setSearch] = useState('');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [fleetMaintTotal, setFleetMaintTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const [m, c, r, maintTotal] = await Promise.all([
        fetchMotors(supabase).catch(() => [] as Motor[]),
        fetchCouriers(supabase).catch(() => [] as Courier[]),
        fetchRegions(supabase),
        fetchMaintenanceCostTotal(supabase).catch(() => 0),
      ]);
      setMotors(m);
      setCouriers(c);
      setRegions(r.length ? r : ['İskele', 'Barbaros']);
      setFleetMaintTotal(maintTotal);
    } catch (e) {
      console.error(e);
      showToast('Veriler yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  }, [getSupabase, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMotors = useMemo(() => {
    let list = motors;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.plate.toLowerCase().includes(q) ||
          (m.courierName ?? '').toLowerCase().includes(q) ||
          m.brand.toLowerCase().includes(q),
      );
    }
    if (filterUnassigned) {
      list = list.filter((m) => !m.courierId);
    }
    return list;
  }, [motors, search, filterUnassigned]);

  const handleAddMotor = async () => {
    const motor: Motor = {
      id: generateId(),
      plate: 'YENİ',
      brand: '',
      model: '',
      courierId: null,
      region: regions[0] ?? '',
      inspectionDate: null,
      insuranceExpiry: null,
      status: 'Aktif',
      odometerKm: 0,
      notes: '',
    };
    try {
      await upsertMotor(getSupabase(), motor);
      await loadData();
      const created = (await fetchMotors(getSupabase())).find((m) => m.id === motor.id);
      if (created) setSelectedMotor(created);
      setAddOpen(false);
    } catch (e) {
      console.error(e);
      showToast('Motor eklenemedi. Migration uygulandı mı?', 'error');
    }
  };

  const alertBadge = (motor: Motor) => {
    const alert = getMotorAlert(motor);
    if (alert.level === 'none') {
      return <span className="motor-badge motor-badge--ok">Tamam</span>;
    }
    return (
      <span className={`motor-badge motor-badge--${alert.level === 'danger' ? 'danger' : 'warning'}`}>
        {alert.messages[0]}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardShell>
        <p className="loading-text">Yükleniyor...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="kpi-context" style={{ marginBottom: '1rem' }}>
        <span>
          <strong>Filo:</strong> {motors.length} motor · {couriers.filter((c) => c.isActive).length} aktif kurye
        </span>
        <span>
          <strong>Toplam bakım maliyeti:</strong> {formatCurrency(fleetMaintTotal)} ₺
        </span>
      </div>

      <div className="motor-tabs">
        <button type="button" className={`motor-tab ${tab === 'motors' ? 'active' : ''}`} onClick={() => setTab('motors')}>
          Motorlar
        </button>
        <button type="button" className={`motor-tab ${tab === 'couriers' ? 'active' : ''}`} onClick={() => setTab('couriers')}>
          Kuryeler
        </button>
      </div>

      {tab === 'couriers' ? (
        <CourierPanel couriers={couriers} regions={regions} onChange={loadData} />
      ) : (
        <>
          <div className="motor-toolbar">
            <input
              type="search"
              className="form-control"
              placeholder="Plaka veya kurye ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 220 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
              <input type="checkbox" checked={filterUnassigned} onChange={(e) => setFilterUnassigned(e.target.checked)} />
              Atanmamış
            </label>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
              Motor Ekle
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => downloadCsv('motors.csv', exportMotorsCsv(motors))}
            >
              CSV İndir
            </button>
          </div>

          {filteredMotors.length === 0 ? (
            <p className="empty-message">Motor bulunamadı.</p>
          ) : (
            <>
              <div className="motor-table-desktop dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Plaka</th>
                      <th>Kurye</th>
                      <th>Bölge</th>
                      <th>Muayene</th>
                      <th>Sigorta</th>
                      <th>Durum</th>
                      <th>Uyarı</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMotors.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <strong>{m.plate}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.brand} {m.model}
                          </div>
                        </td>
                        <td>{m.courierName ?? '—'}</td>
                        <td>{m.region || '—'}</td>
                        <td>{m.inspectionDate ? new Date(m.inspectionDate).toLocaleDateString('tr-TR') : '—'}</td>
                        <td>{m.insuranceExpiry ? new Date(m.insuranceExpiry).toLocaleDateString('tr-TR') : '—'}</td>
                        <td>{m.status}</td>
                        <td>{alertBadge(m)}</td>
                        <td>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => setSelectedMotor(m)}>
                            Detay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="motor-cards">
                {filteredMotors.map((m) => (
                  <div key={m.id} className="motor-card">
                    <div className="motor-card-header">
                      <div>
                        <div className="motor-card-plate">{m.plate}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {m.courierName ?? 'Kurye yok'} · {m.region}
                        </div>
                      </div>
                      {alertBadge(m)}
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setSelectedMotor(m)}>
                      Detay
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {addOpen && (
        <div className="modal-overlay active">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>Yeni Motor</h2>
              <button type="button" className="modal-close-button" onClick={() => setAddOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Yeni motor kaydı oluşturulacak. Plakayı detay ekranından düzenleyebilirsiniz.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
                İptal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddMotor}>
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMotor && (
        <MotorDetailDrawer
          open={!!selectedMotor}
          motor={selectedMotor}
          couriers={couriers}
          regions={regions}
          onClose={() => setSelectedMotor(null)}
          onSaved={loadData}
          onDeleted={loadData}
        />
      )}
    </DashboardShell>
  );
}
