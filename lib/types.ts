export type PaymentStatus = 'Odenmedi' | 'Odendi' | 'Kismi Odeme';
export type QuotaStatus = 'Yok' | 'Var';

export interface Business {
  id: string;
  name: string;
  normalFee: number;
  distantFee: number;
  vat: number;
  region: string;
}

export interface TableEntry {
  businessId: string;
  normalPackages: number;
  distantPackages: number;
  bankCommission: number;
  posBalance: number;
  cashBalance: number;
  paymentStatus: PaymentStatus;
  hasQuota: QuotaStatus;
  notes: string;
}

export interface CalculationInput {
  normalPackages: number | string | null | undefined;
  distantPackages: number | string | null | undefined;
  bankCommission: number | string | null | undefined;
  posBalance: number | string | null | undefined;
  cashBalance: number | string | null | undefined;
  normalFee: number | string | null | undefined;
  distantFee: number | string | null | undefined;
  vat: number | string | null | undefined;
}

export interface CalculationResult {
  totalPackages: number;
  hakedis: number;
  vatAmount: number;
  totalWithVat: number;
  netTotal: number;
}

export interface SavedReport {
  id: string;
  businessId: string;
  businessName: string;
  businessRegion: string;
  hesapTarihi: string;
  normalPackages: number;
  distantPackages: number;
  totalPackages: number;
  normalFeeAtSave: number;
  distantFeeAtSave: number;
  vatRateAtSave: number;
  hakedis: number;
  vatAmount: number;
  totalWithVat: number;
  bankCommission: number;
  posBalance: number;
  cashBalance: number;
  netTotal: number;
  paymentStatus: PaymentStatus | string;
  hasQuota: QuotaStatus | string;
  notes: string;
  savedAt: string;
}

export interface BackupData {
  app: string;
  version: string;
  date?: string;
  data: {
    businesses: Business[];
    tableData: Record<string, Omit<TableEntry, 'businessId'>>;
    savedReports: LegacySavedReport[];
    regions: string[];
  };
}

/** Legacy localStorage report shape (may lack fee snapshot fields) */
export interface LegacySavedReport {
  reportId: string;
  businessId: string;
  businessName: string;
  businessRegion: string;
  hesapTarihi: string;
  normalPackages: number;
  distantPackages: number;
  totalPackages: number;
  normalPackageFeeAtSave?: number;
  distantPackageFeeAtSave?: number;
  vatRateAtSave?: number;
  hakedis: number;
  vatAmount: number;
  totalWithVat: number;
  bankCommission: number;
  posBalance: number;
  cashBalance: number;
  netTotal: number;
  paymentStatus: string;
  hasQuota: string;
  notes: string;
  savedAt: string;
}

export interface Region {
  id: number;
  name: string;
  sortOrder: number;
}

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['Odenmedi', 'Odendi', 'Kismi Odeme'];
export const QUOTA_STATUS_OPTIONS: QuotaStatus[] = ['Yok', 'Var'];
export const DEFAULT_PAYMENT_STATUS: PaymentStatus = 'Odenmedi';
export const DEFAULT_QUOTA_STATUS: QuotaStatus = 'Yok';

export function createDefaultTableEntry(businessId: string): TableEntry {
  return {
    businessId,
    normalPackages: 0,
    distantPackages: 0,
    bankCommission: 0,
    posBalance: 0,
    cashBalance: 0,
    paymentStatus: DEFAULT_PAYMENT_STATUS,
    hasQuota: DEFAULT_QUOTA_STATUS,
    notes: '',
  };
}
