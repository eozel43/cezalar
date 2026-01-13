import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterChange: (value: string) => void;
  cezaTurleri: string[];
  className?: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  cezaTurleri,
  className = '',
}) => {
  return (
    <section className={`py-6 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="md:col-span-7">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Plaka numarası ile arama yapın..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-12 pl-10 pr-4 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body placeholder:text-neutral-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="md:col-span-5">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5" />
              <select
                value={filterType}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full h-12 pl-10 pr-4 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-body appearance-none bg-white transition-all duration-200"
              >
                <option value="">Tüm ceza türleri</option>
                {cezaTurleri.map((tur) => (
                  <option key={tur} value={tur}>
                    {tur}
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
      </div>
    </section>
  );
};

export default SearchFilter;
