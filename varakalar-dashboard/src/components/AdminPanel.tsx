import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, functionErrorMessage } from '../lib/supabase';
import { formatDateTime } from '../lib/format';
import { Card, CardHeader, Button, Skeleton, EmptyState } from './ui';

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

const AdminPanel: React.FC<{ onPendingChange?: () => void }> = ({ onPendingChange }) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Bekleyen kullanıcılar yüklenemedi');
    } else {
      setPendingUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleUserAction = async (user: PendingUser, action: 'approve' | 'reject') => {
    setActionLoading(user.user_id);
    try {
      const { data, error } = await supabase.functions.invoke('user-approval', {
        body: { userId: user.user_id, action },
      });
      if (error) throw new Error(await functionErrorMessage(error, 'İşlem başarısız oldu'));
      if (data?.error) throw new Error(data.error.message);

      toast.success(action === 'approve' ? `${user.email} onaylandı` : `${user.email} reddedildi`);
      await fetchPendingUsers();
      onPendingChange?.();
    } catch (err: any) {
      console.error('User action error:', err);
      toast.error(err.message || 'İşlem başarısız oldu');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader title="Erişim Talepleri" description="Sisteme erişim için onay bekleyen kullanıcılar" />
      {loading ? (
        <div className="p-5 space-y-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : pendingUsers.length === 0 ? (
        <EmptyState icon={<UserCheck className="w-8 h-8" />} title="Bekleyen erişim talebi yok" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead>
              <tr className="text-left text-caption font-semibold uppercase tracking-wide text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                <th className="px-5 py-2.5">E-posta</th>
                <th className="px-5 py-2.5">Talep Tarihi</th>
                <th className="px-5 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => {
                const busy = actionLoading === user.user_id;
                return (
                  <tr key={user.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-5 py-3 text-neutral-900">{user.email}</td>
                    <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDateTime(user.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="primary" disabled={busy} onClick={() => handleUserAction(user, 'approve')}>
                          <Check className="w-4 h-4" />
                          Onayla
                        </Button>
                        <Button size="sm" variant="danger" disabled={busy} onClick={() => handleUserAction(user, 'reject')}>
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
  );
};

export default AdminPanel;
