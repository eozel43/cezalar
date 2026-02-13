import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const handleExportPDF = () => {
    if (!filteredData.length) {
      alert("PDF oluşturmak için filtrelenmiş veri bulunmuyor.");
      return;
    }
  
    const doc = new jsPDF();

    // NOTE: jsPDF has limitations with UTF-8 characters.
    // For full Turkish character support, a custom font that includes these glyphs
    // would need to be loaded. We will proceed with standard fonts, so some
    // characters might not be rendered correctly.
    doc.text("Filtrelenmiş Varakalar Raporu", 14, 20);
  
    const tableColumns = ['Sıra No', 'Tarih', 'Plaka', 'İsim', 'Kabahat', 'Ceza Miktarı (TL)'];
    const tableRows = filteredData.map(item => [
      item.sira_no,
      new Date(item.tarih).toLocaleDateString('tr-TR'),
      item.plaka_no,
      item.isim,
      item.kabahat,
      item.ceza_miktari.toFixed(2)
    ]);
  
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185], // A nice blue color
        textColor: 255,
        fontStyle: 'bold',
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(`Sayfa ${data.pageNumber} / ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });
  
    doc.save('filtrelenmis_varakalar.pdf');
  };

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
      
      <div className="my-4 flex justify-end max-w-7xl mx-auto px-6">
        <button 
          onClick={handleExportPDF}
          className="h-10 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          PDF Olarak İndir
        </button>
      </div>

      <DataTable 
        data={filteredData} 
        showMenCezalari={showMenCezalari}
      />
    </div>
  );
};

export default DetailsPage;
