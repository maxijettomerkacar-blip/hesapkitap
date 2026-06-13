import type { Motor } from './types';

export type AlertLevel = 'none' | 'warning' | 'danger';

export interface MotorAlert {
  level: AlertLevel;
  messages: string[];
}

function daysUntil(dateStr: string | null | undefined, today: Date): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.ceil((target.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

function levelFromDays(days: number | null): AlertLevel {
  if (days === null) return 'none';
  if (days < 0) return 'danger';
  if (days <= 30) return 'warning';
  return 'none';
}

function mergeLevel(current: AlertLevel, next: AlertLevel): AlertLevel {
  if (current === 'danger' || next === 'danger') return 'danger';
  if (current === 'warning' || next === 'warning') return 'warning';
  return 'none';
}

export function getMotorAlert(motor: Motor, today = new Date()): MotorAlert {
  const messages: string[] = [];
  let level: AlertLevel = 'none';

  const inspectionDays = daysUntil(motor.inspectionDate, today);
  const insuranceDays = daysUntil(motor.insuranceExpiry, today);

  const inspLevel = levelFromDays(inspectionDays);
  if (inspLevel === 'danger') {
    messages.push('Muayene süresi geçmiş');
    level = 'danger';
  } else if (inspLevel === 'warning') {
    messages.push(`Muayene ${inspectionDays} gün içinde`);
    level = mergeLevel(level, 'warning');
  }

  const insLevel = levelFromDays(insuranceDays);
  if (insLevel === 'danger') {
    messages.push('Sigorta süresi geçmiş');
    level = 'danger';
  } else if (insLevel === 'warning') {
    messages.push(`Sigorta ${insuranceDays} gün içinde`);
    level = mergeLevel(level, 'warning');
  }

  return { level, messages };
}

export function countMotorsWithAlerts(motors: Motor[], today = new Date()): number {
  return motors.filter((m) => getMotorAlert(m, today).level !== 'none').length;
}
