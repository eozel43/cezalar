import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Ban, DollarSign } from 'lucide-react';
import { Varaka, SortConfig } from '../types';

interface DataTableProps {
  data: Varaka[];
  showMenCezalari: boolean;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, showMenCezalari, className = '' }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Sıralama işlemi
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Sıralama işleyicisi
  const handleSort = (key: keyof Varaka) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Sıralama ikonu bileşeni
  const SortIcon: React.FC<{ column: keyof Varaka }> = ({ column }) => {
    if (sortConfig?.key !== column) {
      return <div className="w-4 h-4" />;
    }

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-neutral-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-neutral-500" />
    );
  };

  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Tarih formatı
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Ceza türü badge'i
  const CezaTuruBadge: React.FC<{ varaka: Varaka }> = ({ varaka }) => {
    if (varaka.ceza_turu === 'men') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-body-sm font-medium bg-semantic-warning/10 text-semantic-warning dark:bg-amber-900/20 dark:text-amber-400">
          <Ban className="w-3 h-3" />
          {varaka.ceza_detay || 'Men Cezası'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-body-sm font-medium bg-semantic-success/10 text-semantic-success dark:bg-emerald-900/20 dark:text-emerald-400">
        <DollarSign className="w-3 h-3" />
        {formatCurrency(varaka.ceza_miktari)}
      </span>
    );
  };

  // Stats hesaplama
  const stats = useMemo(() => {
    const paraCezalari = sortedData.filter(v => v.ceza_turu !== 'men');
    const menCezalari = sortedData.filter(v => v.ceza_turu === 'men');
    const toplamParaCezasi = paraCezalari.reduce((sum, v) => sum + v.ceza_miktari, 0);

    return {
      paraCezalari: paraCezalari.length,
      menCezalari: menCezalari.length,
      toplamParaCezasi,
      toplamKayit: sortedData.length,
    };
  }, [sortedData]);

  // Son güncelleme tarihi hesaplama (En yeni created_at değeri)
  const sonGuncellemeTarihi = useMemo(() => {
    if (!data || data.length === 0) return new Date().toLocaleDateString('tr-TR');
    
    const validDates = data
      .map(v => v.created_at ? new Date(v.created_at) : null)
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
      
    if (validDates.length === 0) {
      return new Date().toLocaleDateString('tr-TR');
    }
    
    const latestDate = new Date(Math.max(...validDates.map(d => d.getTime())));
    return latestDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [data]);

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h2 className="text-heading-lg font-semibold text-neutral-900 dark:text-neutral-200 mb-2">
            📋 Varaka Detay Listesi
          </h2>
          <p className="text-body text-neutral-600 dark:text-neutral-400">
            Tüm ceza kayıtlarını detaylı olarak görüntüle
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 text-center">
            <div className="text-xl font-bold text-neutral-900 dark:text-neutral-200">{stats.toplamKayit}</div>
            <div className="text-body-sm text-neutral-600 dark:text-neutral-400">Toplam Kayıt</div>
          </div>
          <div className="bg-semantic-success/10 dark:bg-emerald-900/10 rounded-lg border border-semantic-success/20 dark:border-emerald-800/30 p-4 text-center">
            <div className="text-xl font-bold text-semantic-success dark:text-emerald-400">{stats.paraCezalari}</div>
            <div className="text-body-sm text-semantic-success/80 dark:text-emerald-500/80">Para Cezası</div>
          </div>
          <div className="bg-semantic-warning/10 dark:bg-amber-900/10 rounded-lg border border-semantic-warning/20 dark:border-amber-800/30 p-4 text-center">
            <div className="text-xl font-bold text-semantic-warning dark:text-amber-400">{stats.menCezalari}</div>
            <div className="text-body-sm text-semantic-warning/80 dark:text-amber-500/80">Men Cezası</div>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800/30 p-4 text-center">
            <div className="text-xl font-bold text-primary-700 dark:text-primary-400">{formatCurrency(stats.toplamParaCezasi)}</div>
            <div className="text-body-sm text-primary-600 dark:text-primary-500">Toplam Tutar</div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          {/* Tablo Container'ı */}
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Tablo Header'ı */}
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                    onClick={() => handleSort('sira_no')}
                  >
                    <div className="flex items-center gap-2">
                      Sıra No
                      <SortIcon column="sira_no" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                    onClick={() => handleSort('tarih')}
                  >
                    <div className="flex items-center gap-2">
                      Tarih
                      <SortIcon column="tarih" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                    onClick={() => handleSort('plaka_no')}
                  >
                    <div className="flex items-center gap-2">
                      Plaka No
                      <SortIcon column="plaka_no" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                    onClick={() => handleSort('isim')}
                  >
                    <div className="flex items-center gap-2">
                      İsim
                      <SortIcon column="isim" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                    onClick={() => handleSort('kabahat')}
                  >
                    <div className="flex items-center gap-2">
                      Kabahat Türü
                      <SortIcon column="kabahat" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 dark:text-neutral-200 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                    onClick={() => handleSort('ceza_miktari')}
                  >
                    <div className="flex items-center gap-2">
                      Ceza Miktarı
                      <SortIcon column="ceza_miktari" />
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Tablo Body'si */}
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {sortedData.map((varaka, index) => (
                  <tr 
                    key={`${varaka.sira_no}-${index}`}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-body text-neutral-900 dark:text-neutral-200 font-medium">
                      {varaka.sira_no}
                    </td>
                    <td className="px-6 py-4 text-body text-neutral-700 dark:text-neutral-300">
                      {formatDate(varaka.tarih)}
                    </td>
                    <td className="px-6 py-4 text-body text-neutral-900 dark:text-neutral-200 font-medium">
                      {varaka.plaka_no}
                    </td>
                    <td className="px-6 py-4 text-body text-neutral-700 dark:text-neutral-300">
                      {varaka.isim}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-body text-neutral-900 dark:text-neutral-200">
                        {varaka.kabahat.length > 40 ? 
                          varaka.kabahat.substring(0, 40) + '...' : 
                          varaka.kabahat
                        }
                      </div>
                      <div className="text-body-sm text-neutral-500 dark:text-neutral-500 mt-1">
                        {varaka.gun} • {varaka.mevsim}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CezaTuruBadge varaka={varaka} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablo Alt Bilgisi */}
          <div className="px-8 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="text-body-sm text-neutral-500 dark:text-neutral-400">
                Toplam {sortedData.length} kayıt gösteriliyor
                {showMenCezalari && (
                  <span className="ml-2 text-semantic-warning font-medium dark:text-amber-400">
                    (Men cezaları dahil)
                  </span>
                )}
              </div>
              <div className="text-body-sm text-neutral-500 dark:text-neutral-400">
                Son güncelleme: {sonGuncellemeTarihi}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataTable;
