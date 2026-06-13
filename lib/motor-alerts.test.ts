import { describe, expect, it } from 'vitest';
import { getMotorAlert, countMotorsWithAlerts } from './motor-alerts';
import type { Motor } from './types';

const baseMotor: Motor = {
  id: '1',
  plate: '34 ABC 123',
  brand: 'Honda',
  model: 'Activa',
  courierId: null,
  courierName: null,
  region: 'İskele',
  inspectionDate: null,
  insuranceExpiry: null,
  status: 'Aktif',
  odometerKm: 0,
  notes: '',
};

describe('getMotorAlert', () => {
  it('returns none when no dates set', () => {
    const alert = getMotorAlert(baseMotor, new Date('2026-06-13'));
    expect(alert.level).toBe('none');
    expect(alert.messages).toHaveLength(0);
  });

  it('returns danger when inspection expired', () => {
    const alert = getMotorAlert(
      { ...baseMotor, inspectionDate: '2026-01-01' },
      new Date('2026-06-13'),
    );
    expect(alert.level).toBe('danger');
    expect(alert.messages.some((m) => m.includes('Muayene'))).toBe(true);
  });

  it('returns warning when inspection within 30 days', () => {
    const alert = getMotorAlert(
      { ...baseMotor, inspectionDate: '2026-07-01' },
      new Date('2026-06-13'),
    );
    expect(alert.level).toBe('warning');
  });
});

describe('countMotorsWithAlerts', () => {
  it('counts motors with any alert', () => {
    const count = countMotorsWithAlerts(
      [
        baseMotor,
        { ...baseMotor, id: '2', inspectionDate: '2026-01-01' },
      ],
      new Date('2026-06-13'),
    );
    expect(count).toBe(1);
  });
});
