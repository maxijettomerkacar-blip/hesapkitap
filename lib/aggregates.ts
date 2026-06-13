import { calculateRow } from './calculations';
import type { Business, PaymentStatus, TableEntry } from './types';

export interface RowAggregateInput {
  business: Business;
  entry: TableEntry;
}

export interface DashboardTotals {
  businessCount: number;
  withDataCount: number;
  totalPackages: number;
  totalHakedis: number;
  totalVat: number;
  totalWithVat: number;
  totalBankCommission: number;
  totalPosBalance: number;
  totalCashBalance: number;
  netReceivable: number;
  netPayable: number;
  paymentCounts: Record<PaymentStatus, number>;
  quotaCount: number;
}

export interface RegionTotals {
  region: string;
  businessCount: number;
  totalPackages: number;
  netReceivable: number;
  netPayable: number;
}

function hasEntryData(entry: TableEntry): boolean {
  return (
    entry.normalPackages > 0 ||
    entry.distantPackages > 0 ||
    entry.bankCommission > 0 ||
    entry.posBalance > 0 ||
    entry.cashBalance > 0 ||
    entry.notes.trim().length > 0
  );
}

export function computeDashboardTotals(rows: RowAggregateInput[]): DashboardTotals {
  const paymentCounts: Record<PaymentStatus, number> = {
    Odenmedi: 0,
    Odendi: 0,
    'Kismi Odeme': 0,
  };

  const totals: DashboardTotals = {
    businessCount: rows.length,
    withDataCount: 0,
    totalPackages: 0,
    totalHakedis: 0,
    totalVat: 0,
    totalWithVat: 0,
    totalBankCommission: 0,
    totalPosBalance: 0,
    totalCashBalance: 0,
    netReceivable: 0,
    netPayable: 0,
    paymentCounts,
    quotaCount: 0,
  };

  for (const { business, entry } of rows) {
    if (hasEntryData(entry)) totals.withDataCount += 1;
    if (entry.hasQuota === 'Var') totals.quotaCount += 1;

    const status = entry.paymentStatus as PaymentStatus;
    if (status in paymentCounts) {
      paymentCounts[status] += 1;
    }

    totals.totalBankCommission += entry.bankCommission;
    totals.totalPosBalance += entry.posBalance;
    totals.totalCashBalance += entry.cashBalance;

    const result = calculateRow({
      normalPackages: entry.normalPackages,
      distantPackages: entry.distantPackages,
      bankCommission: entry.bankCommission,
      posBalance: entry.posBalance,
      cashBalance: entry.cashBalance,
      normalFee: business.normalFee,
      distantFee: business.distantFee,
      vat: business.vat,
    });

    totals.totalPackages += result.totalPackages;
    totals.totalHakedis += result.hakedis;
    totals.totalVat += result.vatAmount;
    totals.totalWithVat += result.totalWithVat;

    if (result.netTotal >= 0) {
      totals.netReceivable += result.netTotal;
    } else {
      totals.netPayable += Math.abs(result.netTotal);
    }
  }

  return totals;
}

export function groupByRegion(rows: RowAggregateInput[]): RegionTotals[] {
  const map = new Map<string, RegionTotals>();

  for (const { business, entry } of rows) {
    const region = business.region || 'Diğer';
    let group = map.get(region);
    if (!group) {
      group = {
        region,
        businessCount: 0,
        totalPackages: 0,
        netReceivable: 0,
        netPayable: 0,
      };
      map.set(region, group);
    }

    group.businessCount += 1;

    const result = calculateRow({
      normalPackages: entry.normalPackages,
      distantPackages: entry.distantPackages,
      bankCommission: entry.bankCommission,
      posBalance: entry.posBalance,
      cashBalance: entry.cashBalance,
      normalFee: business.normalFee,
      distantFee: business.distantFee,
      vat: business.vat,
    });

    group.totalPackages += result.totalPackages;
    if (result.netTotal >= 0) {
      group.netReceivable += result.netTotal;
    } else {
      group.netPayable += Math.abs(result.netTotal);
    }
  }

  return [...map.values()].sort((a, b) => a.region.localeCompare(b.region, 'tr'));
}
