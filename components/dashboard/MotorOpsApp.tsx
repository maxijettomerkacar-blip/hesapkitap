'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getActiveAssignmentsOnDate,
  getIdleMotors,
  getMotorAssignmentOnDate,
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
  unassignMotorFromCourier,
  updateCourierName,
  updateMotorAssignment,
  updateMotorStatus,
} from '@/lib/supabase/queries-motor';
import { fetchRegions } from '@/lib/supabase/queries';
import type { Courier, Motor, MotorAssignment, MotorAuditLog, MotorStatus } from '@/lib/types';
import { MOTOR_STATUS_OPTIONS } from '@/lib/types';
import { CourierCombobox } from '@/components/dashboard/CourierCombobox';
import { MotorOpsShell } from '@/components/dashboard/MotorOpsShell';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

type ConfirmAction =
  | {
      kind: 'assign';
      motor: Motor;
      courierName: string;
      courierId: string | null;
      currentAssignment?: MotorAssignment;
    }
  | { kind: 'unassign'; motor: Motor }
  | { kind: 'status'; motor: Motor; status: MotorStatus };

function statusClass(status: MotorStatus): string {
  switch (status) {
    case 'Aktif':
      return 'ops-badge ops-badge--active';
    case 'Kazalı':
      return 'ops-badge ops-badge--damaged';
    case 'Bakımda':
      return 'ops-badge ops-badge--maintenance';
    default:
      return 'ops-badge ops-badge--inactive';
  }
}

export function MotorOpsApp() {
  const { showToast } = useToast();
  const getSupabase = useCallback(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(todayISO());
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [motors, setMotors] = useState<Motor[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [assignments, setAssignments] = useState<MotorAssignment[]>([]);
  const [auditLog, setAuditLog] = useState<MotorAuditLog[]>([]);
  const [regions, setRegions] = useState<string[]>(['İskele', 'Barbaros']);
  const [canAccessDashboard, setCanAccessDashboard] = useState(false);

  const [showAddMotor, setShowAddMotor] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newPlateRegion, setNewPlateRegion] = useState('');

  const [editingMotorId, setEditingMotorId] = useState<string | null>(null);
  const [editCourierName, setEditCourierName] = useState('');
  const [editCourierId, setEditCourierId] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [editAssignment, setEditAssignment] = useState<MotorAssignment | null>(null);

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
        fetchMotorAuditLog(supabase, 30).catch(() => [] as MotorAuditLog[]),
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

  const filteredMotors = useMemo(() => {
    const list =
      regionFilter === 'all' ? motors : motors.filter((m) => m.region === regionFilter);
    return [...list].sort((a, b) => a.plate.localeCompare(b.plate, 'tr'));
  }, [motors, regionFilter]);

  const stats = useMemo(() => {
    const scoped = regionFilter === 'all' ? motors : motors.filter((m) => m.region === regionFilter);
    const scopedIds = new Set(scoped.map((m) => m.id));
    const assigned = activeToday.filter((a) => scopedIds.has(a.motorId)).length;
    const idle = idleMotors.filter((m) => scopedIds.has(m.id)).length;
    const damaged = scoped.filter((m) => m.status === 'Kazalı').length;
    const maintenance = scoped.filter((m) => m.status === 'Bakımda' || m.status === 'Pasif').length;
    return {
      total: scoped.length,
      assigned,
      idle,
      damaged,
      maintenance,
    };
  }, [motors, regionFilter, activeToday, idleMotors]);

  const startEditCourier = (motor: Motor) => {
    const assignment = getMotorAssignmentOnDate(motor.id, assignments, viewDate);
    setEditingMotorId(motor.id);
    setEditCourierName(assignment?.courierName ?? motor.courierName ?? '');
    setEditCourierId(assignment?.courierId ?? motor.courierId);
  };

  const cancelEditCourier = () => {
    setEditingMotorId(null);
    setEditCourierName('');
    setEditCourierId(null);
  };

  const requestSaveCourier = (motor: Motor) => {
    const trimmed = editCourierName.trim();
    const current = getMotorAssignmentOnDate(motor.id, assignments, viewDate);
    const currentName = current?.courierName ?? motor.courierName ?? '';

    if (!trimmed) {
      if (current || motor.courierId) {
        setConfirmAction({ kind: 'unassign', motor });
      } else {
        cancelEditCourier();
      }
      return;
    }

    if (
      trimmed.toLowerCase() === currentName.toLowerCase() &&
      (editCourierId === (current?.courierId ?? motor.courierId) || !editCourierId)
    ) {
      cancelEditCourier();
      return;
    }

    setConfirmAction({
      kind: 'assign',
      motor,
      courierName: trimmed,
      courierId: editCourierId,
      currentAssignment: current,
    });
  };

  const requestStatusChange = (motor: Motor, status: MotorStatus) => {
    if (motor.status === status) return;
    setConfirmAction({ kind: 'status', motor, status });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const supabase = getSupabase();

    try {
      if (confirmAction.kind === 'unassign') {
        await unassignMotorFromCourier(supabase, confirmAction.motor.id, viewDate);
        showToast(`${confirmAction.motor.plate} boşa alındı.`, 'success');
        cancelEditCourier();
      }

      if (confirmAction.kind === 'status') {
        await updateMotorStatus(supabase, confirmAction.motor.id, confirmAction.status);
        showToast(`${confirmAction.motor.plate} → ${confirmAction.status}`, 'success');
      }

      if (confirmAction.kind === 'assign') {
        const { motor, courierName, courierId, currentAssignment } = confirmAction;
        let resolvedId = courierId;

        if (resolvedId && courierName.trim().toLowerCase() !== currentAssignment?.courierName?.toLowerCase()) {
          const existing = couriers.find((c) => c.id === resolvedId);
          if (existing && existing.name.toLowerCase() !== courierName.trim().toLowerCase()) {
            await updateCourierName(supabase, resolvedId, courierName);
          }
        }

        if (!resolvedId) {
          const created = await findOrCreateCourierByName(supabase, courierName, motor.region);
          resolvedId = created.id;
        }

        await assignCourierToMotor(supabase, motor.id, resolvedId, viewDate, null, '');
        showToast(`${motor.plate} → ${courierName.trim()}`, 'success');
        cancelEditCourier();
      }

      setConfirmAction(null);
      await loadData();
    } catch (e) {
      console.error(e);
      showToast('İşlem başarısız.', 'error');
    }
  };

  const handleAddMotor = async () => {
    if (!newPlate.trim()) return;
    try {
      await createMotorWithPlate(getSupabase(), newPlate, newPlateRegion || regions[0] || '');
      setNewPlate('');
      setShowAddMotor(false);
      showToast('Motor eklendi.', 'success');
      await loadData();
    } catch (e) {
      console.error(e);
      showToast('Motor eklenemedi (plaka benzersiz olmalı).', 'error');
    }
  };

  const handleSaveEditAssignment = async () => {
    if (!editAssignment) return;
    try {
      await updateMotorAssignment(getSupabase(), editAssignment);
      showToast('Atama tarihleri güncellendi.', 'success');
      setEditAssignment(null);
      await loadData();
    } catch (e) {
      console.error(e);
      showToast('Güncelleme başarısız.', 'error');
    }
  };

  const confirmMessage = useMemo(() => {
    if (!confirmAction) return '';
    if (confirmAction.kind === 'unassign') {
      return `${confirmAction.motor.plate} plakalı motorun kurye ataması kaldırılacak. Onaylıyor musunuz?`;
    }
    if (confirmAction.kind === 'status') {
      return `${confirmAction.motor.plate} durumu "${confirmAction.status}" olarak değiştirilecek. Onaylıyor musunuz?`;
    }
    return `${confirmAction.motor.plate} plakalı motor "${confirmAction.courierName.trim()}" kuryesine atanacak. Onaylıyor musunuz?`;
  }, [confirmAction]);

  if (loading) {
    return (
      <MotorOpsShell canAccessDashboard={canAccessDashboard}>
        <p className="loading-text">Yükleniyor...</p>
      </MotorOpsShell>
    );
  }

  return (
    <MotorOpsShell canAccessDashboard={canAccessDashboard}>
      <div className="motor-ops-toolbar">
        <div className="motor-ops-toolbar-row">
          <div className="motor-ops-date-inline">
            <label htmlFor="opsDate">Tarih</label>
            <input
              id="opsDate"
              type="date"
              className="form-control"
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
            />
          </div>
          <div className="motor-ops-region-tabs">
            <button
              type="button"
              className={`ops-tab ${regionFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRegionFilter('all')}
            >
              Tümü
            </button>
            {regions.map((r) => (
              <button
                key={r}
                type="button"
                className={`ops-tab ${regionFilter === r ? 'active' : ''}`}
                onClick={() => setRegionFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-sm motor-ops-add-btn" onClick={() => setShowAddMotor(true)}>
            + Motor Ekle
          </button>
        </div>
      </div>

      <div className="motor-ops-kpi-row">
        <div className="motor-ops-kpi">
          <span className="motor-ops-kpi-value">{stats.total}</span>
          <span className="motor-ops-kpi-label">Toplam</span>
        </div>
        <div className="motor-ops-kpi motor-ops-kpi--assigned">
          <span className="motor-ops-kpi-value">{stats.assigned}</span>
          <span className="motor-ops-kpi-label">Atamalı</span>
        </div>
        <div className="motor-ops-kpi motor-ops-kpi--idle">
          <span className="motor-ops-kpi-value">{stats.idle}</span>
          <span className="motor-ops-kpi-label">Boşta</span>
        </div>
        <div className="motor-ops-kpi motor-ops-kpi--damaged">
          <span className="motor-ops-kpi-value">{stats.damaged}</span>
          <span className="motor-ops-kpi-label">Kazalı</span>
        </div>
        <div className="motor-ops-kpi motor-ops-kpi--maintenance">
          <span className="motor-ops-kpi-value">{stats.maintenance}</span>
          <span className="motor-ops-kpi-label">Bakım / Pasif</span>
        </div>
      </div>

      <section className="motor-ops-motor-list">
        <div className="motor-ops-list-head">
          <span>Plaka</span>
          <span>Bölge</span>
          <span>Durum</span>
          <span>Kurye</span>
          <span></span>
        </div>

        {filteredMotors.length === 0 ? (
          <p className="empty-message motor-ops-empty">Bu filtrede motor yok.</p>
        ) : (
          filteredMotors.map((motor) => {
            const assignment = getMotorAssignmentOnDate(motor.id, assignments, viewDate);
            const courierDisplay = assignment?.courierName ?? motor.courierName ?? '';
            const isIdle = motor.status === 'Aktif' && !assignment;
            const isEditing = editingMotorId === motor.id;

            return (
              <div key={motor.id} className={`motor-ops-row ${isIdle ? 'motor-ops-row--idle' : ''}`}>
                <div className="motor-ops-plate">
                  <strong>{motor.plate}</strong>
                  {isIdle && <span className="ops-badge ops-badge--idle">Boşta</span>}
                </div>

                <div className="motor-ops-region">
                  <span className="ops-region-tag">{motor.region || '—'}</span>
                </div>

                <div className="motor-ops-status">
                  <select
                    key={`${motor.id}-${motor.status}`}
                    className="form-control form-control-sm ops-status-select"
                    value={motor.status}
                    onChange={(e) => requestStatusChange(motor, e.target.value as MotorStatus)}
                  >
                    {MOTOR_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className={statusClass(motor.status)}>{motor.status}</span>
                </div>

                <div className="motor-ops-courier">
                  {isEditing ? (
                    <CourierCombobox
                      id={`courier-${motor.id}`}
                      couriers={couriers}
                      value={editCourierName}
                      compact
                      placeholder="Kurye adı..."
                      onChange={(name, id) => {
                        setEditCourierName(name);
                        setEditCourierId(id);
                      }}
                    />
                  ) : (
                    <span className="motor-ops-courier-name">
                      {courierDisplay || <em className="text-muted">Atama yok</em>}
                    </span>
                  )}
                </div>

                <div className="motor-ops-row-actions">
                  {isEditing ? (
                    <>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => requestSaveCourier(motor)}>
                        Kaydet
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEditCourier}>
                        İptal
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => startEditCourier(motor)}>
                      Kurye
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      <details className="motor-ops-details">
        <summary>Atama geçmişi &amp; tarih düzenle</summary>
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
              {assignments.slice(0, 25).map((a) => (
                <tr key={a.id}>
                  <td>{a.motorPlate ?? '—'}</td>
                  <td>{a.courierName ?? '—'}</td>
                  <td>{a.startDate}</td>
                  <td>{a.endDate ?? 'Devam'}</td>
                  <td>{a.createdBy || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={() => setEditAssignment({ ...a })}
                    >
                      Tarih
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="motor-ops-details">
        <summary>Son işlemler</summary>
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
      </details>

      {showAddMotor && (
        <div className="modal-overlay active drawer-stack-modal">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>Motor Ekle</h2>
              <button type="button" className="modal-close-button" onClick={() => setShowAddMotor(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Plaka</label>
                <input
                  className="form-control"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="34 ABC 123"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Bölge</label>
                <select
                  className="form-control"
                  value={newPlateRegion}
                  onChange={(e) => setNewPlateRegion(e.target.value)}
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddMotor(false)}>
                İptal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddMotor}>
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {editAssignment && (
        <div className="modal-overlay active drawer-stack-modal">
          <div className="modal-content-wrapper modal-sm">
            <div className="modal-header">
              <h2>Atama Tarihleri</h2>
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
                <label>Bitiş (boş = devam)</label>
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

      <ConfirmDialog
        open={!!confirmAction}
        title="Onay gerekli"
        message={confirmMessage}
        confirmLabel="Evet, uygula"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </MotorOpsShell>
  );
}
