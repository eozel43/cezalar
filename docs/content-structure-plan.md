# İçerik Yapısı Planı - Varakalar Dashboard

## 1. Malzeme Envanteri

**Veri Dosyaları:**
- `data/varakalar_data.json` (7 varaka kaydı: plaka_no, ceza_miktari)
- `data/varakalar_data.json > ozet` (İstatistikler: toplam_sayisi, ceza_turleri)

**Görsel Varlıklar:**
- Yok (tüm görselleştirme Chart.js ile dinamik oluşturulacak)

**İçerik Türü:**
- Veri odaklı dashboard (100% dinamik içerik)
- İstatistik kartları, grafik, tablo

## 2. Website Yapısı

**Tür:** SPA (Tek Sayfa Uygulama)

**Gerekçe:** 
- ≤5 bölüm (header, istatistikler, grafik, tablo, alt bilgi)
- Tek hedef: veri görselleştirme ve filtreleme
- <500 kelime (sadece başlıklar ve UI metinleri)
- Dashboard formatı için ideal

## 3. Sayfa/Bölüm Dökümü

### Sayfa 1: Ana Dashboard (`/`)

**Amaç:** Trafik cezalarını (varakalar) görselleştirme ve yönetme

**İçerik Eşlemesi:**

| Bölüm | Komponent Deseni | Veri Dosyası | Kullanılacak İçerik | Görsel Varlık |
|-------|------------------|--------------|---------------------|---------------|
| Header | Navigation Pattern | - | "Varakalar Dashboard" başlığı | - |
| Özet Kartları | Data Card Grid (3 kart) | `data/varakalar_data.json > ozet` | toplam_sayisi, ceza_turleri dağılımı, en yaygın ceza türü | - |
| Arama/Filtre Bölgesi | Input Pattern | - | Arama kutusu placeholder, filtre dropdown | - |
| Grafik Bölümü | Chart Container | `data/varakalar_data.json > ozet.ceza_turleri` | Ceza türü dağılım verisi (pasta/bar chart için) | - |
| Varaka Tablosu | Table Pattern | `data/varakalar_data.json > varakalar` | Tüm varakalar: plaka_no, ceza_miktari | - |

**YASAKLI (bu dosyada):**
- ❌ Tasarım kararları (renkler, hizalama, boşluklar)
- ❌ Stil talimatları ("ortalamalı", "sol hizalı", "kalın")
- ❌ Görsel işlemler ("koyu overlay", "gölge", "yuvarlatılmış köşeler")
- ❌ Dekoratif arka plan görselleri

**Sadece belirtilmiş:**
- ✅ Komponent desen isimleri (Navigation, Card Grid, Chart Container, Table)
- ✅ Veri dosya yolları ve çıkarma kuralları
- ✅ İçerik görselleri yok (dinamik veri görselleştirme)

## 4. İçerik Analizi

**Bilgi Yoğunluğu:** Orta
- 7 veri kaydı, 2 ceza türü
- 3 özet istatistik
- 1 grafik, 1 tablo
- Minimal metin içeriği (başlıklar ve UI metinleri)

**İçerik Dengesi:**
- Görsel/Grafik: 1 adet (%30)
- Veri/Tablo: 7 kayıt + 3 istatistik (%50)
- Metin: <100 kelime (%20)
- **İçerik Tipi:** Veri odaklı / Dashboard

**Hedef Kitle:**
- Yaş: 25-45 (kurumsal kullanıcılar, trafik yöneticileri)
- Kullanım: Masaüstü ve mobil (responsive)
- Beklenti: Hızlı veri erişimi, filtreleme, net görselleştirme
