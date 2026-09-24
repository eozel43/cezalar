import React, { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { calculatePareto } from '../../lib/stats';
import { formatNumber, formatPercent } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { CHART_COLORS, tooltipStyle, truncate } from './chartTheme';

const MAX_ITEMS = 10;

const ParetoChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const pareto = useMemo(() => calculatePareto(varakalar), [varakalar]);
  const shown = pareto.slice(0, MAX_ITEMS);

  // %80'e ulaşmak için gereken kabahat türü sayısı
  const vitalFew = pareto.findIndex(p => p.cumulative_percentage >= 80) + 1;

  if (!pareto.length) {
    return (
      <Card>
        <CardHeader title="Pareto Analizi" />
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" />
      </Card>
    );
  }

  const data = {
    labels: shown.map(p => truncate(p.kabahat, 22)),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Varaka sayısı',
        data: shown.map(p => p.count),
        backgroundColor: CHART_COLORS.primary,
        borderRadius: 2,
        maxBarThickness: 48,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Kümülatif oran',
        data: shown.map(p => p.cumulative_percentage),
        borderColor: CHART_COLORS.accent,
        backgroundColor: CHART_COLORS.accent,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0,
        yAxisID: 'y1',
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'start' as const,
        labels: { boxWidth: 12, boxHeight: 12, padding: 16 },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items: any[]) => shown[items[0].dataIndex]?.kabahat ?? '',
          label: (ctx: any) =>
            ctx.dataset.yAxisID === 'y1'
              ? `Kümülatif: ${formatPercent(ctx.parsed.y)}`
              : `Varaka: ${formatNumber(ctx.parsed.y)} (${formatPercent(shown[ctx.dataIndex].percentage)})`,
        },
      },
      annotation: {
        annotations: {
          line80: {
            type: 'line' as const,
            yMin: 80,
            yMax: 80,
            yScaleID: 'y1',
            borderColor: '#94A3B8',
            borderWidth: 1,
            borderDash: [4, 4],
            label: {
              display: true,
              content: '%80',
              position: 'start' as const,
              backgroundColor: 'transparent',
              color: '#64748B',
              font: { size: 11 },
              yAdjust: -8,
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 40, minRotation: 0, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        title: { display: true, text: 'Varaka sayısı' },
        ticks: { precision: 0 },
      },
      y1: {
        position: 'right' as const,
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        border: { display: false },
        ticks: { callback: (v: any) => `%${v}` },
      },
    },
  };

  return (
    <Card>
      <CardHeader
        title="Pareto Analizi"
        description={`Kabahat türleri, sıklığa göre (ilk ${Math.min(MAX_ITEMS, pareto.length)} tür)`}
      />
      <div className="px-5 pt-4 pb-2 h-[360px]">
        <Chart type="bar" data={data} options={options} />
      </div>
      <SourceNote>
        {vitalFew > 0 && (
          <>
            Varakaların %80'i <strong className="text-neutral-700">{vitalFew}</strong> kabahat türünden
            kaynaklanıyor ({pareto.length} türden). Denetim önceliği bu türlere verilebilir.{' '}
          </>
        )}
        Kaynak: zabıt varakası kayıtları, seçili filtreler.
      </SourceNote>
    </Card>
  );
};

export default ParetoChart;
