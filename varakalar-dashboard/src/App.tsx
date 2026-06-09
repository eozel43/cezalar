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
  const { user, profile, signOut } = useAuth();
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleUploadClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (profile?.status !== 'active') {
      alert('Hesabınız henüz onaylanmadı. Lütfen admin onayını bekleyin.');
    } else {
      setShowUploadModal(true);
    }
  };

  // Escape tuşu ile modalları kapatma desteği
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUploadModal(false);
        setShowAuthModal(false);
        setShowAdminPanel(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // If user is not logged in, render a premium landing page with Header & Footer
  if (!user) {
    return (
      <div className="min-h-screen bg-background-page flex flex-col dark:bg-neutral-950">
        <Header 
          onUploadClick={() => setShowAuthModal(true)}
          onAuthClick={() => setShowAuthModal(true)}
          onAdminClick={() => setShowAdminPanel(true)}
        />
        
        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800/80 p-8 text-center space-y-6 transform hover:scale-[1.02] transition-all duration-300">
            <div className="w-20 h-20 mx-auto bg-primary-50 dark:bg-primary-950/30 rounded-full flex items-center justify-center text-primary-500 dark:text-primary-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Giriş Gerekli
              </h2>
              <p className="text-body text-neutral-600 dark:text-neutral-400 font-normal">
                Varakalar Dashboard ve ceza analizlerini görüntülemek için lütfen sisteme giriş yapın.
              </p>
            </div>
            
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="w-full py-3 px-6 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 active:scale-95 duration-150"
            >
              Giriş Yap
            </button>
          </div>
        </main>
        
        <footer className="py-8 mt-16 border-t border-neutral-200 dark:border-neutral-800">
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

  // If user is logged in but profile status is not active (pending or rejected)
  if (profile?.status !== 'active') {
    const isPending = profile?.status === 'pending';

    return (
      <div className="min-h-screen bg-background-page flex flex-col dark:bg-neutral-950">
        <Header 
          onUploadClick={handleUploadClick}
          onAuthClick={() => setShowAuthModal(true)}
          onAdminClick={() => setShowAdminPanel(true)}
        />
        
        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800/80 p-8 text-center space-y-6 transform hover:scale-[1.02] transition-all duration-300">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              isPending 
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400' 
                : 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400'
            }`}>
              {isPending ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {isPending ? 'Hesap Onay Bekliyor' : 'Erişim Engellendi'}
              </h2>
              <p className="text-body text-neutral-600 dark:text-neutral-400 font-normal">
                {isPending 
                  ? 'Hesabınız başarıyla oluşturuldu ancak henüz onaylanmadı. Lütfen yöneticinin hesabınızı onaylamasını bekleyin.' 
                  : 'Hesabınız onaylanmamış, reddedilmiş veya kısıtlanmış olabilir. Lütfen sistem yöneticisi ile iletişime geçin.'}
              </p>
            </div>
            
            <button 
              onClick={() => signOut()} 
              className="w-full py-3 px-6 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
            >
              Farklı Hesapla Giriş Yap / Çıkış
            </button>
          </div>
        </main>
        
        <footer className="py-8 mt-16 border-t border-neutral-200 dark:border-neutral-800">
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

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background-page flex items-center justify-center dark:bg-neutral-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-semantic-error/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Hata Oluştu</h2>
          <p className="text-body text-neutral-700 dark:text-neutral-300">{error || 'Veri yüklenirken beklenmeyen bir hata oluştu.'}</p>
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
          <div 
            className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 id="admin-modal-title" className="text-heading-md font-semibold text-neutral-900">Admin Paneli</h2>
              <button 
                onClick={() => setShowAdminPanel(false)} 
                aria-label="Kapat"
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
      
      {/* Upload Modal */}
      {showUploadModal && user && profile?.status === 'active' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 id="upload-modal-title" className="text-heading-md font-semibold text-neutral-900">Excel Dosyası Yükle</h2>
              <button 
                onClick={() => setShowUploadModal(false)} 
                aria-label="Kapat"
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
