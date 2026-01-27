import React, { useMemo, useState } from 'react';
import StatsSection from '../components/StatsSection';
import TopPlakasSection from '../components/TopPlakasSection';
import ParetoChart from '../components/ParetoChart';
import ChartSection from '../components/ChartSection';
import { Varaka, Ozet, TopPlakaCeza, ParetoAnalizi } from '../types';
import { calculateOzet, calculatePareto, calculateTopPlates } from '../lib/calculations';

interface DashboardPageProps {
  data: {
    varakalar: Varaka[];
    ozet: Ozet;
    top_3_plaka_ceza: TopPlakaCeza[];
    pareto_analizi: ParetoAnalizi[];
  };
  dateRangeText: string;
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const DashboardPage: React.FC<DashboardPageProps> = ({ data, dateRangeText }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract available years from data
  const availableYears = useMemo(() => {
    if (!data?.varakalar) return [];
    const years = new Set(
      data.varakalar
        .map(v => new Date(v.tarih).getFullYear())
        .filter(y => !isNaN(y))
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  // Filter data based on selection
  const filteredVarakalar = useMemo(() => {
    if (!data?.varakalar) return [];

    return data.varakalar.filter(v => {
      const date = new Date(v.tarih);
      const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'all' || (date.getMonth() + 1).toString() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [data, selectedYear, selectedMonth]);

  // Recalculate statistics based on filtered data
  const filteredStats = useMemo(() => {
    return {
      ozet: calculateOzet(filteredVarakalar),
      pareto_analizi: calculatePareto(filteredVarakalar),
      top_3_plaka_ceza: calculateTopPlates(filteredVarakalar)
    };
  }, [filteredVarakalar]);

  // Stats calculations for additional metrics
  const { enYayginKabahat, enYayginKabahatSayisi, kabahatTuruSayisi, ortalamaKabahatSayisi } = useMemo(() => {
    if (!filteredVarakalar.length) return { enYayginKabahat: '-', enYayginKabahatSayisi: 0, kabahatTuruSayisi: 0, ortalamaKabahatSayisi: 0 };

    const kabahatSayaci: Record<string, number> = {};
    filteredVarakalar.forEach((varaka) => {
      kabahatSayaci[varaka.kabahat] = (kabahatSayaci[varaka.kabahat] || 0) + 1;
    });

    const entries = Object.entries(kabahatSayaci);
    if (entries.length === 0) return { enYayginKabahat: '-', enYayginKabahatSayisi: 0, kabahatTuruSayisi: 0, ortalamaKabahatSayisi: 0 };

    const enYaygin = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    
    const turSayisi = entries.length;
    const ortalama = filteredVarakalar.length / turSayisi;
    
    return {
      enYayginKabahat: enYaygin[0],
      enYayginKabahatSayisi: enYaygin[1],
      kabahatTuruSayisi: turSayisi,
      ortalamaKabahatSayisi: Math.round(ortalama)
    };
  }, [filteredVarakalar]);

  return (
    <>
      {/* Filters and Date Range Information */}
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-neutral-700">Yıl:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tüm Yıllar</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-sm font-medium text-neutral-700">Ay:</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tüm Aylar</option>
              {MONTH_NAMES.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div className="ml-auto text-sm text-neutral-500">
            Gösterilen Kayıt: <span className="font-semibold text-neutral-900">{filteredVarakalar.length}</span>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-body font-medium text-blue-900">Zabıt Varaka Tarih Aralığı</h3>
              <p className="text-body-sm text-blue-700 mt-1">
                Yüklenen veriler <span className="font-semibold">{dateRangeText}</span> tarihleri arasını kapsamaktadır.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <StatsSection 
        ozet={filteredStats.ozet} 
        enYayginKabahat={enYayginKabahat}
        enYayginKabahatSayisi={enYayginKabahatSayisi}
        kabahatTuruSayisi={kabahatTuruSayisi}
        ortalamaKabahatSayisi={ortalamaKabahatSayisi}
      />
      
      {/* Top 3 Plaka Section */}
      <TopPlakasSection topPlakaData={filteredStats.top_3_plaka_ceza} />
      
      {/* Chart Sections */}
      <ParetoChart paretoData={filteredStats.pareto_analizi} />
      
      <ChartSection varakalar={filteredVarakalar} />
    </>
  );
};

export default DashboardPage;
