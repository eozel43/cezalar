import React, { useState } from 'react';
import { useAuth } from '../contexts/useAuth';

const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        setMessage('Kayıt başarılı! E-posta adresinizi kontrol edin.');
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-md font-semibold text-neutral-900">
            {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-700 mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="En az 6 karakter"
            />
          </div>

          {error && (
            <div className="p-3 bg-semantic-error/10 border border-semantic-error/30 rounded-lg">
              <p className="text-body-sm text-semantic-error">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
              <p className="text-body-sm text-success">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'İşleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-body-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
