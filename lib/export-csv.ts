import type { Motor, MotorMaintenance } from './types';

function escapeCsv(value: string | number | null | undefined): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportMotorsCsv(motors: Motor[]): string {
  const headers = [
    'Plaka',
    'Marka',
    'Model',
    'Kurye',
    'Bölge',
    'Muayene',
    'Sigorta',
    'Durum',
    'Km',
  ];
  const rows = motors.map((m) =>
    [
      m.plate,
      m.brand,
      m.model,
      m.courierName ?? '',
      m.region,
      m.inspectionDate ?? '',
      m.insuranceExpiry ?? '',
      m.status,
      m.odometerKm,
    ]
      .map(escapeCsv)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportMaintenanceCsv(records: MotorMaintenance[], plate: string): string {
  const headers = ['Plaka', 'Tarih', 'Tür', 'Maliyet', 'Km', 'Açıklama', 'Sonraki Tarih'];
  const rows = records.map((r) =>
    [plate, r.serviceDate, r.serviceType, r.cost, r.odometerKm, r.description, r.nextDueDate ?? '']
      .map(escapeCsv)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
