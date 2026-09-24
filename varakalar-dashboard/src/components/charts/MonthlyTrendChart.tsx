import React, { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { CHART_COLORS, formatTLAxis, tooltipStyle } from './chartTheme';

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const MonthlyTrendChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const months = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    varakalar.forEach(v => {
      const key = v.tarih.slice(0, 7);
      const m = map.get(key) || { count: 0, total: 0 };
      m.count += 1;
      m.total += v.ceza_miktari;
      map.set(key, m);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [varakalar]);

  if (!months.length) {
    return (
      <Card>
        <CardHeader title="Aylık Eğilim" />
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" />
      </Card>
    );
  }

  const labels = months.map(([key]) => {
    const [y, m] = key.split('-');
    return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
  });

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Varaka sayısı',
        data: months.map(([, m]) => m.count),
        backgroundColor: CHART_COLORS.primary,
        borderRadius: 2,
        maxBarThickness: 36,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Ceza tutarı',
        data: months.map(([, m]) => m.total),
        borderColor: CHART_COLORS.accent,
        backgroundColor: CHART_COLORS.accent,
        borderWidth: 2,
        pointRadius: 2.5,
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
      legend: { position: 'bottom' as const, align: 'start' as const, labels: { boxWidth: 12, boxHeight: 12, padding: 16 } },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx: any) =>
            ctx.dataset.yAxisID === 'y1'
              ? `Tutar: ${formatCurrency(ctx.parsed.y)}`
              : `Varaka: ${formatNumber(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        title: { display: true, text: 'Varaka sayısı' },
        ticks: { precision: 0 },
      },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        border: { display: false },
        title: { display: true, text: 'Ceza tutarı' },
        ticks: { callback: (v: any) => formatTLAxis(v) },
      },
    },
  };

  return (
    <Card>
      <CardHeader title="Aylık Eğilim" description="Aylara göre varaka sayısı ve toplam ceza tutarı" />
      <div className="px-5 pt-4 pb-2 h-[320px]">
        <Chart type="bar" data={data} options={options} />
      </div>
      <SourceNote>Tutarlar yalnızca para cezalarını içerir. Kaynak: zabıt varakası kayıtları, seçili filtreler.</SourceNote>
    </Card>
  );
};

export default MonthlyTrendChart;
