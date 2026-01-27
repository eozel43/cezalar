import { useState, useEffect } from 'react';
import { VarakalarData, Varaka, ParetoAnalizi, TopPlakaCeza } from '../types';
import { supabase } from '../lib/supabase';
import { calculateOzet, calculatePareto, calculateTopPlates } from '../lib/calculations';

export const useVarakalarData = () => {
  const [data, setData] = useState<VarakalarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
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
      const men_ceslari = varakalar.filter(v => v.ceza_turu === 'men' || v.ceza_detay);

      setData({
        varakalar,
        ozet,
        pareto_analizi,
        top_3_plaka_ceza,
        men_ceslari: men_ceslari as any
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('varakalar_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'varakalar' },
        () => {
          fetchData(); // Reload data on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { data, loading, error, refetch: fetchData };
};
