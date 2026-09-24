import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { formatNumber, formatPercent } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { CHART_COLORS, tooltipStyle } from './chartTheme';

// Bu sayı ve üzeri tek bir "N+" sütununda toplanır
const MAX_BUCKET = 10;

const PlateFrequencyChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const { buckets, plateCount, repeatPlates } = useMemo(() => {
    const perPlate: Record<string, number> = {};
    varakalar.forEach(v => {
      perPlate[v.plaka_no] = (perPlate[v.plaka_no] || 0) + 1;
    });

    const counts = Object.values(perPlate);
    const top = Math.min(Math.max(0, ...counts), MAX_BUCKET);
    const b = new Array(top).fill(0);
    counts.forEach(c => {
      b[Math.min(c, MAX_BUCKET) - 1] += 1;
    });

    return {
      buckets: b as number[],
      plateCount: counts.length,
      repeatPlates: counts.filter(c => c > 1).length,
    };
  }, [varakalar]);

  if (!plateCount) {
    return (
      <Card>
        <CardHeader title="Plaka Başına Ceza Sayısı" />
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" />
      </Card>
    );
  }

  const label = (i: number) => (i + 1 === MAX_BUCKET ? `${MAX_BUCKET}+` : String(i + 1));

  const data = {
    labels: buckets.map((_, i) => label(i)),
    datasets: [
      {
        label: 'Plaka sayısı',
        data: buckets,
        // Tek ceza açık, tekrarlayanlar koyu
        backgroundColor: buckets.map((_, i) => (i === 0 ? CHART_COLORS.primarySoft : CHART_COLORS.primary)),
        borderRadius: 2,
        maxBarThickness: 48,
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
          title: (items: any[]) => `${label(items[0].dataIndex)} ceza alan plakalar`,
          label: (ctx: any) => `${formatNumber(ctx.parsed.y)} plaka (${formatPercent((ctx.parsed.y / plateCount) * 100)})`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: 'Plaka başına ceza sayısı' },
      },
      y: {
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        title: { display: true, text: 'Plaka sayısı' },
        ticks: { precision: 0 },
      },
    },
  };

  return (
    <Card>
      <CardHeader
        title="Plaka Başına Ceza Sayısı"
        description={`${formatNumber(plateCount)} farklı plakanın ceza sıklığı dağılımı`}
      />
      <div className="px-5 py-4 h-[300px]">
        <Bar data={data} options={options} />
      </div>
      <SourceNote>
        <strong className="text-neutral-700">{formatNumber(repeatPlates)}</strong> plaka (
        {formatPercent((repeatPlates / plateCount) * 100)}) birden fazla ceza almıştır; tekrarlayan ihlaller koyu renkle
        gösterilmiştir. Kaynak: zabıt varakası kayıtları, seçili filtreler.
      </SourceNote>
    </Card>
  );
};

export default PlateFrequencyChart;
