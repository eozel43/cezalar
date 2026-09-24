import React from 'react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Details stay in the console; users only see a plain message
    console.error('Uygulama hatası:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background-page px-6">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-heading-md text-neutral-900">Beklenmeyen bir hata oluştu</h1>
            <p className="text-body text-neutral-600 mt-2">
              Sayfayı yenileyerek tekrar deneyin. Sorun devam ederse sistem yöneticisine bildirin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 h-9 px-4 rounded-md bg-primary-600 text-white text-body font-medium hover:bg-primary-700"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
