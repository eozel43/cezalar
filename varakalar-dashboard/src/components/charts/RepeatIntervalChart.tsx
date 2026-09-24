import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { median, repeatGaps } from '../../lib/stats';
import { formatNumber, formatPercent } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { BAR_MARK, CHART_COLORS, tooltipStyle } from './chartTheme';

const BUCKETS = [
  { label: '0–30 gün', max: 30 },
  { label: '31–90 gün', max: 90 },
  { label: '91–180 gün', max: 180 },
  { label: '181–365 gün', max: 365 },
  { label: '1 yıldan fazla', max: Infinity },
];

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-caption text-neutral-500">{label}</div>
    <div className="text-heading-md text-neutral-900 tabular-nums">{value}</div>
  </div>
);

const RepeatIntervalChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const { counts, total, within30, med } = useMemo(() => {
    const gaps = repeatGaps(varakalar);
    const c = BUCKETS.map(() => 0);
    gaps.forEach(g => {
      c[BUCKETS.findIndex(b => g <= b.max)] += 1;
    });
    return { counts: c, total: gaps.length, within30: c[0], med: median(gaps) };
  }, [varakalar]);

  if (!total) {
    return (
      <Card>
        <CardHeader title="Tekrar Süresi" />
        <EmptyState title="Seçili filtrelerde aynı araca tekrar yazılmış ceza yok" />
      </Card>
    );
  }

  const data = {
    labels: BUCKETS.map(b => b.label),
    datasets: [
      {
        label: 'Tekrar eden ceza',
        data: counts,
        backgroundColor: CHART_COLORS.primary,
        ...BAR_MARK,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items: any[]) => `Önceki cezadan ${BUCKETS[items[0].dataIndex].label.toLocaleLowerCase('tr-TR')} sonra`,
          label: (ctx: any) => `${formatNumber(ctx.parsed.y)} ceza (${formatPercent((ctx.parsed.y / total) * 100)})`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, title: { display: true, text: 'Aynı araca önceki cezadan bu yana geçen süre' } },
      y: {
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        title: { display: true, text: 'Tekrar eden ceza sayısı' },
        ticks: { precision: 0 },
      },
    },
  };

  return (
    <Card>
      <CardHeader title="Tekrar Süresi" description="Aynı araç, önceki cezasından ne kadar sonra yeniden ceza aldı?" />
      <div className="grid grid-cols-3 gap-4 px-5 pt-4">
        <Stat label="Tekrar eden ceza" value={formatNumber(total)} />
        <Stat label="30 gün içinde" value={formatPercent((within30 / total) * 100)} />
        <Stat label="Ortanca süre" value={med === null ? '–' : `${formatNumber(Math.round(med))} gün`} />
      </div>
      <div className="px-5 py-4 h-[260px]">
        <Bar data={data} options={options} />
      </div>
      <SourceNote>
        Bir aracın ilk cezası sayılmaz; her sonraki ceza, aynı aracın bir önceki cezasıyla karşılaştırılır. Kısa aralıklar
        caydırıcılığın zayıf kaldığı araçları gösterir. Kaynak: zabıt varakası kayıtları, seçili filtreler.
      </SourceNote>
    </Card>
  );
};

export default RepeatIntervalChart;
