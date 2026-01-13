import { useState, useEffect } from 'react';
import { VarakalarData, Varaka, ParetoAnalizi, TopPlakaCeza } from '../types';
import { supabase } from '../lib/supabase';

// Calculate summary statistics from varakalar
const calculateOzet = (varakalar: Varaka[]) => {
  const toplam_ceza_tutari = varakalar.reduce((sum, v) => sum + v.ceza_miktari, 0);
  return {
    toplam_sayisi: varakalar.length,
    toplam_ceza_tutari,
    ortalama_ceza: varakalar.length > 0 ? toplam_ceza_tutari / varakalar.length : 0
  };
};

// Calculate Pareto analysis
const calculatePareto = (varakalar: Varaka[]): ParetoAnalizi[] => {
  const kabahatCounts: Record<string, number> = {};
  varakalar.forEach(v => {
    kabahatCounts[v.kabahat] = (kabahatCounts[v.kabahat] || 0) + 1;
  });

  const sorted = Object.entries(kabahatCounts)
    .map(([kabahat, count]) => ({
      kabahat,
      count,
      percentage: (count / varakalar.length) * 100,
      cumulative_percentage: 0
    }))
    .sort((a, b) => b.count - a.count);

  let cumulative = 0;
  sorted.forEach(item => {
    cumulative += item.percentage;
    item.cumulative_percentage = cumulative;
  });

  return sorted.slice(0, 10); // Top 10
};

// Calculate top 3 plates by total penalty
const calculateTopPlates = (varakalar: Varaka[]): TopPlakaCeza[] => {
  const plateCounts: Record<string, { total: number; count: number }> = {};
  
  varakalar.forEach(v => {
    if (!plateCounts[v.plaka_no]) {
      plateCounts[v.plaka_no] = { total: 0, count: 0 };
    }
    plateCounts[v.plaka_no].total += v.ceza_miktari;
    plateCounts[v.plaka_no].count += 1;
  });

  return Object.entries(plateCounts)
    .map(([plaka, stats]) => ({
      plaka,
      toplam_ceza: stats.total,
      ceza_sayisi: stats.count,
      ortalama_ceza: Math.round(stats.total / stats.count)
    }))
    .sort((a, b) => b.toplam_ceza - a.toplam_ceza)
    .slice(0, 3);
};

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
