import React, { useState, useMemo } from 'react';
import AdvancedSearchFilter from '../components/AdvancedSearchFilter';
import DataTable from '../components/DataTable';
import { Varaka } from '../types';

interface DetailsPageProps {
  varakalar: Varaka[];
}

const DetailsPage: React.FC<DetailsPageProps> = ({ varakalar }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [kabahatFilter, setKabahatFilter] = useState('');
  const [cezaTuruFilter, setCezaTuruFilter] = useState('');
  const [showMenCezalari, setShowMenCezalari] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Calculate lists and counts for filters
  const { kabahatList, totalCount } = useMemo(() => {
    const kabahatSet = new Set<string>();
    varakalar.forEach(v => kabahatSet.add(v.kabahat));
    
    return {
      kabahatList: Array.from(kabahatSet).sort(),
      totalCount: varakalar.length
    };
  }, [varakalar]);

  // Advanced filtering
  const filteredData = useMemo(() => {
    let filtered = varakalar;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(varaka => 
        varaka.plaka_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        varaka.isim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        varaka.kabahat.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Kabahat filter
    if (kabahatFilter) {
      filtered = filtered.filter(varaka => varaka.kabahat === kabahatFilter);
    }

    // Ceza türü filter
    if (cezaTuruFilter === 'para') {
      filtered = filtered.filter(varaka => varaka.ceza_miktari > 0);
    } else if (cezaTuruFilter === 'men') {
      filtered = filtered.filter(varaka => varaka.ceza_turu === 'men' || varaka.ceza_miktari === 0);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(varaka => {
        const varakaDate = new Date(varaka.tarih);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return varakaDate >= startDate && varakaDate <= endDate;
      });
    }

    // Men cezaları toggle
    if (showMenCezalari) {
      filtered = filtered.filter(varaka => 
        varaka.ceza_turu === 'men' || 
        varaka.ceza_miktari === 0 || 
        (varaka as any).ceza_detay
      );
    }

    return filtered;
  }, [varakalar, searchTerm, kabahatFilter, cezaTuruFilter, showMenCezalari, dateRange]);

  return (
    <div className="py-6">
      <AdvancedSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        kabahatFilter={kabahatFilter}
        onKabahatFilterChange={setKabahatFilter}
        cezaTuruFilter={cezaTuruFilter}
        onCezaTuruFilterChange={setCezaTuruFilter}
        showMenCezalari={showMenCezalari}
        onShowMenCezalariChange={setShowMenCezalari}
        dateRange={dateRange}
        onDateRangeChange={(start, end) => setDateRange({ start, end })}
        kabahatList={kabahatList}
        totalCount={totalCount}
        filteredCount={filteredData.length}
      />
      
      <DataTable 
        data={filteredData} 
        showMenCezalari={showMenCezalari}
      />
    </div>
  );
};

export default DetailsPage;
