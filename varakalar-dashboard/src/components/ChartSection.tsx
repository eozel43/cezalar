import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Varaka } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartSectionProps {
  varakalar: Varaka[];
  className?: string;
}

const ChartSection: React.FC<ChartSectionProps> = ({ varakalar, className = '' }) => {
  // Kabahat türü dağılımı
  const kabahatDagilimi = varakalar.reduce((acc, varaka) => {
    acc[varaka.kabahat] = (acc[varaka.kabahat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const labels = Object.keys(kabahatDagilimi);
  const data = Object.values(kabahatDagilimi);

  const pieData = {
    labels: labels.map(label => 
      label.length > 30 ? 
      label.substring(0, 30) + '...' : 
      label
    ),
    datasets: [
      {
        label: 'Kabahat Sayısı',
        data,
        backgroundColor: [
          '#0066FF', '#99CCFF', '#E5E5E5', '#A3A3A3', 
          '#404040', '#171717', '#F59E0B', '#EF4444'
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: labels.map(label => 
      label.length > 20 ? 
      label.substring(0, 20) + '...' : 
      label
    ),
    datasets: [
      {
        label: 'Kabahat Sayısı',
        data,
        backgroundColor: '#0066FF',
        borderColor: '#0066FF',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const monthlyBuckets = varakalar.reduce((acc, varaka) => {
    if (!varaka.tarih) return acc;
    const date = new Date(varaka.tarih);
    if (isNaN(date.getTime())) return acc;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyLabels = Object.keys(monthlyBuckets).sort((a, b) => {
    const aDate = new Date(`${a}-01`).getTime();
    const bDate = new Date(`${b}-01`).getTime();
    return aDate - bDate;
  });

  const monthlyData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Yil-Ay Kabahat Sayisi',
        data: monthlyLabels.map(label => monthlyBuckets[label]),
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[], chart: any) => {
      if (!elements.length) return;
      const element = elements[0];
      chart.tooltip.setActiveElements(
        [{ datasetIndex: element.datasetIndex, index: element.index }],
        { x: event.x, y: event.y }
      );
      chart.update();
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter',
            size: 14,
            weight: 400,
          },
          color: '#404040',
          padding: 20,
          boxWidth: 15,
        },
      },
      tooltip: {
        backgroundColor: '#171717',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#E5E5E5',
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
            const label = context.label || '';
            const rawValue = typeof context.parsed === 'number'
              ? context.parsed
              : (context.parsed && typeof context.parsed.y === 'number'
                ? context.parsed.y
                : context.raw);
            const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
            const isPie = context.chart?.config?.type === 'pie';

            if (!isPie) {
              return `${label}: ${Number.isFinite(value) ? value : rawValue} adet`;
            }

            const total = context.dataset.data.reduce((a: number, b: unknown) => {
              return a + (typeof b === 'number' ? b : 0);
            }, 0);

            if (!Number.isFinite(value) || total === 0) {
              return `${label}: ${Number.isFinite(value) ? value : rawValue} adet`;
            }

            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} adet (%${percentage})`;
          },
        },
      },
    },
    animation: {
      duration: 300,
    },
  };

  const pieOptions = {
    ...options,
    plugins: {
      ...options.plugins,
      legend: {
        ...options.plugins.legend,
        position: 'right' as const,
      },
    },
  };

  const barOptions = {
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#E5E5E5',
          lineWidth: 1,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 12,
          },
          color: '#404040',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 10,
          },
          color: '#404040',
          maxRotation: 45,
        },
      },
    },
  };

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-heading-lg font-semibold text-neutral-900 mb-2">
            📊 Kabahat Türü Dağılımı
          </h2>
          <p className="text-body text-neutral-600">
            Ceza türlerinin genel dağılımı ve frekans analizi
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Pie Chart */}
          <div className="bg-background-surface rounded-lg border border-neutral-200 p-8 shadow-sm">
            <h3 className="text-heading-md font-semibold text-neutral-900 mb-6">
              Pasta Grafik - Kabahat Dağılımı
            </h3>
            <div className="h-96">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {false && (
          <div className="bg-background-surface rounded-lg border border-neutral-200 p-8 shadow-sm">
            <h3 className="text-heading-md font-semibold text-neutral-900 mb-6">
              Bar Grafik - Kabahat Frekansı
            </h3>
            <div className="h-80">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
          )}
        </div>

        {/* Monthly Kabahat Counts */}
        <div className="mt-8 bg-background-surface rounded-lg border border-neutral-200 p-8 shadow-sm">
          <h3 className="text-heading-md font-semibold text-neutral-900 mb-6">
            Yil-Ay Kabahat Sayilari
          </h3>
          <div className="h-80">
            <Bar data={monthlyData} options={barOptions} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartSection;
