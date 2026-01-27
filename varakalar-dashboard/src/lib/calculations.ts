import { Varaka, ParetoAnalizi, TopPlakaCeza, Ozet } from '../types';

// Calculate summary statistics from varakalar
export const calculateOzet = (varakalar: Varaka[]): Ozet => {
  const toplam_ceza_tutari = varakalar.reduce((sum, v) => sum + v.ceza_miktari, 0);
  return {
    toplam_sayisi: varakalar.length,
    toplam_ceza_tutari,
    ortalama_ceza: varakalar.length > 0 ? toplam_ceza_tutari / varakalar.length : 0
  };
};

// Calculate Pareto analysis
export const calculatePareto = (varakalar: Varaka[]): ParetoAnalizi[] => {
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
export const calculateTopPlates = (varakalar: Varaka[]): TopPlakaCeza[] => {
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
