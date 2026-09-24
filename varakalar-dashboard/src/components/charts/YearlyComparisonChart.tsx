import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { yearlyStats, YearStats } from '../../lib/stats';
import { formatCurrency, formatNumber, parseDate } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { BAR_MARK, CHART_COLORS, formatTLAxis, tooltipStyle } from './chartTheme';

const monthName = (iso: string) => parseDate(iso).toLocaleDateString('tr-TR', { month: 'short' });

// A year is partial when the data starts after January or ends before December
const isPartial = (y: YearStats) => y.firstDate.slice(5, 7) !== '01' || y.lastDate.slice(5, 7) !== '12';

const coverage = (y: YearStats) => `${monthName(y.firstDate)}–${monthName(y.lastDate)} ${y.year}`;

interface MiniBarProps {
  title: string;
  years: YearStats[];
  values: (number | null)[];
  format: (v: number) => string;
  axisFormat?: (v: number) => string;
}

const MiniBar: React.FC<MiniBarProps> = ({ title, years, values, format, axisFormat }) => {
  const data = {
    labels: years.map(y => (isPartial(y) ? `${y.year}*` : String(y.year))),
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: years.map(y => (isPartial(y) ? CHART_COLORS.primarySoft : CHART_COLORS.primary)),
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
          title: (items: any[]) => coverage(years[items[0].dataIndex]),
          label: (ctx: any) => `${title}: ${format(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        ticks: axisFormat ? { callback: (v: any) => axisFormat(Number(v)) } : { precision: 0 },
      },
    },
  };

  return (
    <div>
      <div className="text-body-sm font-medium text-neutral-700 mb-2">{title}</div>
      <div className="h-[200px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

const YearlyComparisonChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const years = useMemo(() => yearlyStats(varakalar), [varakalar]);

  if (!years.length) {
    return (
      <Card>
        <CardHeader title="Yıllık Karşılaştırma" />
        <EmptyState title="Seçili filtrelerle kayıt bulunamadı" />
      </Card>
    );
  }

  const partial = years.filter(isPartial);

  return (
    <Card>
      <CardHeader
        title="Yıllık Karşılaştırma"
        description="Ceza sayısı ile ortalama ceza tutarı ayrı ölçeklerde gösterilir"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-5 py-4">
        <MiniBar title="Ceza sayısı" years={years} values={years.map(y => y.count)} format={formatNumber} />
        <MiniBar
          title="Ortalama para cezası"
          years={years}
          values={years.map(y => y.avgFine)}
          format={formatCurrency}
          axisFormat={formatTLAxis}
        />
      </div>
      <SourceNote>
        {partial.length > 0 && (
          <>
            * Eksik yıl, açık renkle gösterilir: {partial.map(coverage).join(', ')}. Eksik yılların ceza sayısı tam yıllarla
            doğrudan karşılaştırılmamalıdır.{' '}
          </>
        )}
        Ortalama tutar yalnızca para cezalarını içerir. Kaynak: zabıt varakası kayıtları, seçili filtreler.
      </SourceNote>
    </Card>
  );
};

export default YearlyComparisonChart;
