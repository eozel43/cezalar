import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Varaka } from '../types';
import { calculateTopPlates } from '../lib/stats';
import { formatCurrency, formatNumber } from '../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from './ui';

interface TopPlatesTableProps {
  varakalar: Varaka[];
  onSelect: (plaka: string) => void;
}

const TopPlatesTable: React.FC<TopPlatesTableProps> = ({ varakalar, onSelect }) => {
  const rows = useMemo(() => calculateTopPlates(varakalar, 5), [varakalar]);

  return (
    <Card className="flex flex-col">
      <CardHeader title="En Çok Varaka Düzenlenen Araçlar" description="Varaka sayısına göre ilk 5 plaka" />
      {rows.length === 0 ? (
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" />
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-body">
            <thead>
              <tr className="text-left text-caption font-semibold uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
                <th className="px-5 py-2.5 w-8">#</th>
                <th className="px-3 py-2.5">Plaka</th>
                <th className="px-3 py-2.5 text-right">Varaka</th>
                <th className="px-3 py-2.5 text-right">Toplam Tutar</th>
                <th className="px-3 py-2.5 w-8" aria-label="Detay" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.plaka}
                  onClick={() => onSelect(row.plaka)}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer"
                  title="Bu plakanın kayıtlarını göster"
                >
                  <td className="px-5 py-2.5 text-neutral-400 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-neutral-900 whitespace-nowrap">{row.plaka}</div>
                    <div className="text-caption text-neutral-500 truncate max-w-[180px]">{row.isim}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.ceza_sayisi)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(row.toplam_ceza)}</td>
                  <td className="px-3 py-2.5 text-neutral-400">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <SourceNote>Bir satıra tıklayarak ilgili aracın tüm kayıtlarını görüntüleyebilirsiniz.</SourceNote>
    </Card>
  );
};

export default TopPlatesTable;
