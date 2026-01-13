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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="bg-background-surface rounded-lg border border-neutral-200 p-8 shadow-sm">
            <h3 className="text-heading-md font-semibold text-neutral-900 mb-6">
              Pasta Grafik - Kabahat Dağılımı
            </h3>
            <div className="h-80">
              <Pie data={pieData} options={options} />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-background-surface rounded-lg border border-neutral-200 p-8 shadow-sm">
            <h3 className="text-heading-md font-semibold text-neutral-900 mb-6">
              Bar Grafik - Kabahat Frekansı
            </h3>
            <div className="h-80">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-700">{Object.keys(kabahatDagilimi).length}</div>
              <div className="text-body-sm text-primary-600">Farklı Kabahat Türü</div>
            </div>
          </div>
          
          <div className="bg-semantic-success/10 rounded-lg p-4 border border-semantic-success/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-semantic-success">
                {Math.max(...Object.values(kabahatDagilimi))}
              </div>
              <div className="text-body-sm text-semantic-success">En Sık Kabahat Sayısı</div>
            </div>
          </div>
          
          <div className="bg-semantic-warning/10 rounded-lg p-4 border border-semantic-warning/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-semantic-warning">
                {(Object.values(kabahatDagilimi).reduce((a, b) => a + b, 0) / Object.keys(kabahatDagilimi).length).toFixed(1)}
              </div>
              <div className="text-body-sm text-semantic-warning">Ortalama Kabahat Sayısı</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartSection;
