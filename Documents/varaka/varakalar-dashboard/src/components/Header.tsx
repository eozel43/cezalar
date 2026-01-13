import React from 'react';
import { useAuth } from '../contexts/useAuth';

interface HeaderProps {
  onUploadClick: () => void;
  onAuthClick: () => void;
  onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onUploadClick, onAuthClick, onAdminClick }) => {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-background-surface/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-heading-lg font-bold text-neutral-900">
            Varakalar Dashboard
          </h1>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-body-sm text-neutral-600">
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
                    Admin Panel
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
                    Excel Yükle
                  </button>
                )}
                {profile?.status === 'pending' && (
                  <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-md text-body-sm font-medium">
                    Onay Bekleniyor
                  </span>
                )}
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors"
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
      </div>
    </header>
  );
};

export default Header;
