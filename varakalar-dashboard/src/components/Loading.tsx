import React from 'react';

interface LoadingProps {
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ className = '' }) => {
  return (
    <div className={`min-h-screen bg-background-page flex items-center justify-center ${className}`}>
      <div className="text-center">
        {/* Skeleton Animation */}
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-primary-500 mb-4"></div>
        <p className="text-body text-neutral-700">Veriler yükleniyor...</p>
      </div>
    </div>
  );
};

export default Loading;
