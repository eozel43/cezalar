import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, Database } from 'lucide-react';
import AppShell from './components/AppShell';
import LoginPage from './components/LoginPage';
import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import TopPlatesTable from './components/TopPlatesTable';
import DataTable from './components/DataTable';
import ExcelUpload from './components/ExcelUpload';
import AdminPanel from './components/AdminPanel';
import ParetoChart from './components/charts/ParetoChart';
import KabahatBarChart from './components/charts/KabahatBarChart';
import MonthlyTrendChart from './components/charts/MonthlyTrendChart';
import WeekdayChart from './components/charts/WeekdayChart';
import { Button, Card, EmptyState, PageHeader, Skeleton } from './components/ui';
import { useVarakalarData } from './hooks/useVarakalarData';
import { useAuth } from './contexts/useAuth';
import { supabase } from './lib/supabase';
import { applyFilters, applyFiltersForPeriod, calculateOzet, dataPeriod, previousPeriod } from './lib/stats';
import { formatDateTime, formatLongDate } from './lib/format';
import { EMPTY_FILTERS, Filters, SectionId } from './types';

const SECTIONS: SectionId[] = ['genel', 'analiz', 'kayitlar', 'aktarim', 'yonetim'];

const sectionFromHash = (): SectionId => {
  const id = window.location.hash.replace('#', '') as SectionId;
  return SECTIONS.includes(id) ? id : 'genel';
};

const SECTION_META: Record<SectionId, { title: string; description: string }> = {
  genel: { title: 'Genel Bakış', description: 'Seçili döneme ait temel göstergeler' },
  analiz: { title: 'Analizler', description: 'Kabahat türleri ve zamana göre dağılımlar' },
  kayitlar: { title: 'Kayıtlar', description: 'Varaka kayıtlarının ayrıntılı listesi' },
  aktarim: { title: 'Veri Aktarımı', description: 'Excel dosyasından varaka kayıtlarını içe aktarın' },
  yonetim: { title: 'Kullanıcı Yönetimi', description: 'Sisteme erişim taleplerini yönetin' },
};

const DashboardSkeleton: React.FC = () => (
  <div aria-busy="true" aria-label="Veriler yükleniyor">
    <Skeleton className="h-24 mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
    <Skeleton className="h-80" />
  </div>
);

function App() {
  const { user, profile, loading: authLoading } = useAuth();
  const isActive = !!user && profile?.status === 'active';
  const isAdmin = isActive && profile?.role === 'admin';
  const { varakalar, loading, error, refetch } = useVarakalarData(isActive);

  const [section, setSection] = useState<SectionId>(sectionFromHash);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (id: SectionId) => {
    window.location.hash = id;
    setSection(id);
    window.scrollTo({ top: 0 });
  };

  const refreshPendingCount = useCallback(async () => {
    if (!isAdmin) return;
    const { count } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingCount(count || 0);
  }, [isAdmin]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const period = useMemo(() => dataPeriod(varakalar), [varakalar]);
  const kabahatList = useMemo(() => [...new Set(varakalar.map(v => v.kabahat))].sort((a, b) => a.localeCompare(b, 'tr-TR')), [varakalar]);
  const filtered = useMemo(() => applyFilters(varakalar, filters), [varakalar, filters]);
  const ozet = useMemo(() => calculateOzet(filtered), [filtered]);

  // KPI comparison with the equally long period right before the selected range
  const previousOzet = useMemo(() => {
    const prev = previousPeriod(filters.start, filters.end);
    return prev ? calculateOzet(applyFiltersForPeriod(varakalar, filters, prev.start, prev.end)) : null;
  }, [varakalar, filters]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-page">
        <Skeleton className="w-64 h-6" />
      </div>
    );
  }

  // Records contain personal data: only approved users may see them
  if (!user) return <LoginPage />;
  if (!isActive) return <LoginPage status={profile?.status === 'rejected' ? 'rejected' : 'pending'} />;

  const activeSection = section === 'yonetim' && !isAdmin ? 'genel' : section;
  const meta = SECTION_META[activeSection];
  const usesData = activeSection === 'genel' || activeSection === 'analiz' || activeSection === 'kayitlar';

  const showPlate = (plaka: string) => {
    setFilters({ ...filters, searchTerm: plaka });
    navigate('kayitlar');
  };

  const renderDataSection = () => {
    if (loading) return <DashboardSkeleton />;

    if (error) {
      return (
        <Card>
          <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Veriler yüklenemedi" description={error} />
          <div className="pb-8 text-center">
            <Button onClick={refetch}>Tekrar Dene</Button>
          </div>
        </Card>
      );
    }

    if (!varakalar.length) {
      return (
        <Card>
          <EmptyState icon={<Database className="w-8 h-8" />} title="Henüz kayıt yok" description="Başlamak için Excel dosyasından varaka kayıtlarını aktarın." />
          <div className="pb-8 text-center">
            <Button variant="primary" onClick={() => navigate('aktarim')}>Veri Aktarımına Git</Button>
          </div>
        </Card>
      );
    }

    return (
      <>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          kabahatList={kabahatList}
          dataEnd={period?.end || ''}
          totalCount={varakalar.length}
          filteredCount={filtered.length}
        />

        {activeSection === 'genel' && (
          <>
            <KpiCards ozet={ozet} previous={previousOzet} />
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3">
                <MonthlyTrendChart varakalar={filtered} />
              </div>
              <div className="xl:col-span-2">
                <TopPlatesTable varakalar={filtered} onSelect={showPlate} />
              </div>
            </div>
          </>
        )}

        {activeSection === 'analiz' && (
          <div className="space-y-6">
            <ParetoChart varakalar={filtered} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <KabahatBarChart varakalar={filtered} />
              <WeekdayChart varakalar={filtered} />
            </div>
          </div>
        )}

        {activeSection === 'kayitlar' && <DataTable data={filtered} />}
      </>
    );
  };

  return (
    <AppShell section={activeSection} onNavigate={navigate} pendingCount={pendingCount}>
      <PageHeader
        title={meta.title}
        description={meta.description}
      />

      {usesData && period && !loading && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 -mt-3 mb-5 text-body-sm text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange className="w-4 h-4" />
            Veri dönemi: <span className="text-neutral-700">{formatLongDate(period.start)} – {formatLongDate(period.end)}</span>
          </span>
          {period.lastImport && (
            <span>
              Son aktarım: <span className="text-neutral-700">{formatDateTime(period.lastImport)}</span>
            </span>
          )}
        </div>
      )}

      {usesData && renderDataSection()}

      {activeSection === 'aktarim' && <ExcelUpload onUploadComplete={refetch} />}

      {activeSection === 'yonetim' && isAdmin && <AdminPanel onPendingChange={refreshPendingCount} />}
    </AppShell>
  );
}

export default App;
