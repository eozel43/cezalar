import React from 'react';
import { Search, X } from 'lucide-react';
import { CezaTuruFilter, EMPTY_FILTERS, Filters } from '../types';
import { parseDate, toIsoDate, formatNumber } from '../lib/format';
import { cn } from '../lib/utils';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  kabahatList: string[];
  dataEnd: string;
  totalCount: number;
  filteredCount: number;
}

const controlClass =
  'h-9 border border-neutral-300 rounded-md bg-white text-body text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400';

// Hızlı aralıklar verideki son tarihe göre hesaplanır
const QUICK_RANGES = [
  { label: 'Tümü', months: 0 },
  { label: 'Son 1 ay', months: 1 },
  { label: 'Son 3 ay', months: 3 },
  { label: 'Son 12 ay', months: 12 },
];

const rangeFor = (dataEnd: string, months: number) => {
  if (!months || !dataEnd) return { start: '', end: '' };
  const end = parseDate(dataEnd);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  start.setDate(start.getDate() + 1);
  return { start: toIsoDate(start), end: dataEnd };
};

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, kabahatList, dataEnd, totalCount, filteredCount }) => {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const activeQuick = QUICK_RANGES.find(r => {
    const range = rangeFor(dataEnd, r.months);
    return range.start === filters.start && range.end === filters.end;
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm px-4 py-3 mb-6 no-print">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            aria-label="Plaka, isim veya kabahat ara"
            placeholder="Plaka, isim veya kabahat ara"
            value={filters.searchTerm}
            onChange={e => set({ searchTerm: e.target.value })}
            className={cn(controlClass, 'w-full pl-9 pr-3 placeholder:text-neutral-400')}
          />
        </div>

        <select
          aria-label="Kabahat türü"
          value={filters.kabahat}
          onChange={e => set({ kabahat: e.target.value })}
          className={cn(controlClass, 'px-3 max-w-[260px]')}
        >
          <option value="">Tüm kabahat türleri</option>
          {kabahatList.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <select
          aria-label="Ceza türü"
          value={filters.cezaTuru}
          onChange={e => set({ cezaTuru: e.target.value as CezaTuruFilter })}
          className={cn(controlClass, 'px-3')}
        >
          <option value="">Tüm ceza türleri</option>
          <option value="para">Para cezası</option>
          <option value="men">Men cezası</option>
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            aria-label="Başlangıç tarihi"
            value={filters.start}
            max={filters.end || undefined}
            onChange={e => set({ start: e.target.value })}
            className={cn(controlClass, 'px-2')}
          />
          <span className="text-neutral-400">–</span>
          <input
            type="date"
            aria-label="Bitiş tarihi"
            value={filters.end}
            min={filters.start || undefined}
            onChange={e => set({ end: e.target.value })}
            className={cn(controlClass, 'px-2')}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <div className="inline-flex rounded-md border border-neutral-300 overflow-hidden" role="group" aria-label="Hızlı tarih aralığı">
          {QUICK_RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => set(rangeFor(dataEnd, r.months))}
              aria-pressed={activeQuick === r}
              className={cn(
                'h-7 px-3 text-body-sm transition-colors',
                i > 0 && 'border-l border-neutral-300',
                activeQuick === r ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-body-sm text-neutral-600">
          <span className="tabular-nums">
            <strong className="font-semibold text-neutral-900">{formatNumber(filteredCount)}</strong>
            {filteredCount !== totalCount && <> / {formatNumber(totalCount)}</>} kayıt
          </span>
          {isFiltered && (
            <button
              onClick={() => onChange(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
