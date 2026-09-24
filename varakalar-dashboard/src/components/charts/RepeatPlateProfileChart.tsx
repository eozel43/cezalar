import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Varaka } from '../../types';
import { countBy } from '../../lib/stats';
import { formatNumber, formatPercent } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { CATEGORICAL, CHART_COLORS, OTHER_COLOR, tooltipStyle, truncate } from './chartTheme';

const TOP_PLATES = 10;
const OTHER = 'Diğer';

const RepeatPlateProfileChart: React.FC<{ varakalar: Varaka[] }> = ({ varakalar }) => {
  const profile = useMemo(() => {
    const byPlate = new Map<string, Varaka[]>();
    varakalar.forEach(v => byPlate.set(v.plaka_no, [...(byPlate.get(v.plaka_no) || []), v]));

    const plates = [...byPlate.entries()]
      .filter(([, list]) => list.length > 1)
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'tr'))
      .slice(0, TOP_PLATES);
    if (!plates.length) return null;

    // Series = the three most common kabahat among these plates; the rest fold into "Diğer"
    const fines = plates.flatMap(([, list]) => list);
    const series = countBy(fines, v => v.kabahat)
      .slice(0, CATEGORICAL.length)
      .map(([k]) => k);
    const hasOther = fines.some(v => !series.includes(v.kabahat));
    const allSeries = hasOther ? [...series, OTHER] : series;

    const matrix = allSeries.map(s =>
      plates.map(([, list]) =>
        list.filter(v => (s === OTHER ? !series.includes(v.kabahat) : v.kabahat === s)).length
      )
    );

    const distinctTypes = plates.map(([, list]) => new Set(list.map(v => v.kabahat)).size);
    const singleType = distinctTypes.filter(n => n === 1).length;

    return { plates, allSeries, matrix, singleType };
  }, [varakalar]);

  if (!profile) {
    return (
      <Card>
        <CardHeader title="Tekrarlayan Araçların İhlal Profili" />
        <EmptyState title="Seçili filtrelerde birden fazla ceza alan araç yok" />
      </Card>
    );
  }

  const { plates, allSeries, matrix, singleType } = profile;
  const totals = plates.map(([, list]) => list.length);

  // Round only the outer (right) end of each row: the last non-empty segment
  const lastSegment = plates.map((_, pi) => {
    for (let si = allSeries.length - 1; si >= 0; si--) if (matrix[si][pi] > 0) return si;
    return -1;
  });

  const data = {
    labels: plates.map(([plaka], i) => `${plaka}  (${totals[i]})`),
    datasets: allSeries.map((s, si) => ({
      label: s === OTHER ? OTHER : truncate(s, 40),
      data: matrix[si],
      backgroundColor: s === OTHER ? OTHER_COLOR : CATEGORICAL[si],
      // 2px surface gap between segments instead of an outline
      borderColor: '#FFFFFF',
      borderWidth: { top: 0, bottom: 0, left: 0, right: 2 },
      borderSkipped: false as const,
      borderRadius: (ctx: any) =>
        lastSegment[ctx.dataIndex] === si ? { topRight: 4, bottomRight: 4, topLeft: 0, bottomLeft: 0 } : 0,
      barThickness: 18,
    })),
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, axis: 'y' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: { boxWidth: 12, boxHeight: 12, padding: 14 },
      },
      tooltip: {
        ...tooltipStyle,
        displayColors: true,
        filter: (item: any) => item.parsed.x > 0,
        callbacks: {
          title: (items: any[]) => {
            const [plaka, list] = plates[items[0].dataIndex];
            return `${plaka} · ${list[0].isim}`;
          },
          label: (ctx: any) => {
            const s = allSeries[ctx.datasetIndex];
            const total = totals[ctx.dataIndex];
            return `${s}: ${formatNumber(ctx.parsed.x)} (${formatPercent((ctx.parsed.x / total) * 100, 0)})`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        title: { display: true, text: 'Ceza sayısı' },
        ticks: { precision: 0 },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 12 } },
      },
    },
  };

  return (
    <Card>
      <CardHeader
        title="Tekrarlayan Araçların İhlal Profili"
        description={`En çok ceza alan ${plates.length} aracın cezalarının kabahat türlerine dağılımı`}
      />
      <div className="px-5 py-4" style={{ height: plates.length * 30 + 90 }}>
        <Bar data={data} options={options} />
      </div>
      <SourceNote>
        {singleType > 0 ? (
          <>
            <strong className="text-neutral-700">{singleType}</strong> araç hep aynı kabahati tekrarlamış; bu araçlar için
            ihlale özel yaptırım veya eğitim düşünülebilir.{' '}
          </>
        ) : (
          <>Bu araçların tamamı birden fazla türde ihlal yapmış.{' '}</>
        )}
        Renkler bu araçlarda en sık görülen üç kabahati, gri diğer türleri gösterir. Kaynak: zabıt varakası kayıtları,
        seçili filtreler.
      </SourceNote>
    </Card>
  );
};

export default RepeatPlateProfileChart;
