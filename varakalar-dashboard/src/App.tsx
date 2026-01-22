import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Loading from './components/Loading';
import ExcelUpload from './components/ExcelUpload';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import DashboardPage from './pages/DashboardPage';
import DetailsPage from './pages/DetailsPage';
import { useVarakalarData } from './hooks/useVarakalarData';
import { useAuth } from './contexts/useAuth';

function AppContent() {
  const { data, loading, error, refetch } = useVarakalarData();
  const { user, profile } = useAuth();
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Date range calculation for Header/Global info
  const { dateRangeText } = useMemo(() => {
    if (!data || !data.varakalar.length) {
      return { dateRangeText: 'Tarih aralığı bulunamadı' };
    }

    const allDates = data.varakalar
      .map(varaka => varaka.tarih)
      .filter(tarih => tarih && tarih.trim() !== '')
      .map(tarih => new Date(tarih))
      .sort((a, b) => a.getTime() - b.getTime());

    if (allDates.length === 0) {
      return { dateRangeText: 'Tarih bilgisi bulunamadı' };
    }

    const oldestDate = allDates[0];
    const newestDate = allDates[allDates.length - 1];

    const formatTurkishDate = (date: Date) => {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    return {
      dateRangeText: `${formatTurkishDate(oldestDate)} - ${formatTurkishDate(newestDate)}`
    };
  }, [data]);

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

  const handleUploadClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (profile?.status !== 'active') {
      alert('Hesabınız henüz onaylanmadı. Lütfen admin onayını bekleyin.');
    } else {
      setShowUploadModal(true);
    }
  };

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
      
      {/* Admin Panel Modal */}
      {showAdminPanel && profile?.role === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-heading-md font-semibold text-neutral-900">Admin Paneli</h2>
              <button onClick={() => setShowAdminPanel(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AdminPanel />
          </div>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && user && profile?.status === 'active' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-heading-md font-semibold text-neutral-900">Excel Dosyası Yükle</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
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
      
      <main className="mx-auto max-w-7xl">
        <Routes>
          <Route path="/" element={<DashboardPage data={data} dateRangeText={dateRangeText} />} />
          <Route path="/detay" element={<DetailsPage varakalar={data.varakalar} />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="py-8 mt-16 border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="text-body-sm text-neutral-500 mb-2">
            © 2026 Varakalar Dashboard - Gelişmiş Trafik Cezası Analiz Sistemi
          </div>
          <div className="text-caption text-neutral-400">
            Emre ÖZEL Endüstri Yük. Mühendisi
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
