import React from 'react';
import { Search, Filter, Calendar, User, Ban, DollarSign } from 'lucide-react';
import { Varaka } from '../types';

interface AdvancedSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  kabahatFilter: string;
  onKabahatFilterChange: (value: string) => void;
  cezaTuruFilter: string;
  onCezaTuruFilterChange: (value: string) => void;
  showMenCezalari: boolean;
  onShowMenCezalariChange: (value: boolean) => void;
  dateRange: {
    start: string;
    end: string;
  };
  onDateRangeChange: (start: string, end: string) => void;
  kabahatList: string[];
  totalCount: number;
  filteredCount: number;
  className?: string;
}

const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  kabahatFilter,
  onKabahatFilterChange,
  cezaTuruFilter,
  onCezaTuruFilterChange,
  showMenCezalari,
  onShowMenCezalariChange,
  dateRange,
  onDateRangeChange,
  kabahatList,
  totalCount,
  filteredCount,
  className = '',
}) => {
  return (
    <section className={`py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-heading-lg font-semibold text-neutral-900 mb-2">
            🔍 Gelişmiş Arama & Filtreleme
          </h2>
          <p className="text-body text-neutral-600">
            Verilerinizi detaylı şekilde filtreleyin ve analiz edin
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-background-surface rounded-lg border border-neutral-200 p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Plaka Arama */}
              <div>
                <label className="flex items-center gap-2 text-body-sm font-medium text-neutral-700 mb-2">
                  <Search className="w-4 h-4" />
                  Plaka / İsim Arama
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Plaka numarası veya isim ile arama..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body placeholder:text-neutral-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Kabahat Türü Filtre */}
              <div>
                <label className="flex items-center gap-2 text-body-sm font-medium text-neutral-700 mb-2">
                  <User className="w-4 h-4" />
                  Kabahat Türü
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
                  <select
                    value={kabahatFilter}
                    onChange={(e) => onKabahatFilterChange(e.target.value)}
                    className="w-full h-12 pl-10 pr-10 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body appearance-none bg-white transition-all duration-200"
                  >
                    <option value="">Tüm kabahat türleri</option>
                    {kabahatList.map((kabahat) => (
                      <option key={kabahat} value={kabahat}>
                        {kabahat.length > 40 ? kabahat.substring(0, 40) + '...' : kabahat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Ceza Türü Filtre */}
              <div>
                <label className="flex items-center gap-2 text-body-sm font-medium text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Ceza Türü
                </label>
                <div className="relative">
                  <select
                    value={cezaTuruFilter}
                    onChange={(e) => onCezaTuruFilterChange(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body appearance-none bg-white transition-all duration-200"
                  >
                    <option value="">Tüm ceza türleri</option>
                    <option value="para">Para Cezası</option>
                    <option value="men">Men Cezası</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Men Cezaları Toggle */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-semantic-warning" />
                  <div>
                    <div className="text-body-sm font-medium text-neutral-900">Sadece Men Cezaları</div>
                    <div className="text-body-sm text-neutral-600">Men cezalarını özel olarak göster</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMenCezalari}
                    onChange={(e) => onShowMenCezalariChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <label className="flex items-center gap-2 text-body-sm font-medium text-neutral-700 mb-3">
              <Calendar className="w-4 h-4" />
              Tarih Aralığı (İsteğe Bağlı)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => onDateRangeChange(e.target.value, dateRange.end)}
                  className="w-full h-12 px-4 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body transition-all duration-200"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => onDateRangeChange(dateRange.start, e.target.value)}
                  className="w-full h-12 px-4 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-body-sm text-neutral-600">
                <span className="font-medium">{filteredCount}</span> kayıt gösteriliyor
                {filteredCount !== totalCount && (
                  <span> / <span className="font-medium">{totalCount}</span> toplam</span>
                )}
              </div>
              
              {/* Active Filters Indicator */}
              <div className="flex items-center gap-2">
                {(searchTerm || kabahatFilter || cezaTuruFilter || showMenCezalari || dateRange.start || dateRange.end) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-body-sm text-primary-700 font-medium">Aktif Filtre</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedSearchFilter;
