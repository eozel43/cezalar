import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdvancedSearchFilter from '../components/AdvancedSearchFilter';
import DataTable from '../components/DataTable';
import { Varaka } from '../types';
import { addTurkishFont, fixTurkishChars } from '../lib/pdfFonts';

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
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportPDF = async () => {
    if (!filteredData.length) {
      alert("PDF oluşturmak için filtrelenmiş veri bulunmuyor.");
      return;
    }
  
    setIsExporting(true);

    try {
      // Give the UI a chance to update before heavy processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const doc = new jsPDF();
      
      // Add font support for Turkish characters
      const fontName = addTurkishFont(doc);
      doc.setFont(fontName);

      // For full Turkish character support, we use the identity-h encoding if possible
            // but the most reliable way in jsPDF is adding a UTF-8 compatible font.
            doc.text(fixTurkishChars("Filtrelenmiş Varakalar Raporu"), 14, 20);
          
            const tableColumns = ['Sıra No', 'Tarih', 'Plaka', 'İsim', 'Kabahat', 'Ceza Miktarı (TL)'].map(col => fixTurkishChars(col));            const tableRows = filteredData.map(item => [
              item.sira_no,
              new Date(item.tarih).toLocaleDateString('tr-TR'),
              fixTurkishChars(item.plaka_no),
              fixTurkishChars(item.isim),
              fixTurkishChars(item.kabahat),
              item.ceza_miktari.toFixed(2)
            ]);    
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 28,
        theme: 'grid',
        styles: { 
          font: fontName, 
          fontStyle: 'normal' 
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.text(fixTurkishChars(`Sayfa ${data.pageNumber} / ${pageCount}`), data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });
    
      doc.save('filtrelenmis_varakalar.pdf');
    } catch (error) {
      console.error("PDF oluşturulurken hata:", error);
      alert("PDF oluşturulurken bir hata oluştu.");
    } finally {
      setIsExporting(false);
    }
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
          disabled={isExporting}
          className={`h-10 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center gap-2 ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isExporting ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Hazırlanıyor...
            </>
          ) : (
            'PDF Olarak İndir'
          )}
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
