import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, UserCheck, Trash2, ShieldCheck, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, functionErrorMessage } from '../lib/supabase';
import { formatDateTime, formatNumber } from '../lib/format';
import { Card, CardHeader, Button, Skeleton, EmptyState } from './ui';

interface ManagedUser {
  user_id: string;
  email: string;
  role: 'admin' | 'user' | 'pending' | 'rejected';
  status: 'active' | 'pending' | 'rejected';
  created_at: string;
  has_account: boolean;
  last_sign_in_at: string | null;
  is_self: boolean;
}

type Action = 'approve' | 'reject' | 'delete';

const callUserManagement = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('user-approval', { body });
  if (error) throw new Error(await functionErrorMessage(error, 'İşlem başarısız oldu'));
  if (data?.error) throw new Error(data.error.message);
  return data.data;
};

const thClass = 'px-5 py-2.5 text-left text-caption font-semibold uppercase tracking-wide text-neutral-500';

const AdminPanel: React.FC<{ onPendingChange?: () => void }> = ({ onPendingChange }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const result = await callUserManagement({ action: 'list' });
      setUsers(result.users || []);
      setLoadError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setLoadError(err.message || 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (user: ManagedUser, action: Action) => {
    setBusyUser(user.user_id);
    try {
      const result = await callUserManagement({ action, userId: user.user_id });
      toast.success(
        action === 'approve' ? `${user.email} onaylandı` : action === 'reject' ? `${user.email} reddedildi` : result.message
      );
      setConfirmDelete(null);
      if (action === 'delete') {
        setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
      }
      await fetchUsers();
      onPendingChange?.();
    } catch (err: any) {
      console.error('User action error:', err);
      toast.error(err.message || 'İşlem başarısız oldu');
    } finally {
      setBusyUser(null);
    }
  };

  const pending = users.filter(u => u.status === 'pending');
  const active = users
    .filter(u => u.status === 'active')
    .sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin') || a.email.localeCompare(b.email, 'tr'));

  if (!loading && loadError) {
    return (
      <Card>
        <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Kullanıcılar yüklenemedi" description={loadError} />
        <div className="pb-8 text-center">
          <Button
            onClick={() => {
              setLoading(true);
              fetchUsers();
            }}
          >
            Tekrar Dene
          </Button>
        </div>
      </Card>
    );
  }

  const loadingRows = (
    <div className="p-5 space-y-3">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Erişim Talepleri" description="Sisteme erişim için onay bekleyen kullanıcılar" />
        {loading ? (
          loadingRows
        ) : pending.length === 0 ? (
          <EmptyState icon={<UserCheck className="w-8 h-8" />} title="Bekleyen erişim talebi yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className={thClass}>E-posta</th>
                  <th className={thClass}>Talep Tarihi</th>
                  <th className={`${thClass} text-right`}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(user => {
                  const busy = busyUser === user.user_id;
                  return (
                    <tr key={user.user_id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-5 py-3 text-neutral-900">{user.email}</td>
                      <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDateTime(user.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="primary" disabled={busy} onClick={() => handleAction(user, 'approve')}>
                            <Check className="w-4 h-4" />
                            Onayla
                          </Button>
                          <Button size="sm" variant="danger" disabled={busy} onClick={() => handleAction(user, 'reject')}>
                            <X className="w-4 h-4" />
                            Reddet
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Yetkili Kullanıcılar"
          description={loading ? 'Sisteme erişimi olan kullanıcılar' : `Sisteme erişimi olan ${formatNumber(active.length)} kullanıcı`}
        />
        {loading ? (
          loadingRows
        ) : active.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="Yetkili kullanıcı yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className={thClass}>E-posta</th>
                  <th className={thClass}>Rol</th>
                  <th className={thClass}>Kayıt Tarihi</th>
                  <th className={thClass}>Son Giriş</th>
                  <th className={`${thClass} text-right`}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {active.map(user => {
                  const busy = busyUser === user.user_id;
                  const isAdmin = user.role === 'admin';
                  const confirming = confirmDelete === user.user_id;
                  return (
                    <tr key={user.user_id} className="border-b border-neutral-100 last:border-0 align-middle">
                      <td className="px-5 py-3 text-neutral-900">
                        {user.email}
                        {user.is_self && <span className="ml-2 text-caption text-neutral-500">(siz)</span>}
                      </td>
                      <td className="px-5 py-3">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded border border-primary-200 bg-primary-50 px-2 py-0.5 text-caption font-medium text-primary-700">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Yönetici
                          </span>
                        ) : (
                          <span className="inline-flex rounded border border-neutral-200 bg-white px-2 py-0.5 text-caption font-medium text-neutral-700">
                            Kullanıcı
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDateTime(user.created_at)}</td>
                      <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">
                        {!user.has_account ? (
                          <span className="text-semantic-warning" title="Profil var, giriş hesabı silinmiş">
                            Giriş hesabı yok
                          </span>
                        ) : user.last_sign_in_at ? (
                          formatDateTime(user.last_sign_in_at)
                        ) : (
                          <span className="text-neutral-400">Hiç giriş yapmadı</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end items-center gap-2">
                          {isAdmin || user.is_self ? (
                            <span className="text-caption text-neutral-400" title="Yönetici hesapları buradan silinemez">
                              —
                            </span>
                          ) : confirming ? (
                            <>
                              <span className="text-body-sm text-neutral-700 whitespace-nowrap">Kalıcı olarak silinsin mi?</span>
                              <Button size="sm" variant="danger" disabled={busy} onClick={() => handleAction(user, 'delete')}>
                                {busy ? 'Siliniyor…' : 'Evet, sil'}
                              </Button>
                              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(null)}>
                                Vazgeç
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(user.user_id)}>
                              <Trash2 className="w-4 h-4" />
                              Sil
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-5 py-3 border-t border-neutral-100 text-caption text-neutral-500">
          Silinen kullanıcının hesabı ve erişimi kalıcı olarak kaldırılır. Kişi yeniden kayıt olursa tekrar yönetici onayı
          gerekir. Yönetici hesapları bu ekrandan silinemez.
        </p>
      </Card>
    </div>
  );
};

export default AdminPanel;
