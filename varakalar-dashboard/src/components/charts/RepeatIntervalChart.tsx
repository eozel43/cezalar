import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Varaka } from '../../types';
import { median, repeatGapDetails } from '../../lib/stats';
import { formatNumber, formatPercent } from '../../lib/format';
import { Card, CardHeader, SourceNote, EmptyState } from '../ui';
import { BAR_MARK, CHART_COLORS, tooltipStyle } from './chartTheme';
import { cn } from '../../lib/utils';

const BUCKETS = [
  { label: '0–30 gün', max: 30 },
  { label: '31–90 gün', max: 90 },
  { label: '91–180 gün', max: 180 },
  { label: '181–365 gün', max: 365 },
  { label: '1 yıldan fazla', max: Infinity },
];

// 30 gün içinde tekrar oranı için değerlendirme eşikleri
const HIGH_SHARE = 40;
const MEDIUM_SHARE = 20;
// Bu sayının altında yorum "az veri" uyarısıyla verilir
const MIN_REPEATS = 20;
const TOP_FAST_PLATES = 3;

type Level = 'high' | 'medium' | 'low';

const LEVELS: Record<Level, { label: string; icon: React.ReactNode; className: string }> = {
  high: {
    label: 'Yüksek',
    icon: <AlertTriangle className="w-4 h-4" />,
    className: 'border-red-200 bg-red-50 text-semantic-error',
  },
  medium: {
    label: 'Orta',
    icon: <Info className="w-4 h-4" />,
    className: 'border-amber-200 bg-amber-50 text-semantic-warning',
  },
  low: {
    label: 'Düşük',
    icon: <CheckCircle2 className="w-4 h-4" />,
    className: 'border-green-200 bg-green-50 text-semantic-success',
  },
};

const RECOMMENDATIONS: Record<Level, string> = {
  high:
    'Cezalar tekrarı önlemede yeterince caydırıcı görünmüyor. Kısa sürede yeniden ceza alan araçlar için kademeli yaptırım, işletmeciyle görüşme veya yakın denetim planlanabilir.',
  medium:
    'Tekrarların önemli bir kısmı kısa sürede gerçekleşiyor. Özellikle 30 gün içinde yeniden ceza alan araçların takibe alınması önerilir.',
  low:
    'Cezalar tekrarı büyük ölçüde geciktiriyor; kısa sürede tekrar eden ihlal sınırlı. Mevcut denetim sıklığının sürdürülmesi yeterli görünüyor.',
};

const describeDays = (days: number) => {
  if (days < 45) return `${formatNumber(days)} gün`;
  const months = days / 30;
  return `${formatNumber(days)} gün (yaklaşık ${formatNumber(Math.round(months * 10) / 10)} ay)`;
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-caption text-neutral-500">{label}</div>
    <div className="text-heading-md text-neutral-900 tabular-nums">{value}</div>
  </div>
);

interface RepeatIntervalChartProps {
  varakalar: Varaka[];
  onSelectPlate?: (plaka: string) => void;
}

const RepeatIntervalChart: React.FC<RepeatIntervalChartProps> = ({ varakalar, onSelectPlate }) => {
  const analysis = useMemo(() => {
    const details = repeatGapDetails(varakalar);
    const gaps = details.map(d => d.gap);
    const counts = BUCKETS.map(() => 0);
    gaps.forEach(g => {
      counts[BUCKETS.findIndex(b => g <= b.max)] += 1;
    });

    // Plates fined again within 30 days, most frequent first
    const fast = new Map<string, number>();
    details.filter(d => d.gap <= BUCKETS[0].max).forEach(d => fast.set(d.plaka, (fast.get(d.plaka) || 0) + 1));
    const fastPlates = [...fast.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'));

    const total = gaps.length;
    const within30Share = total ? (counts[0] / total) * 100 : 0;
    const within90Share = total ? ((counts[0] + counts[1]) / total) * 100 : 0;
    const level: Level = within30Share >= HIGH_SHARE ? 'high' : within30Share >= MEDIUM_SHARE ? 'medium' : 'low';

    return {
      counts,
      total,
      within30: counts[0],
      within30Share,
      within90Share,
      med: median(gaps),
      sameDay: gaps.filter(g => g === 0).length,
      dominant: counts.indexOf(Math.max(...counts)),
      fastPlates,
      level,
    };
  }, [varakalar]);

  const { counts, total, within30, within30Share, within90Share, med, sameDay, dominant, fastPlates, level } = analysis;

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

  const levelInfo = LEVELS[level];
  const shownFast = fastPlates.slice(0, TOP_FAST_PLATES);

  return (
    <Card>
      <CardHeader title="Tekrar Süresi" description="Aynı araç, önceki cezasından ne kadar sonra yeniden ceza aldı?" />
      <div className="grid grid-cols-3 gap-4 px-5 pt-4">
        <Stat label="Tekrar eden ceza" value={formatNumber(total)} />
        <Stat label="30 gün içinde" value={formatPercent(within30Share)} />
        <Stat label="Ortanca süre" value={med === null ? '–' : `${formatNumber(Math.round(med))} gün`} />
      </div>
      <div className="px-5 py-4 h-[260px]">
        <Bar data={data} options={options} />
      </div>

      <section aria-label="Değerlendirme" className="mx-5 mb-4 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h4 className="text-body-sm font-semibold text-neutral-900">Değerlendirme</h4>
          <span className={cn('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-caption font-medium', levelInfo.className)}>
            {levelInfo.icon}
            Kısa sürede tekrar: {levelInfo.label}
          </span>
        </div>
        <ul className="space-y-1.5 text-body-sm text-neutral-700 list-disc pl-4 marker:text-neutral-400">
          <li>
            Aynı araca yazılan <strong className="text-neutral-900">{formatNumber(total)}</strong> tekrar cezada, önceki
            cezadan sonraki 30 gün içinde gelenlerin oranı <strong className="text-neutral-900">{formatPercent(within30Share)}</strong>,
            90 gün içinde gelenlerin oranı <strong className="text-neutral-900">{formatPercent(within90Share)}</strong>.
          </li>
          {med !== null && (
            <li>
              Tipik olarak bir araç, önceki cezasından <strong className="text-neutral-900">{describeDays(Math.round(med))}</strong>{' '}
              sonra yeniden ceza alıyor. Tekrarların en çok toplandığı aralık:{' '}
              <strong className="text-neutral-900">{BUCKETS[dominant].label}</strong> ({formatNumber(counts[dominant])} ceza).
            </li>
          )}
          {within30 > 0 && (
            <li>
              <strong className="text-neutral-900">{formatNumber(fastPlates.length)}</strong> araç 30 gün dolmadan yeniden ceza
              almış
              {shownFast.length > 0 && (
                <>
                  ; en sık tekrarlayanlar:{' '}
                  {shownFast.map(([plaka, n], i) => (
                    <React.Fragment key={plaka}>
                      {i > 0 && ', '}
                      {onSelectPlate ? (
                        <button
                          onClick={() => onSelectPlate(plaka)}
                          className="font-medium text-primary-700 hover:text-primary-900 underline-offset-2 hover:underline"
                          title="Bu aracın kayıtlarını göster"
                        >
                          {plaka}
                        </button>
                      ) : (
                        <span className="font-medium text-neutral-900">{plaka}</span>
                      )}{' '}
                      ({formatNumber(n)} kez)
                    </React.Fragment>
                  ))}
                </>
              )}
              .
            </li>
          )}
          {sameDay > 0 && (
            <li>
              {formatNumber(sameDay)} ceza, aynı araca aynı gün içinde yazılmış; bu durum tek denetimde birden fazla ihlal
              tespitine işaret edebilir.
            </li>
          )}
          <li>
            <span className="font-medium text-neutral-900">Öneri: </span>
            {RECOMMENDATIONS[level]}
          </li>
        </ul>
        {total < MIN_REPEATS && (
          <p className="mt-2 text-caption text-neutral-500">
            Not: Seçili filtrelerde yalnızca {formatNumber(total)} tekrar var; yorum küçük bir örneklemden üretildiği için
            dikkatle değerlendirilmelidir.
          </p>
        )}
      </section>

      <SourceNote>
        Bir aracın ilk cezası sayılmaz; her sonraki ceza, aynı aracın bir önceki cezasıyla karşılaştırılır. Düzey, 30 gün
        içinde tekrar oranına göre belirlenir (%{MEDIUM_SHARE} altı düşük, %{HIGH_SHARE} ve üzeri yüksek). Kaynak: zabıt
        varakası kayıtları, seçili filtreler.
      </SourceNote>
    </Card>
  );
};

export default RepeatIntervalChart;
