import { Filters, Ozet, ParetoAnalizi, TopPlakaCeza, Varaka } from '../types';
import { parseDate, toIsoDate } from './format';

export const isMenCezasi = (v: Varaka) => v.ceza_turu === 'men' || v.ceza_miktari === 0;

export const calculateOzet = (varakalar: Varaka[]): Ozet => {
  const toplam_ceza_tutari = varakalar.reduce((sum, v) => sum + v.ceza_miktari, 0);
  const men_cezasi_sayisi = varakalar.filter(isMenCezasi).length;
  const perPlate = new Map<string, number>();
  varakalar.forEach(v => perPlate.set(v.plaka_no, (perPlate.get(v.plaka_no) || 0) + 1));
  return {
    toplam_sayisi: varakalar.length,
    toplam_ceza_tutari,
    ortalama_ceza: varakalar.length > 0 ? toplam_ceza_tutari / varakalar.length : 0,
    para_cezasi_sayisi: varakalar.length - men_cezasi_sayisi,
    men_cezasi_sayisi,
    arac_sayisi: perPlate.size,
    tekrar_eden_arac_sayisi: [...perPlate.values()].filter(n => n > 1).length,
  };
};

export const countBy = (varakalar: Varaka[], key: (v: Varaka) => string) => {
  const counts: Record<string, number> = {};
  varakalar.forEach(v => {
    const k = key(v);
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
};

export const calculatePareto = (varakalar: Varaka[]): ParetoAnalizi[] => {
  let cumulative = 0;
  return countBy(varakalar, v => v.kabahat).map(([kabahat, count]) => {
    const percentage = (count / varakalar.length) * 100;
    cumulative += percentage;
    return { kabahat, count, percentage, cumulative_percentage: cumulative };
  });
};

export const calculateTopPlates = (varakalar: Varaka[], limit = 5): TopPlakaCeza[] => {
  const plates: Record<string, { total: number; count: number; isim: string }> = {};
  varakalar.forEach(v => {
    if (!plates[v.plaka_no]) {
      plates[v.plaka_no] = { total: 0, count: 0, isim: v.isim };
    }
    plates[v.plaka_no].total += v.ceza_miktari;
    plates[v.plaka_no].count += 1;
  });

  return Object.entries(plates)
    .map(([plaka, s]) => ({
      plaka,
      isim: s.isim,
      toplam_ceza: s.total,
      ceza_sayisi: s.count,
      ortalama_ceza: Math.round(s.total / s.count),
    }))
    .sort((a, b) => b.ceza_sayisi - a.ceza_sayisi || b.toplam_ceza - a.toplam_ceza)
    .slice(0, limit);
};

// Tarih dışındaki filtreler (arama, kabahat, ceza türü)
const matchesNonDateFilters = (v: Varaka, f: Filters) => {
  if (f.searchTerm) {
    const q = f.searchTerm.toLocaleLowerCase('tr-TR');
    const hit =
      v.plaka_no.toLocaleLowerCase('tr-TR').includes(q) ||
      v.isim.toLocaleLowerCase('tr-TR').includes(q) ||
      v.kabahat.toLocaleLowerCase('tr-TR').includes(q);
    if (!hit) return false;
  }
  if (f.kabahat && v.kabahat !== f.kabahat) return false;
  if (f.cezaTuru === 'para' && isMenCezasi(v)) return false;
  if (f.cezaTuru === 'men' && !isMenCezasi(v)) return false;
  return true;
};

// Tarihler 'YYYY-MM-DD' biçiminde olduğu için metin karşılaştırması yeterli
const inRange = (v: Varaka, start: string, end: string) => {
  const t = v.tarih.slice(0, 10);
  return (!start || t >= start) && (!end || t <= end);
};

export const applyFilters = (varakalar: Varaka[], f: Filters) =>
  varakalar.filter(v => matchesNonDateFilters(v, f) && inRange(v, f.start, f.end));

// Seçili tarih aralığıyla aynı uzunluktaki bir önceki dönem
export const previousPeriod = (start: string, end: string) => {
  if (!start || !end) return null;
  const s = parseDate(start);
  const e = parseDate(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  if (days <= 0) return null;
  const prevEnd = new Date(s);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days + 1);
  return { start: toIsoDate(prevStart), end: toIsoDate(prevEnd) };
};

export const applyFiltersForPeriod = (varakalar: Varaka[], f: Filters, start: string, end: string) =>
  varakalar.filter(v => matchesNonDateFilters(v, f) && inRange(v, start, end));

export const percentChange = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;

export const dataPeriod = (varakalar: Varaka[]) => {
  if (!varakalar.length) return null;
  let min = varakalar[0].tarih.slice(0, 10);
  let max = min;
  let lastImport = '';
  varakalar.forEach(v => {
    const t = v.tarih.slice(0, 10);
    if (t < min) min = t;
    if (t > max) max = t;
    if (v.created_at && v.created_at > lastImport) lastImport = v.created_at;
  });
  return { start: min, end: max, lastImport };
};

const DAY_MS = 86400000;

// Days between consecutive fines of the same plate (one entry per repeat fine)
export const repeatGapDetails = (varakalar: Varaka[]) => {
  const byPlate = new Map<string, number[]>();
  varakalar.forEach(v => {
    const list = byPlate.get(v.plaka_no) || [];
    list.push(parseDate(v.tarih).getTime());
    byPlate.set(v.plaka_no, list);
  });

  const details: { plaka: string; gap: number }[] = [];
  byPlate.forEach((times, plaka) => {
    times.sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      details.push({ plaka, gap: Math.round((times[i] - times[i - 1]) / DAY_MS) });
    }
  });
  return details;
};

export const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export interface YearStats {
  year: number;
  count: number;
  avgFine: number | null; // para cezalarının ortalaması (men cezaları hariç)
  firstDate: string;
  lastDate: string;
}

export const yearlyStats = (varakalar: Varaka[]): YearStats[] => {
  const years = new Map<number, { count: number; paraSum: number; paraCount: number; firstDate: string; lastDate: string }>();
  varakalar.forEach(v => {
    const year = Number(v.tarih.slice(0, 4));
    const y = years.get(year) || { count: 0, paraSum: 0, paraCount: 0, firstDate: '9999', lastDate: '' };
    y.count += 1;
    if (!isMenCezasi(v)) {
      y.paraSum += v.ceza_miktari;
      y.paraCount += 1;
    }
    if (v.tarih < y.firstDate) y.firstDate = v.tarih.slice(0, 10);
    if (v.tarih > y.lastDate) y.lastDate = v.tarih.slice(0, 10);
    years.set(year, y);
  });

  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, y]) => ({
      year,
      count: y.count,
      avgFine: y.paraCount ? y.paraSum / y.paraCount : null,
      firstDate: y.firstDate,
      lastDate: y.lastDate,
    }));
};
