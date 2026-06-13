'use client';

import { useMemo, useState } from 'react';
import {
  computeMaintenanceStats,
  filterMaintenanceByRange,
  getCurrentMonthRange,
  getPreviousMonthRange,
  type DateRange,
} from '@/lib/motor-maintenance-stats';
import { formatCurrency } from '@/lib/formatters';
import type { MotorMaintenance } from '@/lib/types';

type Preset = 'this_month' | 'last_month' | 'custom';

interface MotorCostSummaryProps {
  records: MotorMaintenance[];
  motorCount: number;
  courierCount: number;
}

export function MotorCostSummary({ records, motorCount, courierCount }: MotorCostSummaryProps) {
  const [preset, setPreset] = useState<Preset>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range: DateRange = useMemo(() => {
    if (preset === 'last_month') return getPreviousMonthRange();
    if (preset === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    return getCurrentMonthRange();
  }, [preset, customStart, customEnd]);

  const filtered = useMemo(
    () => filterMaintenanceByRange(records, range),
    [records, range],
  );
  const stats = useMemo(() => computeMaintenanceStats(filtered), [filtered]);

  const rangeLabel =
    preset === 'this_month'
      ? 'Bu ay'
      : preset === 'last_month'
        ? 'Geçen ay'
        : `${range.start} — ${range.end}`;

  return (
    <section className="motor-cost-section">
      <div className="motor-cost-header">
        <h2 className="motor-cost-title">Bakım Masraf Özeti</h2>
        <div className="motor-cost-filters">
          <button
            type="button"
            className={`btn btn-sm ${preset === 'this_month' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPreset('this_month')}
          >
            Bu Ay
          </button>
          <button
            type="button"
            className={`btn btn-sm ${preset === 'last_month' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPreset('last_month')}
          >
            Geçen Ay
          </button>
          <button
            type="button"
            className={`btn btn-sm ${preset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPreset('custom')}
          >
            Tarih Aralığı
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="motor-cost-custom-range">
          <input type="date" className="form-control" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          <span>—</span>
          <input type="date" className="form-control" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
        </div>
      )}

      <p className="motor-cost-range-label">{rangeLabel} dönemi</p>

      <div className="kpi-grid motor-cost-grid">
        <div className="kpi-card kpi-card--neutral">
          <div className="kpi-card-label">Toplam Bakım Masrafı</div>
          <div className="kpi-card-value">{formatCurrency(stats.totalCost)} ₺</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label">Bakım Kaydı</div>
          <div className="kpi-card-value">{stats.recordCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label">Ortalama Fiş</div>
          <div className="kpi-card-value">{formatCurrency(stats.averageCost)} ₺</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label">En Yüksek Tek Bakım</div>
          <div className="kpi-card-value">{formatCurrency(stats.maxSingleCost)} ₺</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label">Fişli Kayıt</div>
          <div className="kpi-card-value">{stats.withReceiptCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label">Filo / Kurye</div>
          <div className="kpi-card-value">
            {motorCount} / {courierCount}
          </div>
        </div>
      </div>
    </section>
  );
}
