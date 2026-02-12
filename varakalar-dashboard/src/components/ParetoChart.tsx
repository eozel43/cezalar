import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import { ParetoAnalizi } from '../types';
import { useTheme } from 'next-themes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface ParetoChartProps {
  paretoData: ParetoAnalizi[];
  className?: string;
}

const ParetoChart: React.FC<ParetoChartProps> = ({ paretoData, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#A3A3A3' : '#404040'; // neutral-400 equivalent for labels
  const gridColor = isDark ? '#262626' : '#E5E5E5';
  const titleColor = isDark ? '#E5E5E5' : '#171717'; // neutral-200 equivalent for titles

  const labels = paretoData.map(item => 
    item.kabahat.length > 30 ? 
    item.kabahat.substring(0, 30) + '...' : 
    item.kabahat
  );
  
  const barData = paretoData.map(item => item.count);
  const lineData = paretoData.map(item => item.cumulative_percentage);

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Ceza Sayısı',
        data: barData,
        backgroundColor: '#0066FF',
        borderColor: '#0066FF',
        borderWidth: 1,
        yAxisID: 'y',
        borderRadius: 8,
      },
      {
        type: 'line' as const,
        label: 'Kümülatif %',
        data: lineData,
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        borderWidth: 3,
        fill: false,
        yAxisID: 'y1',
        tension: 0.1,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#EF4444',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
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
          color: textColor,
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Pareto Analizi - Kabahat Türleri',
        font: {
          family: 'Inter',
          size: 16,
          weight: 600,
        },
        color: titleColor,
        padding: 20,
      },
      tooltip: {
        backgroundColor: isDark ? '#262626' : '#171717',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: isDark ? '#404040' : '#E5E5E5',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return paretoData[context[0].dataIndex]?.kabahat || '';
          },
          label: (context: any) => {
            const dataIndex = context.dataIndex;
            const paretoItem = paretoData[dataIndex];
            
            if (context.dataset.label === 'Ceza Sayısı') {
              return `Ceza Sayısı: ${paretoItem?.count}`;
            } else {
              return `Kümülatif: ${paretoItem?.cumulative_percentage.toFixed(1)}%`;
            }
          },
        },
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
      },
      annotation: {
        annotations: {
          line80: {
            type: 'line' as const,
            yMin: 80,
            yMax: 80,
            yScaleID: 'y1',
            borderColor: '#F59E0B',
            borderWidth: 2,
            borderDash: [8, 4],
            label: {
              display: true,
              content: '%80 Kuralı',
              position: 'end' as const,
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              font: {
                family: 'Inter',
                size: 12,
                weight: 600,
              },
              padding: {
                top: 4,
                right: 8,
                bottom: 4,
                left: 8,
              },
            },
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Kabahat Türleri',
          font: {
            family: 'Inter',
            size: 12,
            weight: 500,
          },
          color: textColor,
        },
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 10,
          },
          color: textColor,
          maxRotation: 45,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Ceza Sayısı',
          font: {
            family: 'Inter',
            size: 12,
            weight: 500,
          },
          color: '#0066FF',
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
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Kümülatif Yüzde (%)',
          font: {
            family: 'Inter',
            size: 12,
            weight: 500,
          },
          color: '#EF4444',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 12,
          },
          color: textColor,
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
    animation: {
      duration: 300,
    },

  };

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-200">
              Pareto Analizi - Kabahat Dağılımı
            </h3>
            <div className="flex items-center gap-4 text-body-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-500 rounded"></div>
                <span>Ceza Sayısı</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-semantic-error rounded"></div>
                <span>Kümülatif %</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-semantic-warning" style={{borderTop: '2px dashed #F59E0B'}}></div>
                <span>%80 Kuralı</span>
              </div>
            </div>
          </div>
          <div className="h-96">
            <Chart type="bar" data={data} options={options} />
          </div>
          <div className="mt-4 text-body-sm text-neutral-600 dark:text-neutral-400">
            <p>
              <strong>Analiz:</strong> İlk 4 kabahat türü toplam cezaların %80'ini oluşturuyor. 
              Bu alanlara odaklanarak cezaları %80 oranında azaltmak mümkün.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParetoChart;
