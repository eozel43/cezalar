import React, { useMemo, useState } from 'react';
import { Varaka } from '../../types';
import { countBy } from '../../lib/stats';
import { formatNumber } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { SEQUENTIAL, truncate } from './chartTheme';

const TOP_ROWS = 8;
const OTHER = 'Diğer';
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// Every month between the first and last record, including empty ones
const monthRange = (first: string, last: string) => {
  const out: string[] = [];
  let y = Number(first.slice(0, 4));
  let m = Number(first.slice(5, 7));
  const endKey = last.slice(0, 7);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    out.push(key);
    if (key >= endKey) return out;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
};

const monthLabel = (key: string) => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;

// Value → ramp step; 0 stays blank so empty months read as "none", not "few"
const stepFor = (value: number, max: number) =>
  value === 0 ? -1 : Math.min(SEQUENTIAL.length - 1, Math.floor((value / max) * (SEQUENTIAL.length - 1) + 0.5) || 1);

interface Hover {
  x: number;
  y: number;
  title: string;
  body: string;
}

const KabahatHeatmap: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const [hover, setHover] = useState<Hover | null>(null);

  const { rows, months, matrix, max, rowTotals } = useMemo(() => {
    if (!varakalar.length) return { rows: [], months: [], matrix: [], max: 0, rowTotals: [] };

    const ranked = countBy(varakalar, v => v.kabahat);
    const top = ranked.slice(0, TOP_ROWS).map(([k]) => k);
    const hasOther = ranked.length > TOP_ROWS;
    const r = hasOther ? [...top, OTHER] : top;

    const dates = varakalar.map(v => v.tarih.slice(0, 10)).sort();
    const m = monthRange(dates[0], dates[dates.length - 1]);
    const col = new Map(m.map((key, i) => [key, i]));
    const row = new Map(r.map((k, i) => [k, i]));

    const mat = r.map(() => m.map(() => 0));
    varakalar.forEach(v => {
      const ri = row.get(v.kabahat) ?? row.get(OTHER)!;
      mat[ri][col.get(v.tarih.slice(0, 7))!] += 1;
    });

    return {
      rows: r,
      months: m,
      matrix: mat,
      max: Math.max(...mat.flat()),
      rowTotals: mat.map(cells => cells.reduce((a, b) => a + b, 0)),
    };
  }, [varakalar]);

  if (!rows.length) {
    return (
      <Card>
        <CardHeader title="Kabahat Türlerinin Aylara Göre Dağılımı" />
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" />
      </Card>
    );
  }

  const showHover = (e: React.MouseEvent, kabahat: string, month: string, value: number, total: number) => {
    const box = (e.currentTarget.closest('[data-heatmap]') as HTMLElement).getBoundingClientRect();
    const cell = e.currentTarget.getBoundingClientRect();
    setHover({
      x: cell.left - box.left + cell.width / 2,
      y: cell.top - box.top,
      title: kabahat,
      body: `${monthLabel(month)}: ${formatNumber(value)} ceza${total ? ` · türün toplamı ${formatNumber(total)}` : ''}`,
    });
  };

  return (
    <Card>
      <CardHeader
        title="Kabahat Türlerinin Aylara Göre Dağılımı"
        description={`En sık ${Math.min(TOP_ROWS, rows.length)} kabahat türü${rows.includes(OTHER) ? ' ve diğerleri' : ''}; koyu renk daha çok ceza`}
      />
      <div className="relative" data-heatmap onMouseLeave={() => setHover(null)}>
        <div className="overflow-x-auto px-5 py-4">
          <table className="border-separate" style={{ borderSpacing: 2 }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white" />
                {months.map(m => (
                  <th
                    key={m}
                    scope="col"
                    className="px-0 pb-1 text-caption font-normal text-neutral-500 whitespace-nowrap align-bottom"
                  >
                    <div className="w-7 text-center leading-tight">
                      {MONTHS[Number(m.slice(5, 7)) - 1]}
                      {(m.endsWith('-01') || m === months[0]) && (
                        <div className="text-neutral-700 font-medium">{m.slice(2, 4)}</div>
                      )}
                    </div>
                  </th>
                ))}
                <th scope="col" className="pl-3 pb-1 text-caption font-medium text-neutral-500 text-right align-bottom">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((kabahat, ri) => (
                <tr key={kabahat}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-white pr-3 text-left text-body-sm font-normal text-neutral-700 whitespace-nowrap"
                    title={kabahat}
                  >
                    {truncate(kabahat, 34)}
                  </th>
                  {matrix[ri].map((value, ci) => {
                    const step = stepFor(value, max);
                    return (
                      <td
                        key={months[ci]}
                        onMouseEnter={e => showHover(e, kabahat, months[ci], value, rowTotals[ri])}
                        className="w-7 h-7 min-w-7 rounded text-center text-[11px] tabular-nums cursor-default"
                        style={{
                          backgroundColor: step < 0 ? '#F8FAFC' : SEQUENTIAL[step],
                          color: step >= 4 ? '#FFFFFF' : '#334155',
                        }}
                        aria-label={`${kabahat}, ${monthLabel(months[ci])}: ${value}`}
                      >
                        {value > 0 ? value : ''}
                      </td>
                    );
                  })}
                  <td className="pl-3 text-right text-body-sm font-medium text-neutral-800 tabular-nums">
                    {formatNumber(rowTotals[ri])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded bg-neutral-900 px-2.5 py-1.5 text-caption text-white shadow-md"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            <div className="font-semibold max-w-[260px] truncate">{hover.title}</div>
            <div className="text-neutral-200">{hover.body}</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-5 pb-3 text-caption text-neutral-500">
        <span>Az</span>
        {SEQUENTIAL.map(color => (
          <span key={color} className="w-5 h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>Çok (ayda en fazla {formatNumber(max)})</span>
      </div>
      <SourceNote>Boş hücre o ay ceza olmadığını gösterir. Kaynak: zabıt varakası kayıtları, seçili filtreler.</SourceNote>
    </Card>
  );
};

export default KabahatHeatmap;
