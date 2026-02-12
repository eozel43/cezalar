import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from 'next-themes';

interface HeaderProps {
  onUploadClick: () => void;
  onAuthClick: () => void;
  onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onUploadClick, onAuthClick, onAdminClick }) => {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800 bg-background-surface/95 dark:bg-neutral-900/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        {/* Üst Satır: Başlık ve Kullanıcı İşlemleri */}
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-heading-lg font-bold text-neutral-900 dark:text-neutral-200">
            Varakalar Dashboard
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <span className="hidden sm:inline text-body-sm text-neutral-600 dark:text-neutral-400">
                  {user.email}
                </span>
                {profile?.role === 'admin' && (
                  <button
                    onClick={onAdminClick}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="hidden md:inline">Admin Panel</span>
                  </button>
                )}
                {profile?.status === 'active' && (
                  <button
                    onClick={onUploadClick}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="hidden md:inline">Excel Yükle</span>
                  </button>
                )}
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Çıkış
                </button>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-all duration-200 hover:scale-105"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>

        {/* Alt Satır: Navigasyon Menüsü */}
        <div className="flex items-center border-t border-neutral-100 dark:border-neutral-800 py-2">
          <nav className="flex items-center gap-2">
            <NavLink 
              to="/" 
              className={({ isActive }) => `px-4 py-2 rounded-md text-body font-medium transition-colors ${
                isActive 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/detay" 
              className={({ isActive }) => `px-4 py-2 rounded-md text-body font-medium transition-colors ${
                isActive 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              Detaylı Arama
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;