import React, { useMemo } from 'react';
import StatsSection from '../components/StatsSection';
import TopPlakasSection from '../components/TopPlakasSection';
import ParetoChart from '../components/ParetoChart';
import ChartSection from '../components/ChartSection';
import { Varaka, Ozet, TopPlakaCeza, ParetoAnalizi } from '../types';

interface DashboardPageProps {
  data: {
    varakalar: Varaka[];
    ozet: Ozet;
    top_3_plaka_ceza: TopPlakaCeza[];
    pareto_analizi: ParetoAnalizi[];
  };
  dateRangeText: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ data, dateRangeText }) => {
  // Stats calculations
  const { enYayginKabahat, enYayginKabahatSayisi, kabahatTuruSayisi, ortalamaKabahatSayisi } = useMemo(() => {
    if (!data || !data.varakalar.length) return { enYayginKabahat: '', enYayginKabahatSayisi: 0, kabahatTuruSayisi: 0, ortalamaKabahatSayisi: 0 };

    const kabahatSayaci: Record<string, number> = {};
    data.varakalar.forEach((varaka) => {
      kabahatSayaci[varaka.kabahat] = (kabahatSayaci[varaka.kabahat] || 0) + 1;
    });

    const entries = Object.entries(kabahatSayaci);
    const enYaygin = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    
    const turSayisi = entries.length;
    const ortalama = data.varakalar.length / turSayisi;
    
    return {
      enYayginKabahat: enYaygin[0],
      enYayginKabahatSayisi: enYaygin[1],
      kabahatTuruSayisi: turSayisi,
      ortalamaKabahatSayisi: Math.round(ortalama)
    };
  }, [data]);

  return (
    <>
      {/* Date Range Information */}
      <div className="mx-auto max-w-7xl px-6 py-6">
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
        ozet={data.ozet} 
        enYayginKabahat={enYayginKabahat}
        enYayginKabahatSayisi={enYayginKabahatSayisi}
        kabahatTuruSayisi={kabahatTuruSayisi}
        ortalamaKabahatSayisi={ortalamaKabahatSayisi}
      />
      
      {/* Top 3 Plaka Section */}
      <TopPlakasSection topPlakaData={data.top_3_plaka_ceza} />
      
      {/* Chart Sections */}
      <ParetoChart paretoData={data.pareto_analizi} />
      
      <ChartSection varakalar={data.varakalar} />
    </>
  );
};

export default DashboardPage;
