const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('tr-TR');

export const formatCurrency = (amount: number) => currencyFormatter.format(amount);

export const formatNumber = (value: number) => numberFormatter.format(value);

export const formatPercent = (value: number, digits = 1) =>
  `%${value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

// 'YYYY-MM-DD' değerlerini yerel tarih olarak yorumlar (UTC kayması olmadan)
export const parseDate = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDate = (value: string) => parseDate(value).toLocaleDateString('tr-TR');

export const formatLongDate = (value: string) =>
  parseDate(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
