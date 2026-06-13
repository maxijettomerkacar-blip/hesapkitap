/**
 * Tek hesaplama kaynağı — rules/core_calculations.md ile birebir uyumlu.
 * Formül değişikliği yasaktır.
 */
import type { CalculationInput, CalculationResult } from './types';

export function parseFloatOrZero(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateRow(input: CalculationInput): CalculationResult {
  const np = parseFloatOrZero(input.normalPackages);
  const dp = parseFloatOrZero(input.distantPackages);
  const bk = parseFloatOrZero(input.bankCommission);
  const pos = parseFloatOrZero(input.posBalance);
  const nakit = parseFloatOrZero(input.cashBalance);
  const nf = parseFloatOrZero(input.normalFee);
  const df = parseFloatOrZero(input.distantFee);
  const vatRate = parseFloatOrZero(input.vat);

  const hakedis = np * nf + dp * df;
  const vatAmount = hakedis * (vatRate / 100);
  const totalWithVat = hakedis + vatAmount;
  const netTotal = totalWithVat + bk - pos - nakit;

  return {
    totalPackages: np + dp,
    hakedis,
    vatAmount,
    totalWithVat,
    netTotal,
  };
}

/** Kayıt anında yuvarlama — rules/PROJECT_RULES.md */
export function roundForSave(value: number): number {
  return parseFloat(value.toFixed(2));
}

export function calculateRowForSave(input: CalculationInput): CalculationResult {
  const result = calculateRow(input);
  return {
    totalPackages: result.totalPackages,
    hakedis: roundForSave(result.hakedis),
    vatAmount: roundForSave(result.vatAmount),
    totalWithVat: roundForSave(result.totalWithVat),
    netTotal: roundForSave(result.netTotal),
  };
}

export function getNetTotalLabel(netTotal: number): { label: string; displayAmount: number } {
  if (netTotal < 0) {
    return {
      label: 'SİZE ÖDEYECEĞİMİZ Tutar',
      displayAmount: Math.abs(netTotal),
    };
  }
  return {
    label: 'TARAFIMIZA ÖDEYECEĞİZ Tutar',
    displayAmount: netTotal,
  };
}
