import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Ozet } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import { percentChange } from '../lib/stats';
import { Card } from './ui';
import { cn } from '../lib/utils';

interface KpiCardsProps {
  ozet: Ozet;
  previous: Ozet | null;
}

const Delta: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  const change = percentChange(current, previous);
  if (change === null) return <span className="text-caption text-neutral-400">Önceki dönemde kayıt yok</span>;

  const flat = Math.abs(change) < 0.05;
  const Icon = flat ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-caption">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-medium tabular-nums',
          flat ? 'text-neutral-500' : 'text-neutral-800'
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {formatPercent(Math.abs(change))}
      </span>
      <span className="text-neutral-500">önceki döneme göre</span>
    </span>
  );
};

const KpiCards: React.FC<KpiCardsProps> = ({ ozet, previous }) => {
  const aracBasina = ozet.arac_sayisi ? ozet.toplam_sayisi / ozet.arac_sayisi : 0;

  const items = [
    {
      label: 'Toplam Varaka',
      value: formatNumber(ozet.toplam_sayisi),
      note: `${formatNumber(ozet.para_cezasi_sayisi)} para · ${formatNumber(ozet.men_cezasi_sayisi)} men`,
      current: ozet.toplam_sayisi,
      prev: previous?.toplam_sayisi,
    },
    {
      label: 'Toplam Ceza Tutarı',
      value: formatCurrency(ozet.toplam_ceza_tutari),
      note: 'Para cezalarının toplamı',
      current: ozet.toplam_ceza_tutari,
      prev: previous?.toplam_ceza_tutari,
    },
    {
      label: 'Ortalama Ceza',
      value: formatCurrency(ozet.ortalama_ceza),
      note: 'Varaka başına',
      current: ozet.ortalama_ceza,
      prev: previous?.ortalama_ceza,
    },
    {
      label: 'Ceza Alan Araç',
      value: formatNumber(ozet.arac_sayisi),
      note: `Araç başına ${aracBasina.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ceza · ${formatNumber(ozet.tekrar_eden_arac_sayisi)} araç birden fazla`,
      current: ozet.arac_sayisi,
      prev: previous?.arac_sayisi,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {items.map(item => (
        <Card key={item.label} className="px-5 py-4">
          <div className="text-body-sm font-medium text-neutral-500">{item.label}</div>
          <div className="mt-1.5 text-heading-xl text-neutral-900 tabular-nums">{item.value}</div>
          <div className="mt-2 text-caption text-neutral-500">{item.note}</div>
          {previous && item.prev !== undefined && (
            <div className="mt-1">
              <Delta current={item.current} previous={item.prev} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default KpiCards;
