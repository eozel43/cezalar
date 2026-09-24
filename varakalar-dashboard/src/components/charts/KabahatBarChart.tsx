import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { countBy } from '../../lib/stats';
import { formatNumber, formatPercent } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { CHART_COLORS, tooltipStyle, truncate } from './chartTheme';

const KabahatBarChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const rows = useMemo(() => countBy(varakalar, v => v.kabahat), [varakalar]);
  const total = varakalar.length;

  if (!rows.length) {
    return (
      <Card>
        <CardHeader title="Kabahat Türü Dağılımı" />
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" />
      </Card>
    );
  }

  const data = {
    labels: rows.map(([k]) => truncate(k, 36)),
    datasets: [
      {
        label: 'Varaka sayısı',
        data: rows.map(([, c]) => c),
        backgroundColor: rows.map((_, i) => (i < 3 ? CHART_COLORS.primary : CHART_COLORS.primarySoft)),
        borderRadius: 2,
        barThickness: 18,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items: any[]) => rows[items[0].dataIndex][0],
          label: (ctx: any) => `${formatNumber(ctx.parsed.x)} varaka (${formatPercent((ctx.parsed.x / total) * 100)})`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        ticks: { precision: 0 },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 12 } },
      },
    },
  };

  return (
    <Card>
      <CardHeader title="Kabahat Türü Dağılımı" description={`${rows.length} farklı kabahat türü, sıklığa göre sıralı`} />
      <div className="px-5 py-4" style={{ height: Math.max(220, rows.length * 30 + 40) }}>
        <Bar data={data} options={options} />
      </div>
      <SourceNote>En sık görülen üç tür koyu renkle gösterilmiştir. Kaynak: zabıt varakası kayıtları, seçili filtreler.</SourceNote>
    </Card>
  );
};

export default KabahatBarChart;
