import React, { useMemo, useState, useRef } from 'react';
import StatsSection from '../components/StatsSection';
import TopPlakasSection from '../components/TopPlakasSection';
import ParetoChart from '../components/ParetoChart';
import ViolationFrequencyChart from '../components/ViolationFrequencyChart';
import ChartSection from '../components/ChartSection';
import { Varaka, Ozet, TopPlakaCeza, ParetoAnalizi } from '../types';
import { calculateOzet, calculatePareto, calculateTopPlates } from '../lib/calculations';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!dashboardRef.current) return;
    
    setIsExporting(true);
    // Give some time for UI to update (hide buttons if needed)
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#fafafa'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`varakalar-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

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
  const { enYayginKabahat, enYayginKabahatSayisi } = useMemo(() => {
    if (!filteredVarakalar.length) return { enYayginKabahat: '-', enYayginKabahatSayisi: 0 };

    const kabahatSayaci: Record<string, number> = {};
    filteredVarakalar.forEach((varaka) => {
      kabahatSayaci[varaka.kabahat] = (kabahatSayaci[varaka.kabahat] || 0) + 1;
    });

    const entries = Object.entries(kabahatSayaci);
    if (entries.length === 0) return { enYayginKabahat: '-', enYayginKabahatSayisi: 0 };

    const enYaygin = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    
    return {
      enYayginKabahat: enYaygin[0],
      enYayginKabahatSayisi: enYaygin[1]
    };
  }, [filteredVarakalar]);

  // Helper function to compute KPI metrics for a given list of varakalar
  const computeMetrics = (list: Varaka[]) => {
    const totalCount = list.length;
    const totalAmount = list.reduce((sum, v) => sum + v.ceza_miktari, 0);
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    
    // Unique vehicles
    const vehicleCounts: Record<string, number> = {};
    list.forEach(v => {
      const plaka = v.plaka_no?.trim();
      if (plaka) {
        vehicleCounts[plaka] = (vehicleCounts[plaka] || 0) + 1;
      }
    });
    const uniqueVehiclesCount = Object.keys(vehicleCounts).length;
    
    // Repeat offender rate: unique vehicles with >1 penalty / total unique vehicles
    const repeatOffendersCount = Object.values(vehicleCounts).filter(count => count > 1).length;
    const repeatOffenderRate = uniqueVehiclesCount > 0 ? (repeatOffendersCount / uniqueVehiclesCount) * 100 : 0;
    
    // Men penalty rate: ratio of men penalties to total penalties
    const menCount = list.filter(v => v.ceza_turu === 'men').length;
    const menPenaltyRate = totalCount > 0 ? (menCount / totalCount) * 100 : 0;
    
    // Different violation category count
    const uniqueKabahats = new Set(list.map(v => v.kabahat).filter(Boolean));
    const kabahatTuruSayisi = uniqueKabahats.size;
    
    return {
      totalCount,
      totalAmount,
      averageAmount,
      uniqueVehiclesCount,
      repeatOffenderRate,
      menPenaltyRate,
      kabahatTuruSayisi
    };
  };

  // Get varakalar for the previous period to calculate trends
  const previousPeriodVarakalar = useMemo(() => {
    if (!data?.varakalar) return [];
    if (selectedYear === 'all') return []; // No trend comparison if all time is selected

    const currentYearNum = parseInt(selectedYear);
    let prevYear: string | null = null;
    let prevMonth: string | null = null;

    if (selectedMonth === 'all') {
      prevYear = (currentYearNum - 1).toString();
      prevMonth = 'all';
    } else {
      const currentMonthNum = parseInt(selectedMonth);
      if (currentMonthNum === 1) {
        prevYear = (currentYearNum - 1).toString();
        prevMonth = '12';
      } else {
        prevYear = selectedYear;
        prevMonth = (currentMonthNum - 1).toString();
      }
    }

    return data.varakalar.filter(v => {
      const date = new Date(v.tarih);
      const yearMatch = date.getFullYear().toString() === prevYear;
      const monthMatch = prevMonth === 'all' || (date.getMonth() + 1).toString() === prevMonth;
      return yearMatch && monthMatch;
    });
  }, [data, selectedYear, selectedMonth]);

  // Compute metrics and their relative percentage changes
  const metrics = useMemo(() => {
    const current = computeMetrics(filteredVarakalar);
    const previous = computeMetrics(previousPeriodVarakalar);
    
    const calculateChange = (curr: number, prev: number) => {
      if (selectedYear === 'all') return undefined;
      if (prev === 0) return undefined;
      return ((curr - prev) / prev) * 100;
    };
    
    return {
      current,
      changes: {
        totalCount: calculateChange(current.totalCount, previous.totalCount),
        totalAmount: calculateChange(current.totalAmount, previous.totalAmount),
        averageAmount: calculateChange(current.averageAmount, previous.averageAmount),
        uniqueVehiclesCount: calculateChange(current.uniqueVehiclesCount, previous.uniqueVehiclesCount),
        repeatOffenderRate: calculateChange(current.repeatOffenderRate, previous.repeatOffenderRate),
        menPenaltyRate: calculateChange(current.menPenaltyRate, previous.menPenaltyRate),
        kabahatTuruSayisi: calculateChange(current.kabahatTuruSayisi, previous.kabahatTuruSayisi)
      }
    };
  }, [filteredVarakalar, previousPeriodVarakalar, selectedYear]);

  // Dynamic label for comparison periods
  const selectedPeriodLabel = useMemo(() => {
    if (selectedYear === 'all') return '';
    if (selectedMonth === 'all') return 'Önceki yıla göre';
    return 'Önceki aya göre';
  }, [selectedYear, selectedMonth]);

  // Son güncelleme tarihi hesaplama (En yeni created_at değeri)
  const sonGuncellemeTarihi = useMemo(() => {
    if (!data?.varakalar || data.varakalar.length === 0) return '';
    
    const validDates = data.varakalar
      .map(v => v.created_at ? new Date(v.created_at) : null)
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
      
    if (validDates.length === 0) return '';
    
    const latestDate = new Date(Math.max(...validDates.map(d => d.getTime())));
    return latestDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [data]);

  return (
    <div ref={dashboardRef} className="pb-12">
      {/* Filters and Date Range Information */}
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-4">
        {/* Info Alert */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-body font-medium text-blue-900 dark:text-blue-100">Zabıt Varaka Tarih Aralığı</h3>
              <p className="text-body-sm text-blue-700 dark:text-blue-300 mt-1">
                Yüklenen veriler <span className="font-semibold">{dateRangeText}</span> tarihleri arasını kapsamaktadır.
                {sonGuncellemeTarihi && (
                  <span className="block sm:inline sm:ml-2 text-blue-600 dark:text-blue-400 font-semibold">
                    (Son Güncelleme: {sonGuncellemeTarihi})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-[105px] z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Yıl:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-neutral-200"
            >
              <option value="all">Tüm Yıllar</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Ay:</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-neutral-200"
            >
              <option value="all">Tüm Aylar</option>
              {MONTH_NAMES.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            {!isExporting && (
              <button
                onClick={downloadPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors text-sm font-medium shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF İndir
              </button>
            )}
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Gösterilen Kayıt: <span className="font-semibold text-neutral-900 dark:text-neutral-200">{filteredVarakalar.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <StatsSection 
        metrics={metrics.current} 
        changes={metrics.changes}
        enYayginKabahat={enYayginKabahat}
        enYayginKabahatSayisi={enYayginKabahatSayisi}
        selectedPeriodLabel={selectedPeriodLabel}
      />
      
      {/* Top 3 Plaka Section */}
      <TopPlakasSection topPlakaData={filteredStats.top_3_plaka_ceza} />
      
      {/* Chart Sections (reverted to single row layouts for readability) */}
      <div className="no-pdf-break py-6 max-w-7xl mx-auto px-6">
        <ParetoChart paretoData={filteredStats.pareto_analizi} />
      </div>
      
      <div className="no-pdf-break py-6 max-w-7xl mx-auto px-6">
        <ViolationFrequencyChart varakalar={filteredVarakalar} />
      </div>
      
      <div className="no-pdf-break">
        <ChartSection varakalar={filteredVarakalar} />
      </div>
    </div>
  );
};

export default DashboardPage;
