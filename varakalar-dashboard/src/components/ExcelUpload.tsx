import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ExcelUploadProps {
  onUploadComplete: () => void;
}

// Flexible interface - will be mapped dynamically
interface VarakaRow {
  [key: string]: any;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(true); // Default: clear existing
  const [existingRecordCount, setExistingRecordCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Try to find "TümVeri" sheet, fallback to first sheet
          let sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('tümveri') || 
            name.toLowerCase().includes('tumveri') ||
            name.toLowerCase().includes('tum') ||
            name.toLowerCase().includes('data') ||
            name.toLowerCase().includes('veri')
          );
          
          if (!sheetName) {
            sheetName = workbook.SheetNames[0];
          }
          
          console.log('[Excel Parse] Sheet seçildi:', sheetName);
          console.log('[Excel Parse] Tüm sheet\'ler:', workbook.SheetNames);
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('[Excel Parse] Ham veri ilk satır:', jsonData[0]);
          console.log('[Excel Parse] Toplam satır:', jsonData.length);
          
          if (jsonData.length === 0) {
            throw new Error(`"${sheetName}" sheet'inde veri bulunamadı`);
          }
          
          // Get column names from first row (trim spaces)
          const firstRow = jsonData[0] as any;
          const columnMap: any = {};
          
          Object.keys(firstRow).forEach(key => {
            const normalized = key.trim().toLowerCase();
            columnMap[normalized] = key;
          });
          
          console.log('[Excel Parse] Kolonlar:', Object.keys(firstRow));
          
          // Helper function to get value by flexible column name
          const getColumnValue = (row: any, possibleNames: string[]): any => {
            for (const name of possibleNames) {
              const normalized = name.trim().toLowerCase();
              const actualKey = columnMap[normalized];
              if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null && row[actualKey] !== '') {
                return row[actualKey];
              }
            }
            return null;
          };
          
          // Transform Excel data to match database schema with flexible column mapping
          const transformed = jsonData.map((row: any, index: number) => {
            const tarih = getColumnValue(row, ['Zabıt Varaka Tarihi', 'Tarih', 'Date', 'Zabıt Tarihi']);
            const plakaNo = getColumnValue(row, ['Plaka No', 'Plaka', 'Plaka No ', ' Plaka No']);
            const isim = getColumnValue(row, ['İsim', 'Isim', ' İsim', 'İsim ', 'Ad', 'Name']);
            const kabahat = getColumnValue(row, ['Kabahat', 'Suç', 'İhlal']);
            const cezaMiktariRaw = getColumnValue(row, ['Ceza Miktarı', 'Ceza Miktari', 'Ceza', 'Tutar']);
            
            // Parse ceza miktarı - detect "men" cezaları
            let cezaMiktari = 0;
            let cezaTuru = getColumnValue(row, ['Ceza Türü', 'Ceza Turu', 'Tür', 'Type']) || null;
            let cezaDetay = getColumnValue(row, ['Ceza Detay', 'Detay', 'Açıklama']) || null;
            
            if (cezaMiktariRaw !== null && cezaMiktariRaw !== undefined) {
              const cezaStr = String(cezaMiktariRaw).trim().toLowerCase();
              
              // Check if it contains "men" or "gün"
              if (cezaStr.includes('men') || cezaStr.includes('gün')) {
                cezaTuru = 'men';
                cezaDetay = String(cezaMiktariRaw).trim(); // Keep original format
                cezaMiktari = 0; // Men cezaları sayısal değil
              } else {
                // Try to parse as number
                const parsed = parseFloat(cezaStr);
                cezaMiktari = isNaN(parsed) ? 0 : parsed;
              }
            }
            
            const record = {
              sira_no: getColumnValue(row, ['Sıra No', 'Sira No', 'No', '#']) || (index + 1),
              tarih: tarih ? formatExcelDate(tarih) : null,
              gun: getColumnValue(row, ['Gün', 'Gun', 'Day']) || '',
              plaka_no: plakaNo ? String(plakaNo).trim() : '',
              isim: isim ? String(isim).trim() : '',
              kabahat: kabahat ? String(kabahat).trim() : '',
              ceza_miktari: cezaMiktari,
              ay: getColumnValue(row, ['Ay', 'Month']) || null,
              mevsim: getColumnValue(row, ['Mevsim', 'Season']) || null,
              ceza_turu: cezaTuru,
              ceza_detay: cezaDetay
            };
            
            return record;
          }).filter(row => row.plaka_no && row.isim && row.kabahat); // Filter invalid rows

          console.log('[Excel Parse] Dönüştürülmüş veri ilk satır:', transformed[0]);
          console.log('[Excel Parse] Geçerli kayıt sayısı:', transformed.length);

          if (transformed.length === 0) {
            throw new Error('Excel dosyasında geçerli veri bulunamadı. Lütfen Plaka No, İsim ve Kabahat kolonlarının dolu olduğundan emin olun.');
          }

          resolve(transformed);
        } catch (err) {
          console.error('[Excel Parse] Hata:', err);
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsBinaryString(file);
    });
  };

  // Convert Excel date serial number to YYYY-MM-DD format
  const formatExcelDate = (excelDate: any): string => {
    if (typeof excelDate === 'string') {
      // Already a string, try to parse it
      const date = new Date(excelDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return excelDate;
    }
    
    // Excel serial date number
    const date = XLSX.SSF.parse_date_code(excelDate);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return new Date().toISOString().split('T')[0];
  };

  // Get existing record count
  const getExistingRecordCount = async () => {
    try {
      const { count } = await supabase
        .from('varakalar')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    } catch (err) {
      console.error('Error getting record count:', err);
      return 0;
    }
  };

  const handleFileUpload = async (file: File, shouldClearExisting: boolean) => {
    if (!file) return;

    setUploading(true);
    setError('');
    setProgress('Dosya okunuyor...');

    // Timeout after 60 seconds
    const timeoutId = setTimeout(() => {
      setError('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin veya dosya boyutunu kontrol edin.');
      setUploading(false);
      setProgress('');
    }, 60000); // 60 seconds

    try {
      // Parse Excel file
      const varakalar = await parseExcelFile(file);
      
      if (varakalar.length === 0) {
        clearTimeout(timeoutId);
        throw new Error('Excel dosyasında geçerli veri bulunamadı');
      }

      setProgress(`${varakalar.length} kayıt bulundu, veritabanına aktarılıyor...`);

      // Call edge function to import data with timeout handling
      const controller = new AbortController();
      const fetchTimeoutId = setTimeout(() => controller.abort(), 55000); // 55 seconds (before main timeout)

      try {
        const { data, error: importError } = await supabase.functions.invoke('import-varakalar', {
          body: {
            varakalar,
            clearExisting: shouldClearExisting
          }
        });

        clearTimeout(fetchTimeoutId);
        clearTimeout(timeoutId);

        if (importError) {
          throw new Error(importError.message || 'Veritabanı hatası');
        }

        if (data?.error) {
          throw new Error(data.error.message || 'İçe aktarma hatası');
        }

        // Success message with details
        const insertedCount = data?.data?.inserted || 0;
        let successMessage = `Başarılı! ${insertedCount} kayıt eklendi.`;
        
        if (shouldClearExisting && existingRecordCount > 0) {
          successMessage = `Başarılı! ${existingRecordCount} eski kayıt silindi, ${insertedCount} yeni kayıt eklendi.`;
        }

        setProgress(successMessage);
        setTimeout(() => {
          onUploadComplete();
          setProgress('');
          setShowConfirmDialog(false);
        }, 3000);
      } catch (fetchError: any) {
        clearTimeout(fetchTimeoutId);
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('İşlem çok uzun sürdü. Lütfen daha küçük bir dosya ile deneyin.');
        }
        throw fetchError;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Yükleme başarısız oldu');
      setProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Show confirmation dialog
        const count = await getExistingRecordCount();
        setExistingRecordCount(count);
        setPendingFile(file);
        setShowConfirmDialog(true);
      } else {
        setError('Lütfen Excel dosyası (.xlsx veya .xls) yükleyin');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Show confirmation dialog
      const count = await getExistingRecordCount();
      setExistingRecordCount(count);
      setPendingFile(files[0]);
      setShowConfirmDialog(true);
    }
  };

  const confirmUpload = () => {
    if (pendingFile) {
      handleFileUpload(pendingFile, clearExisting);
      setPendingFile(null);
    }
  };

  const cancelUpload = () => {
    setShowConfirmDialog(false);
    setPendingFile(null);
    setError('');
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="bg-surface rounded-lg p-8 border border-neutral-200 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-heading-md font-semibold text-neutral-900 mb-2">
            Excel Dosyası Yükle
          </h2>
          <p className="text-body text-neutral-700">
            Varaka kayıtlarını içeren Excel dosyanızı yükleyin
          </p>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && !uploading && (
          <div className="mb-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <h3 className="text-heading-sm font-semibold text-amber-900 mb-4">
              Yükleme Seçenekleri
            </h3>
            
            {existingRecordCount > 0 && (
              <div className="mb-4 p-3 bg-amber-100 rounded">
                <p className="text-body-sm text-amber-900">
                  <strong>Uyarı:</strong> Veritabanında {existingRecordCount} kayıt bulunuyor.
                </p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="clearOption"
                  checked={clearExisting}
                  onChange={() => setClearExisting(true)}
                  className="mt-1 w-4 h-4 text-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">
                    Tüm verileri sil ve yenilerini yükle
                  </div>
                  <div className="text-body-sm text-neutral-600">
                    Mevcut {existingRecordCount} kayıt silinecek, sadece yeni veriler kalacak (Önerilen)
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="clearOption"
                  checked={!clearExisting}
                  onChange={() => setClearExisting(false)}
                  className="mt-1 w-4 h-4 text-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">
                    Mevcut verilere ekle
                  </div>
                  <div className="text-body-sm text-neutral-600">
                    Yeni kayıtlar mevcut verilerin üzerine eklenecek (Duplicate olabilir)
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmUpload}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                Devam Et
              </button>
              <button
                onClick={cancelUpload}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-medium"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
            ${dragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-neutral-300 bg-neutral-50 hover:border-primary-400'
            }
            ${uploading || showConfirmDialog ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
          onClick={() => !uploading && !showConfirmDialog && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || showConfirmDialog}
          />

          <svg
            className={`mx-auto h-12 w-12 mb-4 ${dragging ? 'text-primary-500' : 'text-neutral-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-body font-medium text-neutral-900 mb-2">
            Dosyayı buraya sürükleyin veya tıklayarak seçin
          </p>
          <p className="text-body-sm text-neutral-500">
            Excel formatı (.xlsx, .xls) desteklenir
          </p>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center">
              {uploading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500 mr-3"></div>
              )}
              {!uploading && (
                <svg className="h-5 w-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <p className="text-body text-primary-900">{progress}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-semantic-error/10 border border-semantic-error/30 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-semantic-error mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-body text-semantic-error">{error}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-neutral-100 rounded-lg">
          <h3 className="text-body font-semibold text-neutral-900 mb-2">
            Excel Formatı
          </h3>
          <p className="text-body-sm text-neutral-700 mb-2">
            Excel dosyanız şu kolonları içermelidir (kolon adları esnek, benzerleri otomatik bulunur):
          </p>
          <ul className="text-body-sm text-neutral-600 space-y-1">
            <li>• <strong>Plaka No</strong> (gerekli) - veya: "Plaka"</li>
            <li>• <strong>İsim</strong> (gerekli) - veya: "Isim", "Ad"</li>
            <li>• <strong>Kabahat</strong> (gerekli) - veya: "Suç", "İhlal"</li>
            <li>• Zabıt Varaka Tarihi (önerilen) - veya: "Tarih", "Date"</li>
            <li>• Sıra No, Gün, Ceza Miktarı, Ay, Mevsim (opsiyonel)</li>
          </ul>
          <p className="text-body-sm text-amber-700 mt-2">
            💡 Sistem kolonları otomatik bulur, tam eşleşme gerekmez
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;
