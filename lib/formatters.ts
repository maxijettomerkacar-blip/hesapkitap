export function formatCurrency(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0.00';
  }
  return amount.toFixed(2);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return '-';
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTimeString;
  }
}

export function generateId(): string {
  return '_' + Math.random().toString(36).substring(2, 11);
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
