import type { MotorMaintenance } from './types';

export interface MaintenanceCostStats {
  totalCost: number;
  recordCount: number;
  averageCost: number;
  maxSingleCost: number;
  withReceiptCount: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export function getMonthRange(year: number, month: number): DateRange {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: toISODate(start),
    end: toISODate(end),
  };
}

export function getCurrentMonthRange(today = new Date()): DateRange {
  return getMonthRange(today.getFullYear(), today.getMonth() + 1);
}

export function getPreviousMonthRange(today = new Date()): DateRange {
  const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return getMonthRange(d.getFullYear(), d.getMonth() + 1);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function filterMaintenanceByRange(
  records: MotorMaintenance[],
  range: DateRange,
): MotorMaintenance[] {
  return records.filter((r) => r.serviceDate >= range.start && r.serviceDate <= range.end);
}

export function computeMaintenanceStats(records: MotorMaintenance[]): MaintenanceCostStats {
  if (records.length === 0) {
    return {
      totalCost: 0,
      recordCount: 0,
      averageCost: 0,
      maxSingleCost: 0,
      withReceiptCount: 0,
    };
  }

  const costs = records.map((r) => r.cost);
  const totalCost = costs.reduce((a, b) => a + b, 0);

  return {
    totalCost,
    recordCount: records.length,
    averageCost: totalCost / records.length,
    maxSingleCost: Math.max(...costs),
    withReceiptCount: records.filter((r) => r.receiptUrl).length,
  };
}
