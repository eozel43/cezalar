import React from 'react';
import { TrendingUp, AlertTriangle, FileText, Hash, BarChart3, ArrowUpRight, ArrowDownRight, Layers, Coins } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  className?: string;
  change?: number;
  comparisonLabel?: string;
  invertTrend?: boolean;
}

const TrendBadge: React.FC<{ change: number | undefined; label: string; invertTrend?: boolean }> = ({ change, label, invertTrend = false }) => {
  if (change === undefined) return null;
  
  const isZero = Math.abs(change) < 0.01;
  const isPositive = change > 0;
  
  let colorClass = '';
  let Icon = null;
  
  if (isZero) {
    colorClass = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  } else if (isPositive) {
    colorClass = invertTrend 
      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' 
      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
    Icon = ArrowUpRight;
  } else {
    colorClass = invertTrend 
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
    Icon = ArrowDownRight;
  }
  
  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${colorClass}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {isZero ? 'Değişim yok' : `${isPositive ? '+' : ''}${change.toFixed(1)}%`}
      </span>
      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">
        {label}
      </span>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  className = '', 
  change, 
  comparisonLabel, 
  invertTrend = false 
}) => {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800/80 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-800/80">
              {icon}
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider truncate">{title}</span>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 mb-1 truncate tracking-tight tabular-nums">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-neutral-500 truncate text-ellipsis overflow-hidden font-normal">
              {subtitle}
            </div>
          )}
          {comparisonLabel && (
            <TrendBadge change={change} label={comparisonLabel} invertTrend={invertTrend} />
          )}
        </div>
      </div>
    </div>
  );
};


interface StatsSectionProps {
  metrics: {
    totalCount: number;
    totalAmount: number;
    averageAmount: number;
    uniqueVehiclesCount: number;
    repeatOffenderRate: number;
    menPenaltyRate: number;
    kabahatTuruSayisi: number;
  };
  changes: {
    totalCount?: number;
    totalAmount?: number;
    averageAmount?: number;
    uniqueVehiclesCount?: number;
    repeatOffenderRate?: number;
    menPenaltyRate?: number;
    kabahatTuruSayisi?: number;
  };
  enYayginKabahat?: string;
  enYayginKabahatSayisi?: number;
  selectedPeriodLabel?: string;
}

const StatsSection: React.FC<StatsSectionProps> = ({ 
  metrics, 
  changes,
  enYayginKabahat, 
  enYayginKabahatSayisi,
  selectedPeriodLabel
}) => {
  // Para formatı için yardımcı fonksiyon
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const row1Stats = [
    {
      title: 'Toplam Ceza Sayısı',
      value: metrics.totalCount.toLocaleString('tr-TR'),
      subtitle: 'Kayıtlı toplam varaka',
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      change: changes.totalCount,
      comparisonLabel: selectedPeriodLabel,
      invertTrend: true, // Ceza sayısı artışı kötüdür (kırmızı)
      className: 'border-indigo-100 dark:border-indigo-900/30'
    },
    {
      title: 'Toplam Ceza Tutarı',
      value: formatCurrency(metrics.totalAmount),
      subtitle: 'Cezaların toplamı',
      icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
      change: changes.totalAmount,
      comparisonLabel: selectedPeriodLabel,
      invertTrend: true, // Ceza tutarı artışı kötüdür (kırmızı)
      className: 'border-amber-100 dark:border-amber-900/30 font-semibold'
    },
    {
      title: 'Ortalama Ceza Tutarı',
      value: formatCurrency(metrics.averageAmount),
      subtitle: 'Varaka başına ortalama ceza',
      icon: <Coins className="w-5 h-5 text-yellow-500" />,
      change: changes.averageAmount,
      comparisonLabel: selectedPeriodLabel,
      invertTrend: true, // Ortalama ceza artışı kötüdür (kırmızı)
      className: 'border-yellow-100 dark:border-yellow-900/30'
    },
  ];

  const row2Stats = [
    {
      title: 'Benzersiz Araç Sayısı',
      value: metrics.uniqueVehiclesCount.toLocaleString('tr-TR'),
      subtitle: 'Ceza alan farklı araçlar',
      icon: <Hash className="w-5 h-5 text-blue-500" />,
      change: changes.uniqueVehiclesCount,
      comparisonLabel: selectedPeriodLabel,
      invertTrend: true, // Araç sayısı artışı kötüdür (kırmızı)
      className: 'border-blue-100 dark:border-blue-900/30'
    },
    {
      title: 'Mükerrer İhlal Oranı',
      value: `%${metrics.repeatOffenderRate.toFixed(1)}`,
      subtitle: 'Birden fazla ceza alanlar',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      change: changes.repeatOffenderRate,
      comparisonLabel: selectedPeriodLabel,
      invertTrend: true, // Mükerrer oranı artışı kötüdür (kırmızı)
      className: 'border-rose-100 dark:border-rose-900/30'
    },
    {
      title: 'Men Cezası Oranı',
      value: `%${metrics.menPenaltyRate.toFixed(1)}`,
      subtitle: 'Men edilen araçların oranı',
      icon: <BarChart3 className="w-5 h-5 text-emerald-500" />,
      change: changes.menPenaltyRate,
      comparisonLabel: selectedPeriodLabel,
      invertTrend: false, // Men cezası oranı artışı yeşildir
      className: 'border-emerald-100 dark:border-emerald-900/30'
    },
    {
      title: 'Farklı Kabahat Türü',
      value: metrics.kabahatTuruSayisi.toLocaleString('tr-TR'),
      subtitle: 'Benzersiz ihlal kategorileri',
      icon: <Layers className="w-5 h-5 text-sky-500" />,
      change: changes.kabahatTuruSayisi,
      comparisonLabel: selectedPeriodLabel,
      invertTrend: true, // İhlal çeşitliliği artışı kötüdür (kırmızı)
      className: 'border-sky-100 dark:border-sky-900/30'
    },
  ];

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Row 1 KPI Grid (3 columns for financial/general totals - gives more horizontal width) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {row1Stats.map((stat, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Row 2 KPI Grid (4 columns for detailed indicators) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {row2Stats.map((stat, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${(index + 3) * 50}ms` }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {enYayginKabahat && enYayginKabahatSayisi && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 rounded-full border border-indigo-200 dark:border-indigo-800">
              <AlertTriangle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-indigo-900 dark:text-indigo-100 font-medium">
                En yaygın kabahat: <span className="font-bold">{enYayginKabahat}</span> ({enYayginKabahatSayisi.toLocaleString('tr-TR')} adet)
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsSection;
