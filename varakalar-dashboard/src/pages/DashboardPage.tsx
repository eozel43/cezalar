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
      {/* Ergonomic High-Contrast Responsive Sticky Control Ribbon */}
      <div className="sticky top-0 -mt-3 sm:-mt-6 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2.5 sm:py-3.5 mb-6 z-20 bg-white/[0.98] dark:bg-slate-900/[0.98] backdrop-blur-2xl border-b-2 border-indigo-600 dark:border-indigo-500 shadow-xl transition-all">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">


          {/* Left: Prominent Date Range & Last Update Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-start min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-300 dark:border-indigo-700 shadow-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] sm:text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                Zabıt Varaka Tarih Aralığı
              </div>
              <div className="text-xs sm:text-sm font-semibold truncate flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-700 px-2 py-0.5 rounded-md font-extrabold shadow-sm text-xs sm:text-sm">
                  {dateRangeText}
                </span>
                {sonGuncellemeTarihi && (
                  <span className="text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs font-semibold hidden lg:inline">
                    (Son Güncelleme: <span className="text-slate-900 dark:text-white font-bold">{sonGuncellemeTarihi}</span>)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Year/Month Filter Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <label htmlFor="year-select" className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200">Yıl:</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2 py-0.5 sm:py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white"
              >
                <option value="all">Tüm Yıllar</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <label htmlFor="month-select" className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200">Ay:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-0.5 sm:py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-white"
              >
                <option value="all">Tüm Aylar</option>
                {MONTH_NAMES.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>

            {!isExporting && (
              <button
                onClick={downloadPDF}
                disabled={isExporting}
                className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-bold shadow-md active:scale-95 shrink-0"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF İndir</span>
              </button>
            )}

            <div className="text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold shadow-sm shrink-0">
              Kayıt: <span className="font-extrabold text-indigo-700 dark:text-indigo-400 tabular-nums">{filteredVarakalar.length}</span>
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
