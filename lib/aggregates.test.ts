import { describe, expect, it } from 'vitest';
import { computeDashboardTotals, groupByRegion } from './aggregates';
import { createDefaultTableEntry } from './types';
import type { Business } from './types';

const bizA: Business = {
  id: 'a',
  name: 'Test A',
  normalFee: 25,
  distantFee: 35,
  vat: 20,
  region: 'İskele',
};

const bizB: Business = {
  id: 'b',
  name: 'Test B',
  normalFee: 10,
  distantFee: 10,
  vat: 0,
  region: 'Barbaros',
};

describe('computeDashboardTotals', () => {
  it('returns zeros for empty rows', () => {
    const t = computeDashboardTotals([]);
    expect(t.businessCount).toBe(0);
    expect(t.totalHakedis).toBe(0);
    expect(t.netReceivable).toBe(0);
    expect(t.netPayable).toBe(0);
  });

  it('aggregates two businesses with positive and negative net', () => {
    const entryA = {
      ...createDefaultTableEntry('a'),
      normalPackages: 10,
      distantPackages: 5,
      bankCommission: 100,
      posBalance: 500,
      cashBalance: 200,
      paymentStatus: 'Odenmedi' as const,
    };
    const entryB = {
      ...createDefaultTableEntry('b'),
      normalPackages: 2,
      distantPackages: 0,
      bankCommission: 0,
      posBalance: 0,
      cashBalance: 0,
      paymentStatus: 'Odendi' as const,
      hasQuota: 'Var' as const,
    };

    const t = computeDashboardTotals([
      { business: bizA, entry: entryA },
      { business: bizB, entry: entryB },
    ]);

    // A: hakedis 425, net -90
    expect(t.totalHakedis).toBe(425 + 20);
    expect(t.netPayable).toBe(90);
    expect(t.netReceivable).toBe(20);
    expect(t.paymentCounts.Odenmedi).toBe(1);
    expect(t.paymentCounts.Odendi).toBe(1);
    expect(t.quotaCount).toBe(1);
    expect(t.withDataCount).toBe(2);
  });
});

describe('groupByRegion', () => {
  it('groups net totals by region', () => {
    const groups = groupByRegion([
      {
        business: bizA,
        entry: {
          ...createDefaultTableEntry('a'),
          normalPackages: 10,
          bankCommission: 100,
          posBalance: 500,
          cashBalance: 200,
        },
      },
      {
        business: bizB,
        entry: { ...createDefaultTableEntry('b'), normalPackages: 5 },
      },
    ]);

    expect(groups.length).toBe(2);
    const iskele = groups.find((g) => g.region === 'İskele');
    const barbaros = groups.find((g) => g.region === 'Barbaros');
    expect(iskele?.netPayable).toBe(300);
    expect(barbaros?.netReceivable).toBe(50);
  });
});
