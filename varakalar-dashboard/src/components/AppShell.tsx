import React, { useState } from 'react';
import { LayoutDashboard, BarChart3, TableProperties, Upload, Users, LogOut, Menu, X } from 'lucide-react';
import BrandMark from './BrandMark';
import PrintLetterhead from './PrintLetterhead';
import { useAuth } from '../contexts/useAuth';
import { APP_CONFIG } from '../config';
import { SectionId } from '../types';
import { cn } from '../lib/utils';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'genel', label: 'Genel Bakış', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'analiz', label: 'Analizler', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'kayitlar', label: 'Kayıtlar', icon: <TableProperties className="w-4 h-4" /> },
  { id: 'aktarim', label: 'Veri Aktarımı', icon: <Upload className="w-4 h-4" /> },
  { id: 'yonetim', label: 'Kullanıcı Yönetimi', icon: <Users className="w-4 h-4" />, adminOnly: true },
];

interface AppShellProps {
  section: SectionId;
  onNavigate: (section: SectionId) => void;
  pendingCount?: number;
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ section, onNavigate, pendingCount = 0, children }) => {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const items = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  const navigate = (id: SectionId) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-primary-900 text-primary-100">
      <div className="px-5 h-16 flex items-center border-b border-white/10">
        <BrandMark inverted />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Ana menü">
        {items.map(item => {
          const active = item.id === section;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 h-9 rounded-md text-body transition-colors',
                active ? 'bg-white/10 text-white font-medium' : 'text-primary-200 hover:bg-white/5 hover:text-white'
              )}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'yonetim' && pendingCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-white/15 text-caption text-white flex items-center justify-center tabular-nums">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 mb-2">
          <div className="text-body-sm text-white truncate" title={user?.email}>{user?.email}</div>
          <div className="text-caption text-primary-300">{isAdmin ? 'Yönetici' : 'Kullanıcı'}</div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-body text-primary-200 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-page">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 z-30 no-print">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 no-print" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-lg">{sidebar}</aside>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 left-[16.5rem] p-2 rounded-md bg-white text-neutral-700"
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="lg:pl-60 flex min-h-screen flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 h-14 flex items-center gap-3 px-4 bg-white border-b border-neutral-200 no-print">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-md text-neutral-700" aria-label="Menüyü aç">
            <Menu className="w-5 h-5" />
          </button>
          <BrandMark />
        </header>

        <PrintLetterhead />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</main>

        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-neutral-200 text-caption text-neutral-500 no-print">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {APP_CONFIG.institution} · {APP_CONFIG.department}
            </span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {APP_CONFIG.contactEmail && <a href={`mailto:${APP_CONFIG.contactEmail}`} className="hover:text-neutral-700">{APP_CONFIG.contactEmail}</a>}
              {APP_CONFIG.contactPhone && <span>{APP_CONFIG.contactPhone}</span>}
              {APP_CONFIG.kvkkUrl && (
                <a href={APP_CONFIG.kvkkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-700 underline-offset-2 hover:underline">
                  KVKK Aydınlatma Metni
                </a>
              )}
              <span>Sürüm {APP_CONFIG.version}</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppShell;
