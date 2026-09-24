// Data types for the Zabıt Varakası dashboard
export interface Varaka {
  id?: string;
  sira_no: number;
  tarih: string;
  gun: string;
  plaka_no: string;
  isim: string;
  kabahat: string;
  ceza_miktari: number;
  ay: number;
  mevsim: string;
  ceza_turu?: string | null;
  ceza_detay?: string | null;
  created_at?: string;
}

export interface ParetoAnalizi {
  kabahat: string;
  count: number;
  percentage: number;
  cumulative_percentage: number;
}

export interface TopPlakaCeza {
  plaka: string;
  isim: string;
  toplam_ceza: number;
  ceza_sayisi: number;
  ortalama_ceza: number;
}

export interface Ozet {
  toplam_sayisi: number;
  toplam_ceza_tutari: number;
  ortalama_ceza: number;
  para_cezasi_sayisi: number;
  men_cezasi_sayisi: number;
  arac_sayisi: number; // ceza alan farklı plaka
  tekrar_eden_arac_sayisi: number; // birden fazla ceza alan plaka
}

export interface SortConfig {
  key: keyof Varaka;
  direction: 'asc' | 'desc';
}

export type CezaTuruFilter = '' | 'para' | 'men';

export interface Filters {
  searchTerm: string;
  kabahat: string;
  cezaTuru: CezaTuruFilter;
  start: string;
  end: string;
}

export const EMPTY_FILTERS: Filters = {
  searchTerm: '',
  kabahat: '',
  cezaTuru: '',
  start: '',
  end: '',
};

export type SectionId = 'genel' | 'analiz' | 'kayitlar' | 'aktarim' | 'yonetim';
