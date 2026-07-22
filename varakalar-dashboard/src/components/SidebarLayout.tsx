import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Table,
  ShieldCheck,
  UploadCloud,
  LogOut,
  Sun,
  Moon,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Layers,
  Sparkles,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

import { Varaka } from '../types';

interface SidebarLayoutProps {
  children: React.ReactNode;
  onUploadClick: () => void;
  onAuthClick: () => void;
  onAdminClick: () => void;
  onToggleViewMode: () => void;
  varakalar?: Varaka[];
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  onUploadClick,
  onAuthClick,
  onAdminClick,
  onToggleViewMode,
  varakalar
}) => {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  // Collapsed & Mobile drawer state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Notification popover state
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationKeys, setReadNotificationKeys] = useState<Set<string>>(() => {
    try {
      const storedKeys = JSON.parse(localStorage.getItem('read_notification_keys') || '[]');
      return new Set(Array.isArray(storedKeys) ? storedKeys.filter((key): key is string => typeof key === 'string') : []);
    } catch {
      return new Set();
    }
  });
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showNotifications) return;

    notificationPanelRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !notificationPanelRef.current?.contains(target) &&
        !notificationButtonRef.current?.contains(target)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        notificationButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  // Compute 100% REAL DYNAMIC SYSTEM NOTIFICATIONS from actual database records
  const notifications = React.useMemo(() => {
    if (!varakalar || varakalar.length === 0) {
      return [
        {
          id: 1,
          title: 'Sistem Bağlantısı',
          time: 'Canlı',
          desc: 'Sistemde henüz yüklenmiş zabıt varakası verisi bulunmuyor.',
          unread: false
        }
      ];
    }

    const totalCount = varakalar.length;
    const menCount = varakalar.filter(v => v.ceza_turu === 'men').length;

    // Highest violation plate
    const plakaCounts: Record<string, number> = {};
    varakalar.forEach(v => {
      const p = v.plaka_no?.trim();
      if (p) plakaCounts[p] = (plakaCounts[p] || 0) + 1;
    });
    const sortedPlakas = Object.entries(plakaCounts).sort((a, b) => b[1] - a[1]);
    const topPlaka = sortedPlakas[0];

    // Most common violation
    const kabahatCounts: Record<string, number> = {};
    varakalar.forEach(v => {
      if (v.kabahat) kabahatCounts[v.kabahat] = (kabahatCounts[v.kabahat] || 0) + 1;
    });
    const sortedKabahats = Object.entries(kabahatCounts).sort((a, b) => b[1] - a[1]);
    const topKabahat = sortedKabahats[0];

    const items = [];

    // 1. Data sync status
    items.push({
      id: 1,
      title: 'Veri Senkronizasyonu',
      time: 'Canlı Sistem',
      desc: `Sistemde ${totalCount.toLocaleString('tr-TR')} adet aktif zabıt varaka kaydı bulunmaktadır.`,
      unread: true
    });

    // 2. High risk repeat offender plate
    if (topPlaka && topPlaka[1] > 1) {
      items.push({
        id: 2,
        title: 'Mükerrer İhlal Tespiti',
        time: 'Risk Tespiti',
        desc: `${topPlaka[0]} plakalı araç toplam ${topPlaka[1]} ceza ile en yüksek mükerrer ihlal kaydına sahiptir.`,
        unread: true
      });
    }

    // 3. Dominant violation type
    if (topKabahat) {
      const percentage = ((topKabahat[1] / totalCount) * 100).toFixed(1);
      const titleShort = topKabahat[0].length > 35 ? topKabahat[0].substring(0, 35) + '...' : topKabahat[0];
      items.push({
        id: 3,
        title: 'Baskın İhlal Kategorisi',
        time: 'Analiz',
        desc: `En çok işlenen kabahat: "${titleShort}" (%${percentage}).`,
        unread: false
      });
    }

    // 4. Men penalties
    if (menCount > 0) {
      items.push({
        id: 4,
        title: 'Trafikten Men Cezası',
        time: 'Sistem Kaydı',
        desc: `Toplam ${menCount.toLocaleString('tr-TR')} adet araç için men cezası verilmiştir.`,
        unread: false
      });
    }

    return items;
  }, [varakalar]);

  const getNotificationKey = (notification: (typeof notifications)[number]) =>
    `${notification.id}:${notification.desc}`;

  const unreadCount = notifications.filter(
    notification => notification.unread && !readNotificationKeys.has(getNotificationKey(notification))
  ).length;

  const handleNotificationsToggle = () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);

    if (nextOpen) {
      const updatedKeys = new Set(readNotificationKeys);
      notifications.forEach(notification => {
        if (notification.unread) updatedKeys.add(getNotificationKey(notification));
      });
      setReadNotificationKeys(updatedKeys);
      localStorage.setItem('read_notification_keys', JSON.stringify([...updatedKeys]));
    }
  };


  const navItems = [
    {
      label: 'Dashboard',
      subtitle: 'Genel Analiz & KPI',
      path: '/',
      icon: LayoutDashboard
    },
    {
      label: 'Detaylı Arama',
      subtitle: 'Filtreler & Tablo',
      path: '/detay',
      icon: Table
    }
  ];

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans antialiased">
      {/* Top Banner: 1-Click Rollback / View Switcher Alert */}
      <div className="shrink-0 bg-slate-900 dark:bg-neutral-900 border-b border-slate-800 text-slate-200 px-4 py-2 text-xs sm:text-sm flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold text-[11px]">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            ENTERPRISE GÖRÜNÜMÜ AKTİF
          </span>
          <span className="hidden md:inline text-slate-400">
            Kurumsal Sol Yan Menü ve Hizalı Tipografi Düzeyi Kullanımdadır.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all font-medium shadow-sm hover:scale-105 active:scale-95 text-xs"
            title="Eski Klasik Görünüme Sorunsuz Dön"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Klasik Görünüme Dön</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Mobile Drawer Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-40 h-screen lg:h-full bg-slate-900 dark:bg-neutral-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all duration-300 ${
            isCollapsed ? 'lg:w-20' : 'lg:w-64'
          } ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Sidebar Header / Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              {(!isCollapsed || mobileOpen) && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white tracking-wide text-sm truncate">
                    VARAKALAR
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
                    ENTERPRISE v2.4
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Sidebar Daralt/Genişlet"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
            {(!isCollapsed || mobileOpen) && (
              <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Ana Gezinti
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    } ${isCollapsed && !mobileOpen ? 'justify-center px-0' : ''}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {(!isCollapsed || mobileOpen) && (
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span>{item.label}</span>
                      <span className="text-[11px] opacity-70 font-normal">{item.subtitle}</span>
                    </div>
                  )}
                </NavLink>
              );
            })}

            {/* Quick Actions in Sidebar */}
            {(!isCollapsed || mobileOpen) && (
              <div className="pt-6 px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Yönetim & Eylemler
              </div>
            )}

            {user && profile?.role === 'admin' && (
              <button
                onClick={onAdminClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm text-purple-300 hover:bg-purple-950/40 hover:text-purple-200 border border-purple-800/30 ${
                  isCollapsed && !mobileOpen ? 'justify-center px-0' : ''
                }`}
                title="Admin Paneli"
              >
                <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                {(!isCollapsed || mobileOpen) && <span>Admin Panel</span>}
              </button>
            )}

            {user && profile?.status === 'active' && (
              <button
                onClick={onUploadClick}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200 border border-emerald-800/30 ${
                  isCollapsed && !mobileOpen ? 'justify-center px-0' : ''
                }`}
                title="Excel Yükle"
              >
                <UploadCloud className="w-5 h-5 text-emerald-400 shrink-0" />
                {(!isCollapsed || mobileOpen) && <span>Excel Dosyası Yükle</span>}
              </button>
            )}
          </div>

          {/* Sidebar Footer: System Status & User Info */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                {(!isCollapsed || mobileOpen) && (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {user.email}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {profile?.role === 'admin' ? 'Yönetici' : 'Aktif Kullanıcı'}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => signOut()}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </aside>

        {/* Main Content & Topbar Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Topbar */}
          <header className="h-16 shrink-0 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 px-6 flex items-center justify-between z-50 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  {location.pathname === '/' ? 'Zabıt Varakaları Genel Bakış' : 'Detaylı İhlal ve Ceza Tablosu'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-neutral-400 hidden sm:block">
                  Kurumsal Ceza ve Zabıt Varakası Yönetim Portalı
                </p>
              </div>
            </div>

            {/* Topbar Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications Dropdown Trigger */}
              <div className="relative">
                <button
                  ref={notificationButtonRef}
                  onClick={handleNotificationsToggle}
                  className="p-2 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors relative"
                  aria-label="Bildirimler"
                  aria-expanded={showNotifications}
                  aria-controls="notification-center"
                  aria-haspopup="dialog"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
                    </>
                  )}
                </button>

                {/* Notifications Modal */}
                {showNotifications && (
                  <div
                    ref={notificationPanelRef}
                    id="notification-center"
                    role="dialog"
                    aria-label="Sistem bildirimleri"
                    tabIndex={-1}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 p-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-150"
                  >

                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-neutral-800">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-500" />
                        <span>Sistem Bildirimleri</span>
                      </h4>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          {unreadCount} Yeni Bildirim
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-neutral-400 px-2 py-0.5 rounded-full">
                          Güncel
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {notifications.map((n) => {
                        const isUnread = n.unread && !readNotificationKeys.has(getNotificationKey(n));
                        return (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border transition-colors text-xs ${
                            isUnread
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
                              : 'bg-slate-50 dark:bg-neutral-800/60 border-slate-100 dark:border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-neutral-100 mb-1">
                            <span className="flex items-center gap-1.5">
                              {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                          </div>
                          <p className="text-slate-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                            {n.desc}
                          </p>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>


              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                aria-label="Tema Değiştir"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>

              {/* View Switcher Toggle Button in Topbar */}
              <button
                onClick={onToggleViewMode}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-neutral-700"
                title="Görünüm Modunu Değiştir"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mod: Kurumsal</span>
              </button>
            </div>
          </header>

          {/* Page Content Container */}
          <main className="flex-1 min-h-0 p-3 sm:p-6 overflow-y-auto">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
