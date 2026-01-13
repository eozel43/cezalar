// Data types for Varakalar Dashboard
export interface Varaka {
  sira_no: number;
  tarih: string;
  gun: string;
  plaka_no: string;
  isim: string;
  kabahat: string;
  ceza_miktari: number;
  ay: number;
  mevsim: string;
  ceza_turu?: string;
  ceza_detay?: string;
}

export interface ParetoAnalizi {
  kabahat: string;
  count: number;
  percentage: number;
  cumulative_percentage: number;
}

export interface TopPlakaCeza {
  plaka: string;
  toplam_ceza: number;
  ceza_sayisi: number;
  ortalama_ceza: number;
}

export interface MenCezasi {
  sira_no: number;
  tarih: string;
  gun: string;
  plaka_no: string;
  isim: string;
  kabahat: string;
  ceza_miktari: number;
  ay: number;
  mevsim: string;
  ceza_turu: string;
  ceza_detay: string;
}

export interface Ozet {
  toplam_sayisi: number;
  toplam_ceza_tutari: number;
  ortalama_ceza: number;
}

export interface VarakalarData {
  varakalar: Varaka[];
  ozet: Ozet;
  pareto_analizi: ParetoAnalizi[];
  top_3_plaka_ceza: TopPlakaCeza[];
  men_ceslari: MenCezasi[];
}

export interface SortConfig {
  key: keyof Varaka;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  searchTerm: string;
  kabahatFilter: string;
  cezaTuruFilter: string;
  tarihBaslangic?: string;
  tarihBitis?: string;
}
