import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }} />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
