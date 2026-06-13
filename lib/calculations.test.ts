import { describe, expect, it } from 'vitest';
import { calculateRow, calculateRowForSave, getNetTotalLabel, parseFloatOrZero } from './calculations';

describe('parseFloatOrZero', () => {
  it('returns 0 for empty values', () => {
    expect(parseFloatOrZero(null)).toBe(0);
    expect(parseFloatOrZero(undefined)).toBe(0);
    expect(parseFloatOrZero('')).toBe(0);
  });

  it('parses valid numbers', () => {
    expect(parseFloatOrZero('10.5')).toBe(10.5);
    expect(parseFloatOrZero(25)).toBe(25);
  });
});

describe('calculateRow', () => {
  it('returns all zeros when all fields are empty', () => {
    const result = calculateRow({});
    expect(result).toEqual({
      totalPackages: 0,
      hakedis: 0,
      vatAmount: 0,
      totalWithVat: 0,
      netTotal: 0,
    });
  });

  it('matches manual calculation for sample scenario', () => {
    // NP=10, NF=25, DP=5, DF=35, KDV=20, BK=100, POS=500, NAKIT=200
    const result = calculateRow({
      normalPackages: 10,
      normalFee: 25,
      distantPackages: 5,
      distantFee: 35,
      vat: 20,
      bankCommission: 100,
      posBalance: 500,
      cashBalance: 200,
    });

    // hakedis = 10*25 + 5*35 = 250 + 175 = 425
    expect(result.hakedis).toBe(425);
    // kdv = 425 * 0.2 = 85
    expect(result.vatAmount).toBe(85);
    // toplam = 510
    expect(result.totalWithVat).toBe(510);
    // net = 510 + 100 - 500 - 200 = -90
    expect(result.netTotal).toBe(-90);
    expect(result.totalPackages).toBe(15);
  });
});

describe('getNetTotalLabel', () => {
  it('uses SİZE ÖDEYECEĞİMİZ for negative net', () => {
    const { label, displayAmount } = getNetTotalLabel(-90);
    expect(label).toBe('SİZE ÖDEYECEĞİMİZ Tutar');
    expect(displayAmount).toBe(90);
  });

  it('uses TARAFIMIZA ÖDEYECEĞİZ for positive net', () => {
    const { label, displayAmount } = getNetTotalLabel(150);
    expect(label).toBe('TARAFIMIZA ÖDEYECEĞİZ Tutar');
    expect(displayAmount).toBe(150);
  });

  it('uses TARAFIMIZA ÖDEYECEĞİZ for zero net', () => {
    const { label, displayAmount } = getNetTotalLabel(0);
    expect(label).toBe('TARAFIMIZA ÖDEYECEĞİZ Tutar');
    expect(displayAmount).toBe(0);
  });
});

describe('calculateRowForSave', () => {
  it('rounds monetary fields to 2 decimal places', () => {
    const result = calculateRowForSave({
      normalPackages: 3,
      normalFee: 10.333,
      distantPackages: 0,
      distantFee: 0,
      vat: 20,
      bankCommission: 0,
      posBalance: 0,
      cashBalance: 0,
    });
    expect(result.hakedis).toBe(31);
    expect(result.vatAmount).toBe(6.2);
    expect(result.totalWithVat).toBe(37.2);
    expect(result.netTotal).toBe(37.2);
  });
});
