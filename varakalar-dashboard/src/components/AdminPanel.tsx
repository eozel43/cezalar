import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPendingUsers();
    }
  }, [profile]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPendingUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching pending users:', err);
      setError('Bekleyen kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId);
    setError('');
    setSuccess('');

    try {
      const { data, error: actionError } = await supabase.functions.invoke('user-approval', {
        body: {
          userId,
          action
        }
      });

      if (actionError) throw actionError;
      if (data?.error) throw new Error(data.error.message);

      const message = action === 'approve' 
        ? 'Kullanıcı başarıyla onaylandı' 
        : 'Kullanıcı reddedildi';
      
      setSuccess(message);
      
      // Refresh list
      await fetchPendingUsers();
    } catch (err: any) {
      console.error('User action error:', err);
      setError(err.message || 'İşlem başarısız oldu');
    } finally {
      setActionLoading(null);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="bg-semantic-error/10 border border-semantic-error/30 rounded-lg p-6 text-center">
          <p className="text-body text-semantic-error">Bu sayfaya erişim yetkiniz yok</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="bg-surface rounded-lg p-8 border border-neutral-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-heading-md font-semibold text-neutral-900 mb-2">
            Admin Paneli
          </h2>
          <p className="text-body text-neutral-700">
            Bekleyen kullanıcı kayıtlarını onaylayın veya reddedin
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-semantic-error/10 border border-semantic-error/30 rounded-lg">
            <p className="text-body text-semantic-error">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-body text-green-800">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-body text-neutral-600 mt-4">Yükleniyor...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <p className="text-body text-neutral-600">Bekleyen kullanıcı kaydı yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-900">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-900">
                    Kayıt Tarihi
                  </th>
                  <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-900">
                    Durum
                  </th>
                  <th className="text-right py-3 px-4 text-body-sm font-semibold text-neutral-900">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-4 px-4 text-body text-neutral-900">
                      {user.email}
                    </td>
                    <td className="py-4 px-4 text-body-sm text-neutral-600">
                      {new Date(user.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-body-sm font-medium rounded-full">
                        Beklemede
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUserAction(user.user_id, 'approve')}
                          disabled={actionLoading === user.user_id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-body-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === user.user_id ? 'İşleniyor...' : 'Onayla'}
                        </button>
                        <button
                          onClick={() => handleUserAction(user.user_id, 'reject')}
                          disabled={actionLoading === user.user_id}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-body-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === user.user_id ? 'İşleniyor...' : 'Reddet'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
