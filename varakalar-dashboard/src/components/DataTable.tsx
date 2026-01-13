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
    if (varaka.ceza_turu === 'men' || varaka.ceza_miktari === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-body-sm font-medium bg-semantic-warning/10 text-semantic-warning">
          <Ban className="w-3 h-3" />
          {varaka.ceza_detay || 'Men Cezası'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-body-sm font-medium bg-semantic-success/10 text-semantic-success">
        <DollarSign className="w-3 h-3" />
        {formatCurrency(varaka.ceza_miktari)}
      </span>
    );
  };

  // Stats hesaplama
  const stats = useMemo(() => {
    const paraCezalari = sortedData.filter(v => v.ceza_miktari > 0);
    const menCezalari = sortedData.filter(v => v.ceza_turu === 'men' || v.ceza_miktari === 0);
    const toplamParaCezasi = paraCezalari.reduce((sum, v) => sum + v.ceza_miktari, 0);

    return {
      paraCezalari: paraCezalari.length,
      menCezalari: menCezalari.length,
      toplamParaCezasi,
      toplamKayit: sortedData.length,
    };
  }, [sortedData]);

  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h2 className="text-heading-lg font-semibold text-neutral-900 mb-2">
            📋 Varaka Detay Listesi
          </h2>
          <p className="text-body text-neutral-600">
            Tüm ceza kayıtlarını detaylı olarak görüntüle
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background-surface rounded-lg border border-neutral-200 p-4 text-center">
            <div className="text-xl font-bold text-neutral-900">{stats.toplamKayit}</div>
            <div className="text-body-sm text-neutral-600">Toplam Kayıt</div>
          </div>
          <div className="bg-semantic-success/10 rounded-lg border border-semantic-success/20 p-4 text-center">
            <div className="text-xl font-bold text-semantic-success">{stats.paraCezalari}</div>
            <div className="text-body-sm text-semantic-success">Para Cezası</div>
          </div>
          <div className="bg-semantic-warning/10 rounded-lg border border-semantic-warning/20 p-4 text-center">
            <div className="text-xl font-bold text-semantic-warning">{stats.menCezalari}</div>
            <div className="text-body-sm text-semantic-warning">Men Cezası</div>
          </div>
          <div className="bg-primary-50 rounded-lg border border-primary-200 p-4 text-center">
            <div className="text-xl font-bold text-primary-700">{formatCurrency(stats.toplamParaCezasi)}</div>
            <div className="text-body-sm text-primary-600">Toplam Tutar</div>
          </div>
        </div>

        <div className="bg-background-surface rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          {/* Tablo Container'ı */}
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Tablo Header'ı */}
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
                    onClick={() => handleSort('sira_no')}
                  >
                    <div className="flex items-center gap-2">
                      Sıra No
                      <SortIcon column="sira_no" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
                    onClick={() => handleSort('tarih')}
                  >
                    <div className="flex items-center gap-2">
                      Tarih
                      <SortIcon column="tarih" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
                    onClick={() => handleSort('plaka_no')}
                  >
                    <div className="flex items-center gap-2">
                      Plaka No
                      <SortIcon column="plaka_no" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
                    onClick={() => handleSort('isim')}
                  >
                    <div className="flex items-center gap-2">
                      İsim
                      <SortIcon column="isim" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
                    onClick={() => handleSort('kabahat')}
                  >
                    <div className="flex items-center gap-2">
                      Kabahat Türü
                      <SortIcon column="kabahat" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-body-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100 transition-colors duration-200"
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
              <tbody className="divide-y divide-neutral-100">
                {sortedData.map((varaka, index) => (
                  <tr 
                    key={`${varaka.sira_no}-${index}`}
                    className="hover:bg-neutral-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-body text-neutral-900 font-medium">
                      {varaka.sira_no}
                    </td>
                    <td className="px-6 py-4 text-body text-neutral-700">
                      {formatDate(varaka.tarih)}
                    </td>
                    <td className="px-6 py-4 text-body text-neutral-900 font-medium">
                      {varaka.plaka_no}
                    </td>
                    <td className="px-6 py-4 text-body text-neutral-700">
                      {varaka.isim}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-body text-neutral-900">
                        {varaka.kabahat.length > 40 ? 
                          varaka.kabahat.substring(0, 40) + '...' : 
                          varaka.kabahat
                        }
                      </div>
                      <div className="text-body-sm text-neutral-500 mt-1">
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
          <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-body-sm text-neutral-500">
                Toplam {sortedData.length} kayıt gösteriliyor
                {showMenCezalari && (
                  <span className="ml-2 text-semantic-warning font-medium">
                    (Men cezaları dahil)
                  </span>
                )}
              </div>
              <div className="text-body-sm text-neutral-500">
                Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataTable;
