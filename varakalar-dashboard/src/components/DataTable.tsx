import React, { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, FileSpreadsheet, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Varaka, SortConfig } from '../types';
import { formatCurrency, formatDate, formatNumber, toIsoDate } from '../lib/format';
import { isMenCezasi } from '../lib/stats';
import { Card, CardHeader, Button, EmptyState } from './ui';
import { cn } from '../lib/utils';

const PAGE_SIZES = [25, 50, 100];

const COLUMNS: { key: keyof Varaka; label: string; align?: 'right' }[] = [
  { key: 'sira_no', label: 'Sıra' },
  { key: 'tarih', label: 'Tarih' },
  { key: 'plaka_no', label: 'Plaka' },
  { key: 'isim', label: 'Ad Soyad' },
  { key: 'kabahat', label: 'Kabahat' },
  { key: 'ceza_miktari', label: 'Ceza', align: 'right' },
];

const exportToExcel = async (rows: Varaka[]) => {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.json_to_sheet(
    rows.map(v => ({
      'Sıra No': v.sira_no,
      Tarih: formatDate(v.tarih),
      Gün: v.gun,
      'Plaka No': v.plaka_no,
      'Ad Soyad': v.isim,
      Kabahat: v.kabahat,
      'Ceza Türü': isMenCezasi(v) ? 'Men' : 'Para',
      'Ceza Tutarı (TL)': v.ceza_miktari,
      Açıklama: v.ceza_detay || '',
    }))
  );
  sheet['!cols'] = [6, 11, 10, 12, 24, 44, 10, 14, 24].map(wch => ({ wch }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Varakalar');
  XLSX.writeFile(book, `varakalar_${toIsoDate(new Date())}.xlsx`);
};

const DataTable: React.FC<{ data: Varaka[] }> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'tarih', direction: 'desc' });
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [printing, setPrinting] = useState(false);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'tr-TR') * dir;
    });
  }, [data, sortConfig]);

  // Filters changed: go back to the first page
  useEffect(() => setPage(0), [data, pageSize]);

  // Print every row, not just the current page
  useEffect(() => {
    if (!printing) return undefined;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    const id = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('afterprint', done);
    };
  }, [printing]);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const visible = printing ? sortedData : sortedData.slice(page * pageSize, (page + 1) * pageSize);
  const toplamTutar = useMemo(() => data.reduce((s, v) => s + v.ceza_miktari, 0), [data]);

  const handleSort = (key: keyof Varaka) =>
    setSortConfig(current =>
      current?.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );

  const handleExport = async () => {
    try {
      await exportToExcel(sortedData);
      toast.success(`${formatNumber(sortedData.length)} kayıt Excel dosyasına aktarıldı`);
    } catch {
      toast.error('Excel dosyası oluşturulamadı');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Varaka Kayıtları"
        description={`${formatNumber(data.length)} kayıt · Toplam ${formatCurrency(toplamTutar)}`}
        actions={
          <>
            <Button size="sm" onClick={handleExport} disabled={!data.length}>
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button size="sm" onClick={() => setPrinting(true)} disabled={!data.length}>
              <Printer className="w-4 h-4" />
              Yazdır / PDF
            </Button>
          </>
        }
      />

      {data.length === 0 ? (
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" description="Filtreleri değiştirerek tekrar deneyin." />
      ) : (
        <div className="overflow-auto max-h-[calc(100vh-260px)] min-h-[300px] print:max-h-none print:overflow-visible">
          <table className="w-full text-body">
            <thead className="sticky top-0 z-10 bg-neutral-50 print:static">
              <tr className="border-b border-neutral-200">
                {COLUMNS.map(col => {
                  const active = sortConfig?.key === col.key;
                  const Icon = !active ? ChevronsUpDown : sortConfig.direction === 'asc' ? ChevronUp : ChevronDown;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={cn(
                        'px-4 py-2.5 text-caption font-semibold uppercase tracking-wide text-neutral-600 whitespace-nowrap',
                        col.align === 'right' ? 'text-right' : 'text-left'
                      )}
                    >
                      <button
                        onClick={() => handleSort(col.key)}
                        className={cn('inline-flex items-center gap-1 hover:text-neutral-900', col.align === 'right' && 'flex-row-reverse')}
                      >
                        {col.label}
                        <Icon className={cn('w-3.5 h-3.5 no-print', active ? 'text-neutral-700' : 'text-neutral-300')} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((v, i) => (
                <tr key={v.id ?? `${v.sira_no}-${i}`} className="border-b border-neutral-100 even:bg-neutral-50/60 hover:bg-primary-50/50">
                  <td className="px-4 py-2 text-neutral-500 tabular-nums">{v.sira_no}</td>
                  <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                    {formatDate(v.tarih)}
                    <span className="block text-caption text-neutral-500">{v.gun}</span>
                  </td>
                  <td className="px-4 py-2 font-medium text-neutral-900 whitespace-nowrap">{v.plaka_no}</td>
                  <td className="px-4 py-2 text-neutral-700 whitespace-nowrap">{v.isim}</td>
                  <td className="px-4 py-2 text-neutral-700 max-w-[360px]">
                    <span className="block truncate print:whitespace-normal" title={v.kabahat}>
                      {v.kabahat}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap tabular-nums">
                    {isMenCezasi(v) ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-caption font-medium text-semantic-warning"
                        title={v.ceza_detay || 'Men cezası'}
                      >
                        {v.ceza_detay || 'Men cezası'}
                      </span>
                    ) : (
                      formatCurrency(v.ceza_miktari)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-neutral-200 text-body-sm text-neutral-600 no-print">
          <div className="flex items-center gap-2">
            <label htmlFor="page-size">Sayfa başına</label>
            <select
              id="page-size"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="h-8 px-2 border border-neutral-300 rounded-md bg-white"
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums">
              {formatNumber(page * pageSize + 1)}–{formatNumber(Math.min((page + 1) * pageSize, sortedData.length))} / {formatNumber(sortedData.length)}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" className="px-2" onClick={() => setPage(p => p - 1)} disabled={page === 0} aria-label="Önceki sayfa">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="px-2" onClick={() => setPage(p => p + 1)} disabled={page >= pageCount - 1} aria-label="Sonraki sayfa">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DataTable;
