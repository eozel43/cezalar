import { useState, useEffect } from 'react';
import { VarakalarData } from '../types';
import { supabase } from '../lib/supabase';
import { calculateOzet, calculatePareto, calculateTopPlates } from '../lib/calculations';
import { useAuth } from '../contexts/useAuth';

export const useVarakalarData = () => {
  const [data, setData] = useState<VarakalarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile, loading: authLoading } = useAuth();

  const fetchData = async () => {
    // If authentication session is still loading, wait
    if (authLoading) return;

    // If there is no authenticated user, reset state and do not query Supabase
    if (!user) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Wait for the user profile to load
    if (!profile) {
      return;
    }

    // If the profile is not active, do not query data and set appropriate error/restricted state
    if (profile.status !== 'active') {
      setData(null);
      setError('Hesabınız henüz onaylanmamış veya kısıtlanmış.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all varakalar from Supabase
      const { data: varakalar, error: fetchError } = await supabase
        .from('varakalar')
        .select('*')
        .order('tarih', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!varakalar || varakalar.length === 0) {
        throw new Error('Henüz veri yüklenmemiş. Excel dosyası yükleyerek başlayın.');
      }

      // Calculate statistics
      const ozet = calculateOzet(varakalar);
      const pareto_analizi = calculatePareto(varakalar);
      const top_3_plaka_ceza = calculateTopPlates(varakalar);

      setData({
        varakalar,
        ozet,
        pareto_analizi,
        top_3_plaka_ceza
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, profile, authLoading]);

  return { data, loading: loading || authLoading, error, refetch: fetchData };
};

