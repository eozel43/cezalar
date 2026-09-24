import React, { useState } from 'react';
import { Clock, ShieldX, Lock } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { Logo } from './BrandMark';
import { Button } from './ui';
import { APP_CONFIG } from '../config';

const inputClass =
  'w-full h-10 px-3 border border-neutral-300 rounded-md text-body bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400';

const AuthForm: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isSignUp) {
        await signUp(email, password);
        setMessage('Kayıt talebiniz alındı. Hesabınız yönetici onayından sonra etkinleşecektir.');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      const msg: string = err?.message || '';
      setError(
        msg.includes('Invalid login credentials')
          ? 'E-posta adresi veya şifre hatalı.'
          : msg.includes('already registered')
            ? 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin; şifrenizi hatırlamıyorsanız sistem yöneticisine başvurun.'
            : msg || 'Bir hata oluştu.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-heading-md text-neutral-900">{isSignUp ? 'Erişim Talebi' : 'Oturum Aç'}</h2>
      <p className="text-body-sm text-neutral-500 mt-1 mb-6">
        {isSignUp
          ? 'Kurumsal e-posta adresinizle kayıt olun; hesabınız yönetici onayıyla etkinleşir.'
          : 'Devam etmek için kurum hesabınızla giriş yapın.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-body-sm font-medium text-neutral-700 mb-1.5">
            E-posta
          </label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="block text-body-sm font-medium text-neutral-700 mb-1.5">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
          />
          {isSignUp && <p className="text-caption text-neutral-500 mt-1">En az 6 karakter</p>}
        </div>

        {error && (
          <div role="alert" className="px-3 py-2 rounded-md border border-red-200 bg-red-50 text-body-sm text-semantic-error">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="px-3 py-2 rounded-md border border-green-200 bg-green-50 text-body-sm text-semantic-success">
            {message}
          </div>
        )}

        <Button type="submit" variant="primary" disabled={loading} className="w-full h-10">
          {loading ? 'İşleniyor…' : isSignUp ? 'Talep Gönder' : 'Giriş Yap'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-neutral-200 text-center text-body-sm text-neutral-600">
        {isSignUp ? 'Hesabınız var mı?' : 'Hesabınız yok mu?'}{' '}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setMessage('');
          }}
          className="font-medium text-primary-600 hover:text-primary-800"
        >
          {isSignUp ? 'Giriş yapın' : 'Erişim talep edin'}
        </button>
      </div>
    </>
  );
};

const StatusMessage: React.FC<{ status: 'pending' | 'rejected' }> = ({ status }) => {
  const { user, signOut } = useAuth();
  const pending = status === 'pending';
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
        {pending ? <Clock className="w-6 h-6" /> : <ShieldX className="w-6 h-6" />}
      </div>
      <h2 className="text-heading-md text-neutral-900">{pending ? 'Onay Bekleniyor' : 'Erişim Reddedildi'}</h2>
      <p className="text-body-sm text-neutral-600 mt-2">
        {pending
          ? 'Hesabınız yönetici onayı bekliyor. Onaylandıktan sonra sisteme erişebilirsiniz.'
          : 'Hesabınıza erişim izni verilmedi. Bilgi için sistem yöneticisiyle iletişime geçin.'}
      </p>
      <p className="text-caption text-neutral-500 mt-4">{user?.email}</p>
      <Button onClick={() => signOut()} className="mt-4">
        Çıkış Yap
      </Button>
    </div>
  );
};

const LoginPage: React.FC<{ status?: 'pending' | 'rejected' }> = ({ status }) => (
  <div className="min-h-screen flex flex-col lg:flex-row bg-background-page">
    {/* Brand panel */}
    <div className="lg:w-[44%] bg-primary-900 text-white px-8 py-10 lg:p-14 flex flex-col">
      <div className="flex items-center gap-3">
        <Logo className="w-11 h-11" />
        <div className="leading-tight">
          <div className="text-body-sm font-semibold">{APP_CONFIG.institution}</div>
          <div className="text-caption text-primary-200">{APP_CONFIG.department}</div>
        </div>
      </div>
      <div className="mt-10 lg:mt-auto lg:mb-auto max-w-md">
        <h1 className="text-heading-xl font-semibold">{APP_CONFIG.appName}</h1>
        <p className="text-body text-primary-200 mt-3">
          Zabıt varakalarının kayıt, takip ve istatistiksel analizini tek noktadan yönetin.
        </p>
      </div>
      <div className="hidden lg:flex items-center gap-2 text-caption text-primary-300">
        <Lock className="w-3.5 h-3.5" />
        Bu sistem kişisel veri içerir; yalnızca yetkili personel erişebilir.
      </div>
    </div>

    {/* Form panel */}
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-7">
          {status ? <StatusMessage status={status} /> : <AuthForm />}
        </div>
        <p className="text-center text-caption text-neutral-500 mt-6">
          © {new Date().getFullYear()} {APP_CONFIG.institution}
          {APP_CONFIG.kvkkUrl && (
            <>
              {' · '}
              <a href={APP_CONFIG.kvkkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                KVKK Aydınlatma Metni
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  </div>
);

export default LoginPage;
