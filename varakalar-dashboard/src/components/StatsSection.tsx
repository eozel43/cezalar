import React from 'react';
import { TrendingUp, AlertTriangle, FileText, Layers, Hash, BarChart3 } from 'lucide-react';
import { Ozet } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm transition-all duration-250 hover:shadow-md hover:-translate-y-1 hover:scale-102 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <span className="text-body-sm font-medium text-neutral-700 dark:text-neutral-400">{title}</span>
          </div>
          <div className="text-heading-xl font-bold text-neutral-900 dark:text-neutral-200 mb-1">
            {value}
          </div>
          {subtitle && (
            <div className="text-body-sm text-neutral-500 dark:text-neutral-500">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatsSectionProps {
  ozet: Ozet;
  enYayginKabahat?: string;
  enYayginKabahatSayisi?: number;
  kabahatTuruSayisi?: number;
  ortalamaKabahatSayisi?: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ 
  ozet, 
  enYayginKabahat, 
  enYayginKabahatSayisi,
  kabahatTuruSayisi,
  ortalamaKabahatSayisi 
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

  const primaryStats = [
    {
      title: 'Toplam Ceza Sayısı',
      value: ozet.toplam_sayisi.toLocaleString('tr-TR'),
      subtitle: 'Kayıtlı toplam varaka',
      icon: <FileText className="w-6 h-6 text-primary-500" />,
    },
    {
      title: 'Toplam Ceza Tutarı',
      value: formatCurrency(ozet.toplam_ceza_tutari),
      subtitle: 'Tüm cezaların toplam tutarı',
      icon: <TrendingUp className="w-6 h-6 text-primary-500" />,
    },
    {
      title: 'Ortalama Ceza Tutarı',
      value: formatCurrency(ozet.ortalama_ceza),
      subtitle: 'Varaka başına ortalama ceza',
      icon: <AlertTriangle className="w-6 h-6 text-primary-500" />,
    },
  ];

  const kabahatStats = [
    {
      title: 'Farklı Kabahat Türü',
      value: kabahatTuruSayisi?.toLocaleString('tr-TR') || 0,
      subtitle: 'Benzersiz kabahat kategorileri',
      icon: <Layers className="w-6 h-6 text-blue-500" />,
    },
    {
      title: 'Kabahat Sayısı',
      value: ozet.toplam_sayisi.toLocaleString('tr-TR'),
      subtitle: 'Toplam işlenen kabahat',
      icon: <Hash className="w-6 h-6 text-blue-500" />,
    },
    {
      title: 'Ortalama Kabahat Sayısı',
      value: ortalamaKabahatSayisi?.toLocaleString('tr-TR') || 0,
      subtitle: 'Tür başına ortalama sıklık',
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
    },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Ana Finansal İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {primaryStats.map((stat, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Kabahat Detay İstatistikleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kabahatStats.map((stat, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${(index + 3) * 50}ms` }}
            >
              <StatCard {...stat} className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10" />
            </div>
          ))}
        </div>

        {enYayginKabahat && enYayginKabahatSayisi && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-6 py-3 rounded-full border border-primary-200 dark:border-primary-800">
              <AlertTriangle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-primary-900 dark:text-primary-100 font-medium">
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