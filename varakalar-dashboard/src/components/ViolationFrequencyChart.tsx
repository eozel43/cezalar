import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Varaka } from '../types';
import { useTheme } from 'next-themes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ViolationFrequencyChartProps {
  varakalar: Varaka[];
  className?: string;
}

const ViolationFrequencyChart: React.FC<ViolationFrequencyChartProps> = ({ varakalar, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#A3A3A3' : '#404040';
  const gridColor = isDark ? '#262626' : '#E5E5E5';
  const titleColor = isDark ? '#E5E5E5' : '#171717';

  // 1. Her plakanın ceza sayısını hesapla
  const plakaCezaSayilari = useMemo(() => {
    const sayilar: Record<string, number> = {};
    varakalar.forEach(v => {
      // Boş veya tanımsız plakaları atla
      const plaka = v.plaka_no?.trim();
      if (plaka) {
        sayilar[plaka] = (sayilar[plaka] || 0) + 1;
      }
    });
    return sayilar;
  }, [varakalar]);

  // 2. Ceza sayısına göre araçları kovalara (bucket) ayır
  const dagilim = useMemo(() => {
    let birCeza = 0;
    let ikiCeza = 0;
    let ucBesCeza = 0;
    let altiOnCeza = 0;
    let onUzeriCeza = 0;

    Object.values(plakaCezaSayilari).forEach(count => {
      if (count === 1) birCeza++;
      else if (count === 2) ikiCeza++;
      else if (count >= 3 && count <= 5) ucBesCeza++;
      else if (count >= 6 && count <= 10) altiOnCeza++;
      else if (count > 10) onUzeriCeza++;
    });

    const toplamArac = Object.keys(plakaCezaSayilari).length;

    return {
      buckets: [
        { label: '1 Ceza Alanlar', count: birCeza, color: '#6366F1' },
        { label: '2 Ceza Alanlar', count: ikiCeza, color: '#3B82F6' },
        { label: '3-5 Ceza Alanlar', count: ucBesCeza, color: '#10B981' },
        { label: '6-10 Ceza Alanlar', count: altiOnCeza, color: '#F59E0B' },
        { label: '10+ Ceza Alanlar', count: onUzeriCeza, color: '#EF4444' },
      ],
      toplamArac,
    };
  }, [plakaCezaSayilari]);

  const chartData = {
    labels: dagilim.buckets.map(b => b.label),
    datasets: [
      {
        label: 'Araç Sayısı',
        data: dagilim.buckets.map(b => b.count),
        backgroundColor: dagilim.buckets.map(b => b.color),
        borderColor: dagilim.buckets.map(b => b.color),
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: dagilim.buckets.map(b => b.color + 'DD'), // Hoverda hafif şeffaflık
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Tek seri olduğu için göstergeye gerek yok
      },
      tooltip: {
        backgroundColor: isDark ? '#262626' : '#171717',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: isDark ? '#404040' : '#E5E5E5',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          family: 'Inter',
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: 'Inter',
          size: 13,
          weight: 400,
        },
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            const pct = dagilim.toplamArac > 0 ? ((val / dagilim.toplamArac) * 100).toFixed(1) : '0';
            return `Araç Sayısı: ${val} adet (%${pct})`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Benzersiz Araç Sayısı',
          font: {
            family: 'Inter',
            size: 12,
            weight: 500,
          },
          color: textColor,
        },
        grid: {
          color: gridColor,
          lineWidth: 1,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 12,
          },
          color: textColor,
          precision: 0, // Tamsayı göstermek için
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
            weight: 500,
          },
          color: textColor,
        },
      },
    },
    animation: {
      duration: 300,
    },
  };

  // En yüksek mükerrer ceza alan plaka sayısını bulmak için analiz
  const analizBilgisi = useMemo(() => {
    const cokluCezaAracSayisi = Object.values(plakaCezaSayilari).filter(c => c > 1).length;
    const oran = dagilim.toplamArac > 0 ? ((cokluCezaAracSayisi / dagilim.toplamArac) * 100).toFixed(1) : '0';
    return {
      cokluCezaAracSayisi,
      oran,
    };
  }, [plakaCezaSayilari, dagilim.toplamArac]);

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm ${className}`}>
      <div className="mb-6">
        <h3 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-200 mb-2">
          🚗 Araç Başına İhlal Sıklığı Dağılımı (Mükerrerlik Histogramı)
        </h3>
        <p className="text-body text-neutral-600 dark:text-neutral-400">
          Sistemdeki benzersiz araçların kaçar kez ceza aldığının dağılımı (Toplam {dagilim.toplamArac.toLocaleString('tr-TR')} benzersiz araç)
        </p>
      </div>

      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>

      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-body-sm text-indigo-900 dark:text-indigo-200">
        <p className="leading-relaxed">
          <strong>Analitik Öngörü:</strong> Cezalandırılan araçların{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {analizBilgisi.cokluCezaAracSayisi} adeti (%{analizBilgisi.oran})
          </span>{' '}
          birden fazla ihlal gerçekleştirmiştir (mükerrer ihlalci). Mükerrer ihlalcilerin dağılım grafiği, kurallara uymayı alışkanlık haline getirmeyen sürücü gruplarını tespit etmeyi kolaylaştırır.
        </p>
      </div>
    </div>
  );
};

export default ViolationFrequencyChart;
