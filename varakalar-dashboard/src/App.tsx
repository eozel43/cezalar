import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import StatsSection from './components/StatsSection';
import TopPlakasSection from './components/TopPlakasSection';
import ParetoChart from './components/ParetoChart';
import ChartSection from './components/ChartSection';
import AdvancedSearchFilter from './components/AdvancedSearchFilter';
import DataTable from './components/DataTable';
import Loading from './components/Loading';
import ExcelUpload from './components/ExcelUpload';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import { useVarakalarData } from './hooks/useVarakalarData';
import { useAuth } from './contexts/useAuth';
import { Varaka } from './types';

function App() {
  const { data, loading, error, refetch } = useVarakalarData();
  const { user, profile } = useAuth();
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [kabahatFilter, setKabahatFilter] = useState('');
  const [cezaTuruFilter, setCezaTuruFilter] = useState('');
  const [showMenCezalari, setShowMenCezalari] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Date range calculation for Zabıt Varaka Tarihi
  const { dateRangeText, dateRangeStart, dateRangeEnd } = useMemo(() => {
    if (!data || !data.varakalar.length) {
      return { dateRangeText: 'Tarih aralığı bulunamadı', dateRangeStart: '', dateRangeEnd: '' };
    }

    // Get all dates from varakalar
    const allDates = data.varakalar
      .map(varaka => varaka.tarih)
      .filter(tarih => tarih && tarih.trim() !== '')
      .map(tarih => new Date(tarih))
      .sort((a, b) => a.getTime() - b.getTime());

    if (allDates.length === 0) {
      return { dateRangeText: 'Tarih bilgisi bulunamadı', dateRangeStart: '', dateRangeEnd: '' };
    }

    const oldestDate = allDates[0];
    const newestDate = allDates[allDates.length - 1];

    // Format dates in Turkish
    const formatTurkishDate = (date: Date) => {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    const oldestDateText = formatTurkishDate(oldestDate);
    const newestDateText = formatTurkishDate(newestDate);
    
    const dateRangeText = `${oldestDateText} - ${newestDateText}`;
    
    return {
      dateRangeText,
      dateRangeStart: oldestDate.toISOString().split('T')[0],
      dateRangeEnd: newestDate.toISOString().split('T')[0]
    };
  }, [data]);

  // Stats calculations
  const { enYayginKabahat, enYayginKabahatSayisi, kabahatList, totalCount } = useMemo(() => {
    if (!data) return { enYayginKabahat: '', enYayginKabahatSayisi: 0, kabahatList: [], totalCount: 0 };

    // Kabahat types counting
    const kabahatSayaci: Record<string, number> = {};
    data.varakalar.forEach((varaka) => {
      kabahatSayaci[varaka.kabahat] = (kabahatSayaci[varaka.kabahat] || 0) + 1;
    });

    // Most common kabahat
    const entries = Object.entries(kabahatSayaci);
    const enYaygin = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    
    return {
      enYayginKabahat: enYaygin[0],
      enYayginKabahatSayisi: enYaygin[1],
      kabahatList: Object.keys(kabahatSayaci).sort(),
      totalCount: data.varakalar.length
    };
  }, [data]);

  // Advanced filtering
  const filteredData = useMemo(() => {
    if (!data) return [];

    let filtered = data.varakalar;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(varaka => 
        varaka.plaka_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        varaka.isim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        varaka.kabahat.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Kabahat filter
    if (kabahatFilter) {
      filtered = filtered.filter(varaka => varaka.kabahat === kabahatFilter);
    }

    // Ceza türü filter
    if (cezaTuruFilter === 'para') {
      filtered = filtered.filter(varaka => varaka.ceza_miktari > 0);
    } else if (cezaTuruFilter === 'men') {
      filtered = filtered.filter(varaka => varaka.ceza_turu === 'men' || varaka.ceza_miktari === 0);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(varaka => {
        const varakaDate = new Date(varaka.tarih);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return varakaDate >= startDate && varakaDate <= endDate;
      });
    }

    // Men cezaları toggle
    if (showMenCezalari) {
      // Sadece men cezalarını göster
      filtered = filtered.filter(varaka => 
        varaka.ceza_turu === 'men' || 
        varaka.ceza_miktari === 0 || 
        (varaka as any).ceza_detay
      );
    }

    return filtered;
  }, [data, searchTerm, kabahatFilter, cezaTuruFilter, showMenCezalari, dateRange]);

  // Loading state
  if (loading) {
    return <Loading />;
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background-page flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-semantic-error/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-heading-md font-semibold text-neutral-900 mb-2">Hata Oluştu</h2>
          <p className="text-body text-neutral-700">{error || 'Veri yüklenirken beklenmeyen bir hata oluştu.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors duration-200"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  // Handle upload click - require auth and active status
  const handleUploadClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (profile?.status !== 'active') {
      alert('Hesabınız henüz onaylanmadı. Lütfen admin onayını bekleyin.');
    } else {
      setShowUploadModal(true);
    }
  };

  // Main application content
  return (
    <div className="min-h-screen bg-background-page">
      <Header 
        onUploadClick={handleUploadClick}
        onAuthClick={() => setShowAuthModal(true)}
        onAdminClick={() => setShowAdminPanel(true)}
      />
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      
      {/* Admin Panel Modal - Only for admins */}
      {showAdminPanel && profile?.role === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-heading-md font-semibold text-neutral-900">
                Admin Paneli
              </h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AdminPanel />
          </div>
        </div>
      )}
      
      {/* Upload Modal - Only for authenticated and active users */}
      {showUploadModal && user && profile?.status === 'active' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-heading-md font-semibold text-neutral-900">
                Excel Dosyası Yükle
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ExcelUpload 
              onUploadComplete={() => {
                setShowUploadModal(false);
                refetch();
              }} 
            />
          </div>
        </div>
      )}
      
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
              <p className="text-caption text-blue-600 mt-1">
                Veri güncellemeleri ile bu aralık otomatik olarak güncellenir.
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
      />
      
      {/* Top 3 Plaka Section */}
      <TopPlakasSection topPlakaData={data.top_3_plaka_ceza} />
      
      {/* Chart Sections */}
      <ParetoChart paretoData={data.pareto_analizi} />
      
      <ChartSection varakalar={data.varakalar} />
      
      {/* Advanced Search & Filter (Moved below charts) */}
      <AdvancedSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        kabahatFilter={kabahatFilter}
        onKabahatFilterChange={setKabahatFilter}
        cezaTuruFilter={cezaTuruFilter}
        onCezaTuruFilterChange={setCezaTuruFilter}
        showMenCezalari={showMenCezalari}
        onShowMenCezalariChange={setShowMenCezalari}
        dateRange={dateRange}
        onDateRangeChange={(start, end) => setDateRange({ start, end })}
        kabahatList={kabahatList}
        totalCount={totalCount}
        filteredCount={filteredData.length}
      />
      
      {/* Data Table */}
      <DataTable 
        data={filteredData} 
        showMenCezalari={showMenCezalari}
      />
      
      {/* Footer */}
      <footer className="py-8 mt-16 border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="text-body-sm text-neutral-500 mb-2">
              © 2026 Varakalar Dashboard - Gelişmiş Trafik Cezası Analiz Sistemi
            </div>
            <div className="text-caption text-neutral-400">
              Emre ÖZEL Endüstri Yük. Mühendisi
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
