import type {
  Business,
  LegacySavedReport,
  PaymentStatus,
  QuotaStatus,
  SavedReport,
  TableEntry,
} from '../types';
import { createDefaultTableEntry } from '../types';
import { DEFAULT_REGIONS } from '../seed-data';
import { createSeedBusinesses, mergeSeedWithExisting } from '../seed-data';

type DbBusiness = {
  id: string;
  name: string;
  normal_fee: number;
  distant_fee: number;
  vat: number;
  region: string;
};

type DbTableEntry = {
  business_id: string;
  normal_packages: number;
  distant_packages: number;
  bank_commission: number;
  pos_balance: number;
  cash_balance: number;
  payment_status: string;
  has_quota: string;
  notes: string;
};

type DbSavedReport = {
  id: string;
  business_id: string | null;
  business_name: string;
  business_region: string | null;
  hesap_tarihi: string | null;
  normal_packages: number;
  distant_packages: number;
  total_packages: number;
  normal_fee_at_save: number;
  distant_fee_at_save: number;
  vat_rate_at_save: number;
  hakedis: number;
  vat_amount: number;
  total_with_vat: number;
  bank_commission: number;
  pos_balance: number;
  cash_balance: number;
  net_total: number;
  payment_status: string;
  has_quota: string;
  notes: string;
  saved_at: string;
};

type DbRegion = {
  id: number;
  name: string;
  sort_order: number;
};

function mapBusiness(row: DbBusiness): Business {
  return {
    id: row.id,
    name: row.name,
    normalFee: Number(row.normal_fee),
    distantFee: Number(row.distant_fee),
    vat: Number(row.vat),
    region: row.region,
  };
}

function mapTableEntry(row: DbTableEntry): TableEntry {
  return {
    businessId: row.business_id,
    normalPackages: Number(row.normal_packages),
    distantPackages: Number(row.distant_packages),
    bankCommission: Number(row.bank_commission),
    posBalance: Number(row.pos_balance),
    cashBalance: Number(row.cash_balance),
    paymentStatus: row.payment_status as PaymentStatus,
    hasQuota: row.has_quota as QuotaStatus,
    notes: row.notes ?? '',
  };
}

function mapSavedReport(row: DbSavedReport): SavedReport {
  return {
    id: row.id,
    businessId: row.business_id ?? '',
    businessName: row.business_name,
    businessRegion: row.business_region ?? '',
    hesapTarihi: row.hesap_tarihi ?? '',
    normalPackages: Number(row.normal_packages),
    distantPackages: Number(row.distant_packages),
    totalPackages: Number(row.total_packages),
    normalFeeAtSave: Number(row.normal_fee_at_save),
    distantFeeAtSave: Number(row.distant_fee_at_save),
    vatRateAtSave: Number(row.vat_rate_at_save),
    hakedis: Number(row.hakedis),
    vatAmount: Number(row.vat_amount),
    totalWithVat: Number(row.total_with_vat),
    bankCommission: Number(row.bank_commission),
    posBalance: Number(row.pos_balance),
    cashBalance: Number(row.cash_balance),
    netTotal: Number(row.net_total),
    paymentStatus: row.payment_status,
    hasQuota: row.has_quota,
    notes: row.notes ?? '',
    savedAt: row.saved_at,
  };
}

function tableEntryToDb(entry: TableEntry): Omit<DbTableEntry, 'business_id'> & { business_id: string } {
  return {
    business_id: entry.businessId,
    normal_packages: entry.normalPackages,
    distant_packages: entry.distantPackages,
    bank_commission: entry.bankCommission,
    pos_balance: entry.posBalance,
    cash_balance: entry.cashBalance,
    payment_status: entry.paymentStatus,
    has_quota: entry.hasQuota,
    notes: entry.notes,
  };
}

function businessToDb(b: Business): DbBusiness {
  return {
    id: b.id,
    name: b.name,
    normal_fee: b.normalFee,
    distant_fee: b.distantFee,
    vat: b.vat,
    region: b.region,
  };
}

function savedReportToDb(r: SavedReport): DbSavedReport {
  return {
    id: r.id,
    business_id: r.businessId,
    business_name: r.businessName,
    business_region: r.businessRegion,
    hesap_tarihi: r.hesapTarihi || null,
    normal_packages: r.normalPackages,
    distant_packages: r.distantPackages,
    total_packages: r.totalPackages,
    normal_fee_at_save: r.normalFeeAtSave,
    distant_fee_at_save: r.distantFeeAtSave,
    vat_rate_at_save: r.vatRateAtSave,
    hakedis: r.hakedis,
    vat_amount: r.vatAmount,
    total_with_vat: r.totalWithVat,
    bank_commission: r.bankCommission,
    pos_balance: r.posBalance,
    cash_balance: r.cashBalance,
    net_total: r.netTotal,
    payment_status: r.paymentStatus,
    has_quota: r.hasQuota,
    notes: r.notes,
    saved_at: r.savedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export async function fetchBusinesses(supabase: SupabaseClient): Promise<Business[]> {
  const { data, error } = await supabase.from('businesses').select('*').order('name');
  if (error) throw error;
  return (data as DbBusiness[]).map(mapBusiness);
}

export async function fetchTableEntries(supabase: SupabaseClient): Promise<Record<string, TableEntry>> {
  const { data, error } = await supabase.from('table_entries').select('*');
  if (error) throw error;
  const map: Record<string, TableEntry> = {};
  (data as DbTableEntry[]).forEach((row) => {
    map[row.business_id] = mapTableEntry(row);
  });
  return map;
}

export async function fetchRegions(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('sort_order')
    .order('name');
  if (error) throw error;
  if (!data || data.length === 0) return [...DEFAULT_REGIONS];
  return (data as DbRegion[]).map((r) => r.name);
}

export async function fetchHesapTarihi(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'hesap_tarihi')
    .maybeSingle();
  if (error) throw error;
  if (!data?.value) return null;
  return typeof data.value === 'string' ? data.value : String(data.value).replace(/"/g, '');
}

export async function fetchSavedReports(supabase: SupabaseClient): Promise<SavedReport[]> {
  const { data, error } = await supabase
    .from('saved_reports')
    .select('*')
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data as DbSavedReport[]).map(mapSavedReport);
}

export async function ensureInitialData(supabase: SupabaseClient): Promise<void> {
  const { count, error: countError } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;
  if (count && count > 0) return;

  const seed = createSeedBusinesses();
  const { error: bizError } = await supabase.from('businesses').insert(seed.map(businessToDb));
  if (bizError) throw bizError;

  const entries = seed.map((b) => {
    const entry = createDefaultTableEntry(b.id);
    return tableEntryToDb(entry);
  });
  const { error: entryError } = await supabase.from('table_entries').insert(entries);
  if (entryError) throw entryError;

  const regions = DEFAULT_REGIONS.map((name, i) => ({ name, sort_order: i }));
  const { error: regionError } = await supabase.from('regions').insert(regions);
  if (regionError) throw regionError;
}

export async function upsertBusiness(supabase: SupabaseClient, business: Business): Promise<void> {
  const { error } = await supabase.from('businesses').upsert(businessToDb(business));
  if (error) throw error;

  const { data: existing } = await supabase
    .from('table_entries')
    .select('business_id')
    .eq('business_id', business.id)
    .maybeSingle();

  if (!existing) {
    const entry = createDefaultTableEntry(business.id);
    const { error: entryError } = await supabase.from('table_entries').insert(tableEntryToDb(entry));
    if (entryError) throw entryError;
  }
}

export async function deleteBusiness(supabase: SupabaseClient, businessId: string): Promise<void> {
  const { error } = await supabase.from('businesses').delete().eq('id', businessId);
  if (error) throw error;
}

export async function upsertTableEntry(supabase: SupabaseClient, entry: TableEntry): Promise<void> {
  const { error } = await supabase.from('table_entries').upsert(tableEntryToDb(entry));
  if (error) throw error;
}

export async function saveHesapTarihi(supabase: SupabaseClient, date: string): Promise<void> {
  const { error } = await supabase.from('app_settings').upsert({
    key: 'hesap_tarihi',
    value: date,
  });
  if (error) throw error;
}

export async function addRegion(supabase: SupabaseClient, name: string): Promise<void> {
  const { error } = await supabase.from('regions').insert({ name, sort_order: 999 });
  if (error) throw error;
}

export async function insertSavedReport(supabase: SupabaseClient, report: SavedReport): Promise<void> {
  const { error } = await supabase.from('saved_reports').insert(savedReportToDb(report));
  if (error) throw error;
}

export async function deleteSavedReport(supabase: SupabaseClient, reportId: string): Promise<void> {
  const { error } = await supabase.from('saved_reports').delete().eq('id', reportId);
  if (error) throw error;
}

export function legacyReportToSavedReport(
  report: LegacySavedReport,
  business?: Business,
): SavedReport {
  return {
    id: report.reportId,
    businessId: report.businessId,
    businessName: report.businessName,
    businessRegion: report.businessRegion,
    hesapTarihi: report.hesapTarihi,
    normalPackages: report.normalPackages,
    distantPackages: report.distantPackages,
    totalPackages: report.totalPackages,
    normalFeeAtSave:
      report.normalPackageFeeAtSave ?? business?.normalFee ?? 0,
    distantFeeAtSave:
      report.distantPackageFeeAtSave ?? business?.distantFee ?? 0,
    vatRateAtSave: report.vatRateAtSave ?? business?.vat ?? 0,
    hakedis: report.hakedis,
    vatAmount: report.vatAmount,
    totalWithVat: report.totalWithVat,
    bankCommission: report.bankCommission,
    posBalance: report.posBalance,
    cashBalance: report.cashBalance,
    netTotal: report.netTotal,
    paymentStatus: report.paymentStatus,
    hasQuota: report.hasQuota,
    notes: report.notes,
    savedAt: report.savedAt,
  };
}

export async function importBackupData(
  supabase: SupabaseClient,
  backup: {
    businesses: Business[];
    tableData: Record<string, Omit<TableEntry, 'businessId'>>;
    savedReports: LegacySavedReport[];
    regions: string[];
  },
): Promise<void> {
  await supabase.from('saved_reports').delete().neq('id', '');
  await supabase.from('table_entries').delete().neq('business_id', '');
  await supabase.from('businesses').delete().neq('id', '');
  await supabase.from('regions').delete().neq('id', 0);

  if (backup.businesses.length > 0) {
    const { error } = await supabase.from('businesses').insert(backup.businesses.map(businessToDb));
    if (error) throw error;
  } else {
    const merged = mergeSeedWithExisting([], createSeedBusinesses());
    const { error } = await supabase.from('businesses').insert(merged.map(businessToDb));
    if (error) throw error;
    backup.businesses = merged;
  }

  const entries = Object.entries(backup.tableData).map(([businessId, data]) =>
    tableEntryToDb({ businessId, ...data }),
  );
  if (entries.length > 0) {
    const { error } = await supabase.from('table_entries').insert(entries);
    if (error) throw error;
  }

  const businessMap = Object.fromEntries(backup.businesses.map((b) => [b.id, b]));
  const reports = backup.savedReports.map((r) =>
    savedReportToDb(legacyReportToSavedReport(r, businessMap[r.businessId])),
  );
  if (reports.length > 0) {
    const { error } = await supabase.from('saved_reports').insert(reports);
    if (error) throw error;
  }

  const regions = backup.regions.length > 0 ? backup.regions : [...DEFAULT_REGIONS];
  const { error: regionError } = await supabase
    .from('regions')
    .insert(regions.map((name, i) => ({ name, sort_order: i })));
  if (regionError) throw regionError;
}

export { mapBusiness, mapTableEntry, mapSavedReport, businessToDb, savedReportToDb };
