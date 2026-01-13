import React from 'react';
import { Trophy, Car, DollarSign } from 'lucide-react';
import { TopPlakaCeza } from '../types';

interface TopPlakaCardProps {
  data: TopPlakaCeza;
  rank: number;
  className?: string;
}

const TopPlakaCard: React.FC<TopPlakaCardProps> = ({ data, rank, className = '' }) => {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-primary-400 to-primary-600';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`bg-background-surface rounded-lg border border-neutral-200 p-6 shadow-sm transition-all duration-250 hover:shadow-md hover:-translate-y-1 ${className}`}>
      {/* Rank Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-body-sm font-semibold text-white bg-gradient-to-r ${getRankColor(rank)}`}>
          <span className="text-lg">{getRankIcon(rank)}</span>
          <span>#{rank}</span>
        </div>
        <Trophy className="w-5 h-5 text-neutral-400" />
      </div>

      {/* Plaka No */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Car className="w-4 h-4 text-primary-500" />
          <span className="text-body-sm font-medium text-neutral-700">Plaka No</span>
        </div>
        <div className="text-heading-md font-bold text-neutral-900">
          {data.plaka}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Toplam Ceza */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-semantic-success" />
            <span className="text-body-sm font-medium text-neutral-700">Toplam</span>
          </div>
          <div className="text-body font-bold text-semantic-success">
            {formatCurrency(data.toplam_ceza)}
          </div>
        </div>

        {/* Ceza Sayısı */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="w-4 h-4 text-center text-body-sm font-bold text-semantic-warning">#</span>
            <span className="text-body-sm font-medium text-neutral-700">Sayı</span>
          </div>
          <div className="text-body font-bold text-semantic-warning">
            {data.ceza_sayisi}
          </div>
        </div>
      </div>

      {/* Ortalama */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="text-center">
          <span className="text-body-sm text-neutral-500">Ortalama Ceza: </span>
          <span className="text-body font-semibold text-neutral-900">
            {formatCurrency(data.ortalama_ceza)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface TopPlakasSectionProps {
  topPlakaData: TopPlakaCeza[];
  className?: string;
}

const TopPlakasSection: React.FC<TopPlakasSectionProps> = ({ topPlakaData, className = '' }) => {
  return (
    <section className={`py-8 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h2 className="text-heading-lg font-semibold text-neutral-900 mb-2">
            🏆 En Çok Ceza Alan Araçlar
          </h2>
          <p className="text-body text-neutral-600">
            Top 3 plaka ve ceza analizi - Bu araçlar özel takip gerektirir
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPlakaData.map((plaka, index) => (
            <div
              key={plaka.plaka}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <TopPlakaCard 
                data={plaka} 
                rank={index + 1}
              />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-primary-600" />
            <span className="text-body font-semibold text-primary-900">Analiz Özeti</span>
          </div>
          <div className="text-body-sm text-primary-800">
            Top 3 plaka toplam <strong>{topPlakaData.reduce((sum, p) => sum + p.toplam_ceza, 0).toLocaleString('tr-TR')} TL</strong> 
            ceza almış ve <strong>{topPlakaData.reduce((sum, p) => sum + p.ceza_sayisi, 0)}</strong> adet ihlal yapmış. 
            Bu araçların ceza almayı azaltması için özel eğitim ve takip programı önerilir.
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopPlakasSection;
