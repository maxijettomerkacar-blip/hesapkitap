'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getActiveAssignmentsOnDate,
  getIdleMotors,
} from '@/lib/motor-assignments';
import { getUserRole } from '@/lib/auth/roles';
import { todayISO } from '@/lib/formatters';
import { createClient } from '@/lib/supabase/client';
import { fetchMotorAuditLog } from '@/lib/supabase/motor-audit';
import {
  assignCourierToMotor,
  createMotorWithPlate,
  fetchCouriers,
  fetchMotorAssignments,
  fetchMotors,
  findOrCreateCourierByName,
  updateMotorAssignment,
} from '@/lib/supabase/queries-motor';
import { fetchRegions } from '@/lib/supabase/queries';
import type { Courier, Motor, MotorAssignment, MotorAuditLog } from '@/lib/types';
import { CourierCombobox } from '@/components/dashboard/CourierCombobox';
import { MotorOpsShell } from '@/components/dashboard/MotorOpsShell';
import { useToast } from '@/components/ui/Toast';

export function MotorOpsApp() {
  const { showToast } = useToast();
  const getSupabase = useCallback(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(todayISO());
  const [motors, setMotors] = useState<Motor[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [assignments, setAssignments] = useState<MotorAssignment[]>([]);
  const [auditLog, setAuditLog] = useState<MotorAuditLog[]>([]);
  const [regions, setRegions] = useState<string[]>(['İskele', 'Barbaros']);

  const [newPlate, setNewPlate] = useState('');
  const [newPlateRegion, setNewPlateRegion] = useState('');
  const [assignMotorId, setAssignMotorId] = useState('');
  const [assignCourierName, setAssignCourierName] = useState('');
  const [assignCourierId, setAssignCourierId] = useState<string | null>(null);
  const [assignStart, setAssignStart] = useState(todayISO());
  const [assignEnd, setAssignEnd] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [editAssignment, setEditAssignment] = useState<MotorAssignment | null>(null);
  const [canAccessDashboard, setCanAccessDashboard] = useState(false);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) setCanAccessDashboard(getUserRole(user) === 'full');
      });
  }, [getSupabase]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const [m, c, a, r, log] = await Promise.all([
        fetchMotors(supabase).catch(() => [] as Motor[]),
        fetchCouriers(supabase).catch(() => [] as Courier[]),
        fetchMotorAssignments(supabase).catch(() => [] as MotorAssignment[]),
        fetchRegions(supabase),
        fetchMotorAuditLog(supabase, 40).catch(() => [] as MotorAuditLog[]),
      ]);
      setMotors(m);
      setCouriers(c);
      setAssignments(a);
      setRegions(r.length ? r : ['İskele', 'Barbaros']);
      setAuditLog(log);
      if (r.length) setNewPlateRegion((prev) => prev || r[0]);
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

  const activeToday = useMemo(
    () => getActiveAssignmentsOnDate(assignments, viewDate),
    [assignments, viewDate],
  );

  const idleMotors = useMemo(
    () => getIdleMotors(motors, assignments, viewDate),
    [motors, assignments, viewDate],
  );

  const handleAddMotor = async () => {
    if (!newPlate.trim()) return;
    try {
      await createMotorWithPlate(getSupabase(), newPlate, newPlateRegion || regions[0] || '');
      setNewPlate('');
      showToast('Motor eklendi.', 'success');
      await loadData();
    } catch (e) {
      console.error(e);
      showToast('Motor eklenemedi.', 'error');
    }
  };

  const handleAssign = async () => {
    if (!assignMotorId || !assignCourierName.trim()) {
      showToast('Motor ve kurye seçin.', 'error');
      return;
    }
    try {
      const supabase = getSupabase();
      let courierId = assignCourierId;
      if (!courierId) {
        const motor = motors.find((m) => m.id === assignMotorId);
        const created = await findOrCreateCourierByName(
          supabase,
          assignCourierName,
          motor?.region ?? '',
        );
        courierId = created.id;
      }
      await assignCourierToMotor(
        supabase,
        assignMotorId,
        courierId,
        assignStart,
        assignEnd || null,
        assignNotes,
      );
      showToast('Atama kaydedildi.', 'success');
      setAssignNotes('');
      setAssignEnd('');
      await loadData();
    } catch (e) {
      console.error(e);
      showToast('Atama yapılamadı.', 'error');
    }
  };

  const handleSaveEditAssignment = async () => {
    if (!editAssignment) return;
    try {
      await updateMotorAssignment(getSupabase(), editAssignment);
      showToast('Atama güncellendi.', 'success');
      setEditAssignment(null);
      await loadData();
    } catch (e) {
      console.error(e);
      showToast('Güncelleme başarısız.', 'error');
    }
  };

  if (loading) {
    return (
      <MotorOpsShell canAccessDashboard={canAccessDashboard}>
        <p className="loading-text">Yükleniyor...</p>
      </MotorOpsShell>
    );
  }

  return (
    <MotorOpsShell canAccessDashboard={canAccessDashboard}>
      <div className="motor-ops-date-bar">
        <label htmlFor="opsDate">Görüntüleme tarihi (anlık atama):</label>
        <input
          id="opsDate"
          type="date"
          className="form-control"
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
        />
      </div>

      <div className="motor-ops-grid">
        <section className="motor-ops-panel">
          <h3>Hızlı Atama</h3>
          <div className="form-group">
            <label htmlFor="assignMotor">Motor (Plaka)</label>
            <select
              id="assignMotor"
              className="form-control"
              value={assignMotorId}
              onChange={(e) => setAssignMotorId(e.target.value)}
            >
              <option value="">Seçin...</option>
              {motors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.plate} {m.brand ? `· ${m.brand}` : ''}
                </option>
              ))}
            </select>
          </div>
          <CourierCombobox
            couriers={couriers}
            value={assignCourierName}
            onChange={(name, id) => {
              setAssignCourierName(name);
              setAssignCourierId(id);
            }}
          />
          <div className="drawer-form-grid">
            <div className="form-group">
              <label>Başlangıç</label>
              <input type="date" className="form-control" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Bitiş (opsiyonel)</label>
              <input type="date" className="form-control" value={assignEnd} onChange={(e) => setAssignEnd(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Not</label>
            <input className="form-control" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleAssign}>
            Atamayı Kaydet
          </button>
        </section>

        <section className="motor-ops-panel">
          <h3>Motor Ekle</h3>
          <div className="form-group">
            <label>Plaka</label>
            <input className="form-control" value={newPlate} onChange={(e) => setNewPlate(e.target.value.toUpperCase())} placeholder="34 ABC 123" />
          </div>
          <div className="form-group">
            <label>Bölge</label>
            <select className="form-control" value={newPlateRegion} onChange={(e) => setNewPlateRegion(e.target.value)}>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleAddMotor}>
            Motor Ekle
          </button>
        </section>
      </div>

      <div className="motor-ops-status-grid">
        <section className="motor-ops-panel motor-ops-panel--highlight">
          <h3>
            Boşta Motorlar <span className="ops-count">{idleMotors.length}</span>
          </h3>
          {idleMotors.length === 0 ? (
            <p className="empty-message">Bu tarihte boşta aktif motor yok.</p>
          ) : (
            <ul className="ops-list">
              {idleMotors.map((m) => (
                <li key={m.id}>
                  <strong>{m.plate}</strong>
                  <span>{m.region}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="motor-ops-panel motor-ops-panel--highlight">
          <h3>
            Aktif Atamalar <span className="ops-count">{activeToday.length}</span>
          </h3>
          {activeToday.length === 0 ? (
            <p className="empty-message">Bu tarihte aktif atama yok.</p>
          ) : (
            <ul className="ops-list">
              {activeToday.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>{a.motorPlate ?? a.motorId}</strong>
                    <span> → {a.courierName ?? a.courierId}</span>
                  </div>
                  <span className="ops-dates">
                    {a.startDate}
                    {a.endDate ? ` — ${a.endDate}` : ' (devam)'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="motor-ops-panel">
        <h3>Atama Geçmişi &amp; Tarih Düzenle</h3>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Plaka</th>
                <th>Kurye</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
                <th>Kaydeden</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assignments.slice(0, 30).map((a) => (
                <tr key={a.id}>
                  <td>{a.motorPlate ?? '—'}</td>
                  <td>{a.courierName ?? '—'}</td>
                  <td>{a.startDate}</td>
                  <td>{a.endDate ?? 'Devam'}</td>
                  <td>{a.createdBy || '—'}</td>
                  <td>
                    <button type="button" className="btn btn-warning btn-sm" onClick={() => setEditAssignment({ ...a })}>
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="motor-ops-panel">
        <h3>İşlem Geçmişi (Denetim)</h3>
        <ul className="audit-log-list">
          {auditLog.map((log) => (
            <li key={log.id}>
              <div className="audit-log-meta">
                {new Date(log.createdAt).toLocaleString('tr-TR')} · <strong>{log.userEmail}</strong>
              </div>
              <div>{log.summary}</div>
            </li>
          ))}
        </ul>
      </section>

      {editAssignment && (
        <div className="modal-overlay active drawer-stack-modal">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>Atama Tarihlerini Düzenle</h2>
              <button type="button" className="modal-close-button" onClick={() => setEditAssignment(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>{editAssignment.motorPlate}</strong> → {editAssignment.courierName}
              </p>
              <div className="form-group">
                <label>Başlangıç</label>
                <input
                  type="date"
                  className="form-control"
                  value={editAssignment.startDate}
                  onChange={(e) => setEditAssignment({ ...editAssignment, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Bitiş (boş = devam ediyor)</label>
                <input
                  type="date"
                  className="form-control"
                  value={editAssignment.endDate ?? ''}
                  onChange={(e) =>
                    setEditAssignment({
                      ...editAssignment,
                      endDate: e.target.value || null,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Not</label>
                <input
                  className="form-control"
                  value={editAssignment.notes}
                  onChange={(e) => setEditAssignment({ ...editAssignment, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditAssignment(null)}>
                İptal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveEditAssignment}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </MotorOpsShell>
  );
}
