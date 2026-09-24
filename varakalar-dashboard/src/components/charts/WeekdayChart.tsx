import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { parseDate, formatNumber, formatPercent } from '../../lib/format';
import { Card, CardHeader, SourceNote } from '../ui';
import { CHART_COLORS, tooltipStyle } from './chartTheme';

// Pazartesi'den başlayarak
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const WeekdayChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const counts = useMemo(() => {
    const c = new Array(7).fill(0);
    varakalar.forEach(v => {
      c[(parseDate(v.tarih).getDay() + 6) % 7] += 1;
    });
    return c;
  }, [varakalar]);

  const total = varakalar.length;

  const data = {
    labels: DAYS.map(d => d.slice(0, 3)),
    datasets: [
      {
        label: 'Varaka sayısı',
        data: counts,
        backgroundColor: CHART_COLORS.primary,
        borderRadius: 2,
        maxBarThickness: 40,
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
          title: (items: any[]) => DAYS[items[0].dataIndex],
          label: (ctx: any) =>
            `${formatNumber(ctx.parsed.y)} varaka${total ? ` (${formatPercent((ctx.parsed.y / total) * 100)})` : ''}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, border: { display: false }, ticks: { precision: 0 } },
    },
  };

  return (
    <Card>
      <CardHeader title="Haftanın Günlerine Göre" description="Varaka düzenlenme günü dağılımı" />
      <div className="px-5 py-4 h-[280px]">
        <Bar data={data} options={options} />
      </div>
      <SourceNote>Kaynak: zabıt varakası tarihleri, seçili filtreler.</SourceNote>
    </Card>
  );
};

export default WeekdayChart;
