import { useState, useEffect, useCallback, useRef } from 'react';
import { Varaka } from '../types';
import { supabase } from '../lib/supabase';

// PostgREST returns at most 1000 rows per request, so fetch in pages
const PAGE_SIZE = 1000;

const fetchAllVarakalar = async (): Promise<Varaka[]> => {
  const rows: Varaka[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('varakalar')
      .select('*')
      .order('tarih', { ascending: true })
      .order('sira_no', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    rows.push(...((data || []) as Varaka[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
};

// Data is only fetched for approved (active) users; RLS enforces the same rule
export const useVarakalarData = (enabled: boolean) => {
  const [varakalar, setVarakalar] = useState<Varaka[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadTimer = useRef<ReturnType<typeof setTimeout>>();

  // silent: refresh in the background without showing the loading state
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setVarakalar(await fetchAllVarakalar());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVarakalar([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    fetchData();

    // Batch imports fire many change events; reload once after they settle
    const subscription = supabase
      .channel('varakalar_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'varakalar' }, () => {
        clearTimeout(reloadTimer.current);
        reloadTimer.current = setTimeout(() => fetchData(true), 1500);
      })
      .subscribe();

    return () => {
      clearTimeout(reloadTimer.current);
      subscription.unsubscribe();
    };
  }, [enabled, fetchData]);

  return { varakalar, loading, error, refetch: () => fetchData(true) };
};
