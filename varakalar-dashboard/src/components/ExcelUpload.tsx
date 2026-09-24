import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, functionErrorMessage } from '../lib/supabase';
import { formatNumber } from '../lib/format';
import { Card, CardHeader, Button } from './ui';
import { cn } from '../lib/utils';

interface ExcelUploadProps {
  onUploadComplete: () => void;
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
          
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          
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
          }).filter(row => row.tarih && row.plaka_no && row.isim && row.kabahat); // Filter invalid rows


          if (transformed.length === 0) {
            throw new Error('Excel dosyasında geçerli veri bulunamadı. Lütfen Tarih, Plaka No, İsim ve Kabahat kolonlarının dolu olduğundan emin olun.');
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

  // Convert an Excel date (serial number, 'GG.AA.YYYY' or ISO text) to YYYY-MM-DD; null if unreadable
  const formatExcelDate = (excelDate: any): string | null => {
    if (typeof excelDate === 'string') {
      const text = excelDate.trim();
      const tr = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
      if (tr) {
        return `${tr[3]}-${tr[2].padStart(2, '0')}-${tr[1].padStart(2, '0')}`;
      }
      const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
    }

    if (typeof excelDate === 'number') {
      const date = XLSX.SSF.parse_date_code(excelDate);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }

    return null;
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
    setUploading(true);
    setError('');
    setProgress('Dosya okunuyor…');

    try {
      const varakalar = await parseExcelFile(file);
      setProgress(`${formatNumber(varakalar.length)} kayıt bulundu, veritabanına aktarılıyor…`);

      const { data, error: importError } = await supabase.functions.invoke('import-varakalar', {
        body: { varakalar, clearExisting: shouldClearExisting },
      });

      if (importError) throw new Error(await functionErrorMessage(importError, 'Veritabanına aktarım başarısız oldu'));
      if (data?.error) throw new Error(data.error.message || 'İçe aktarma hatası');

      const inserted = data?.data?.inserted || 0;
      const deleted = data?.data?.deleted || 0;
      const message = shouldClearExisting && deleted > 0
        ? `${formatNumber(deleted)} eski kayıt silindi, ${formatNumber(inserted)} yeni kayıt eklendi`
        : `${formatNumber(inserted)} kayıt eklendi`;

      if (data?.data?.errors) {
        toast.warning(`Aktarım kısmen tamamlandı: ${message}. Bazı kayıtlar eklenemedi.`);
      } else {
        toast.success(`Aktarım tamamlandı: ${message}`);
      }
      setProgress('');
      setShowConfirmDialog(false);
      setPendingFile(null);
      onUploadComplete();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Yükleme başarısız oldu');
      setProgress('');
    } finally {
      setUploading(false);
    }
  };

  const isExcel = (file: File) => /\.xlsx?$/i.test(file.name);

  const prepareFile = async (file: File) => {
    if (!isExcel(file)) {
      setError('Lütfen Excel dosyası (.xlsx veya .xls) seçin');
      return;
    }
    setError('');
    setExistingRecordCount(await getExistingRecordCount());
    setPendingFile(file);
    setShowConfirmDialog(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) prepareFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) prepareFile(file);
    e.target.value = '';
  };

  const confirmUpload = () => {
    if (pendingFile) {
      handleFileUpload(pendingFile, clearExisting);
    }
  };

  const cancelUpload = () => {
    setShowConfirmDialog(false);
    setPendingFile(null);
    setError('');
  };

  const locked = uploading || showConfirmDialog;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="xl:col-span-2">
        <CardHeader title="Excel Dosyası Aktar" description="Zabıt varakası kayıtlarını içeren Excel dosyasını seçin" />
        <div className="p-5 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !locked && fileInputRef.current?.click()}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !locked && fileInputRef.current?.click()}
            role="button"
            tabIndex={locked ? -1 : 0}
            aria-disabled={locked}
            className={cn(
              'border border-dashed rounded-lg px-6 py-10 text-center transition-colors',
              dragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-neutral-50 hover:border-primary-400',
              locked ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
            )}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" disabled={locked} />
            <FileUp className={cn('mx-auto h-8 w-8 mb-3', dragging ? 'text-primary-600' : 'text-neutral-400')} strokeWidth={1.5} />
            <p className="text-body font-medium text-neutral-800">Dosyayı sürükleyip bırakın veya seçmek için tıklayın</p>
            <p className="text-body-sm text-neutral-500 mt-1">.xlsx veya .xls</p>
          </div>

          {showConfirmDialog && !uploading && pendingFile && (
            <div className="border border-neutral-200 rounded-lg">
              <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
                <div className="text-body font-medium text-neutral-900">Aktarım seçenekleri</div>
                <div className="text-body-sm text-neutral-500 truncate">{pendingFile.name}</div>
              </div>
              <div className="p-4 space-y-3">
                {existingRecordCount > 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-body-sm text-amber-900">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Veritabanında şu anda {formatNumber(existingRecordCount)} kayıt bulunuyor.
                  </div>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="clearOption" checked={clearExisting} onChange={() => setClearExisting(true)} className="mt-1 accent-primary-600" />
                  <span>
                    <span className="block text-body font-medium text-neutral-900">Mevcut kayıtları değiştir</span>
                    <span className="block text-body-sm text-neutral-500">
                      {formatNumber(existingRecordCount)} kayıt silinir, yalnızca dosyadaki kayıtlar kalır (önerilen)
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="clearOption" checked={!clearExisting} onChange={() => setClearExisting(false)} className="mt-1 accent-primary-600" />
                  <span>
                    <span className="block text-body font-medium text-neutral-900">Mevcut kayıtlara ekle</span>
                    <span className="block text-body-sm text-neutral-500">Aynı kayıtlar dosyada da varsa tekrarlanabilir</span>
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-neutral-200">
                <Button onClick={cancelUpload}>İptal</Button>
                <Button variant="primary" onClick={confirmUpload}>Aktarımı Başlat</Button>
              </div>
            </div>
          )}

          {progress && (
            <div role="status" className="flex items-center gap-3 px-4 py-3 rounded-md border border-primary-200 bg-primary-50 text-body text-primary-900">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {progress}
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 px-4 py-3 rounded-md border border-red-200 bg-red-50 text-body text-semantic-error">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Dosya Biçimi" />
        <div className="p-5 text-body-sm text-neutral-700 space-y-3">
          <p>Kolon adları esnek eşleştirilir; birebir aynı olmaları gerekmez.</p>
          <dl className="space-y-2">
            {[
              ['Zabıt Varaka Tarihi', 'Zorunlu · "Tarih" · GG.AA.YYYY'],
              ['Plaka No', 'Zorunlu · "Plaka"'],
              ['İsim', 'Zorunlu · "Ad"'],
              ['Kabahat', 'Zorunlu · "Suç", "İhlal"'],
              ['Ceza Miktarı', 'Sayı veya men süresi (ör. "3 gün men")'],
              ['Sıra No, Gün, Ay, Mevsim', 'İsteğe bağlı'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="font-medium text-neutral-900">{k}</dt>
                <dd className="text-neutral-500">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
    </div>
  );
};

export default ExcelUpload;
