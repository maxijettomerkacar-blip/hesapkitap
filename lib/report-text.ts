import { getNetTotalLabel } from './calculations';
import { formatCurrency, formatDateTime } from './formatters';
import type { Business, PaymentStatus, SavedReport, TableEntry } from './types';

export interface ReportTextOptions {
  business: Pick<Business, 'name' | 'region' | 'vat'>;
  entry: Pick<
    TableEntry,
    | 'normalPackages'
    | 'distantPackages'
    | 'bankCommission'
    | 'posBalance'
    | 'cashBalance'
    | 'paymentStatus'
    | 'notes'
  >;
  hesapTarihi: string;
  hakedis: number;
  vatAmount: number;
  totalWithVat: number;
  netTotal: number;
  totalPackages: number;
  cancelledPackages?: number;
  isSavedReport?: boolean;
  savedAt?: string;
}

export function buildReportText(options: ReportTextOptions): string {
  const {
    business,
    entry,
    hesapTarihi,
    hakedis,
    vatAmount,
    totalWithVat,
    netTotal,
    totalPackages,
    cancelledPackages = 0,
    isSavedReport = false,
    savedAt,
  } = options;

  const reportDateFormatted = hesapTarihi
    ? new Date(hesapTarihi).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Belirtilmedi';

  const titleSuffix = isSavedReport ? ' (Kayıt)' : '';
  let reportString = `📊 *${business.name} - Hakediş Raporu${titleSuffix}* 📊\n`;
  reportString += `-----------------------------------\n`;
  reportString += `🗓️ *Hesap Tarihi:* ${reportDateFormatted}\n`;
  if (isSavedReport && savedAt) {
    reportString += `💾 *Kayıt Tarihi:* ${formatDateTime(savedAt)}\n`;
  }
  reportString += `📍 *Bölge:* ${business.region}\n`;
  reportString += `📦 *Paket Bilgileri:*\n`;
  reportString += `   ▫️ Sistem Paketi: ${entry.normalPackages} adet\n`;
  reportString += `   ▫️ Uzak ve İlave Paketler: ${entry.distantPackages} adet\n`;
  reportString += `   ▪️ *Toplam Teslim Edilen:* ${totalPackages} adet\n`;
  if (cancelledPackages > 0) {
    reportString += `   🚫 *İptal Edilen Paket:* ${cancelledPackages} adet\n`;
  }
  reportString += `-----------------------------------\n`;
  reportString += `💰 *Hakediş Detayları:*\n`;
  reportString += `   ▫️ Paketlerden Hakediş (KDV Hariç): ${formatCurrency(hakedis)} ₺\n`;
  reportString += `   ▫️ KDV Tutarı (%${business.vat}): ${formatCurrency(vatAmount)} ₺\n`;
  reportString += `   ▪️ *KDV Dahil Toplam Hakediş:* ${formatCurrency(totalWithVat)} ₺\n`;
  reportString += `-----------------------------------\n`;
  reportString += `⚙️ *Ek İşlemler & Mahsuplaşma:*\n`;
  reportString += `   ➕ Banka Pos Komisyonu (İşletmeye Yansıtılan): ${formatCurrency(entry.bankCommission)} ₺\n`;
  reportString += `   ➖ İşletmenin Bizdeki POS Bakiyesi: ${formatCurrency(entry.posBalance)} ₺\n`;
  reportString += `   ➖ İşletmenin Bizdeki Nakit Bakiyesi: ${formatCurrency(entry.cashBalance)} ₺\n`;
  reportString += `-----------------------------------\n`;

  const { label, displayAmount } = getNetTotalLabel(netTotal);
  const prefix = netTotal < 0 ? '✅' : '⚠️';
  reportString += `${prefix} *${label}:* ${formatCurrency(displayAmount)} ₺\n`;
  reportString += `-----------------------------------\n`;
  reportString += `💳 *Ödeme Durumu:* ${entry.paymentStatus || 'Belirtilmedi'}\n`;
  if (entry.notes && entry.notes !== '-') {
    reportString += `📝 *Açıklamalar:* ${entry.notes}\n`;
  }
  reportString += `\nİyi çalışmalar dileriz! ✨`;

  return reportString;
}

export function buildReportTextFromSaved(report: SavedReport): string {
  return buildReportText({
    business: {
      name: report.businessName,
      region: report.businessRegion,
      vat: report.vatRateAtSave,
    },
    entry: {
      normalPackages: report.normalPackages,
      distantPackages: report.distantPackages,
      bankCommission: report.bankCommission,
      posBalance: report.posBalance,
      cashBalance: report.cashBalance,
      paymentStatus: (report.paymentStatus || 'Belirtilmedi') as PaymentStatus,
      notes: report.notes || '-',
    },
    hesapTarihi: report.hesapTarihi,
    hakedis: report.hakedis,
    vatAmount: report.vatAmount,
    totalWithVat: report.totalWithVat,
    netTotal: report.netTotal,
    totalPackages: report.totalPackages,
    cancelledPackages: 0,
    isSavedReport: true,
    savedAt: report.savedAt,
  });
}
