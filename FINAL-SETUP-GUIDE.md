# Admin & User Approval System - Tamamlanma Durumu

## Deployment URL
**Frontend**: https://itw8zo3cl1gl.space.minimax.io

## Tamamlanan Özellikler

### Frontend (100% Tamamlandı)
- AdminPanel komponenti (pending users yönetimi)
- AuthContext (profile support eklenmiş)
- Header (admin panel butonu, status badge)
- App.tsx (admin panel modal, status kontrolü)
- ExcelUpload (men cezası parse, smart column mapping)
- Build & Deploy: Tamamlandı

### Backend Kodu (100% Hazır)
- user_profiles tablo şeması
- RLS politikaları (6 policy)
- user-approval edge function
- notify-admin-new-user edge function (2 versiyon)
- SQL migration scripts

## Manuel Kurulum Gereken Bileşenler

### 1. Database & RLS (Kritik - 15 dakika)

**Neden manuel**: Supabase access token expired

**Adımlar**:
1. Supabase Dashboard > SQL Editor > New Query
2. `/workspace/supabase-setup.sql` içeriğini kopyala-yapıştır
3. Run ile çalıştır
4. Tablo ve RLS politikaları oluşturulacak

**Doğrulama**:
```sql
-- Bu sorguyu çalıştırın, user_profiles tablosunu görmeli
SELECT * FROM user_profiles LIMIT 1;
```

### 2. Admin User Oluşturma (Kritik - 5 dakika)

**Adımlar**:
1. Supabase Dashboard > Authentication > Users > Invite User
   - Email: ozel.emre@gmail.com
   - Geçici şifre belirleyin
2. SQL Editor'de:
   - `/workspace/create-admin-user.sql` içeriğini çalıştırın
3. Admin user oluşturuldu

**Doğrulama**:
```sql
SELECT * FROM user_profiles WHERE role = 'admin';
```

### 3. Edge Functions Deployment (Kritik - 10 dakika)

**Function 1: user-approval**
- Supabase Dashboard > Edge Functions > Deploy new function
- Name: `user-approval`
- Kod: `/workspace/supabase/functions/user-approval/index.ts`

**Function 2: notify-admin-new-user**
- Name: `notify-admin-new-user`
- Kod: `/workspace/supabase/functions/notify-admin-new-user/index.ts`

**Doğrulama**:
- Edge Functions listesinde iki function görünmeli
- Her ikisi de "Active" durumunda olmalı

### 4. Email Notification (Opsiyonel - 20 dakika)

**Mevcut Durum**: Console.log ile bildirim (çalışıyor ama email yok)

**Email Eklemek İçin**:
1. Resend.com'da hesap oluşturun (ücretsiz)
2. API key alın
3. Supabase Secrets'a ekleyin: `RESEND_API_KEY`
4. İyileştirilmiş versiyonu deploy edin:
   - `/workspace/supabase/functions/notify-admin-new-user-v2/index.ts`

**Detaylar**: `/workspace/EMAIL-NOTIFICATION-SETUP.md`

## Test Senaryosu

### Adım 1: Admin Hesap Test
1. https://itw8zo3cl1gl.space.minimax.io
2. "Giriş Yap" ile ozel.emre@gmail.com giriş yap
3. Sağ üstte "Admin Panel" butonu görünmeli
4. Admin Panel açıldığında boş liste (henüz pending user yok)

### Adım 2: User Registration Test
1. Yeni tarayıcı/incognito modda siteyi aç
2. "Giriş Yap" > "Kayıt Ol"
3. Test email (örn: test@example.com) ile kayıt ol
4. Giriş yaptıktan sonra "Onay Bekleniyor" badge görünmeli
5. "Excel Yükle" butonu OLMAMALI (henüz onaylanmadı)

### Adım 3: Admin Approval Test
1. Admin hesabına geri dön
2. Admin Panel'i aç
3. Test user pending listede görünmeli
4. "Onayla" butonuna tıkla
5. Başarı mesajı ve user listeden çıkmalı

### Adım 4: Active User Test
1. Test user hesabına geri dön
2. Sayfayı yenile
3. "Onay Bekleniyor" badge kaybolmalı
4. "Excel Yükle" butonu görünmeli
5. Excel dosyası yükleme testi yap

### Adım 5: Excel Upload Test
1. Active user olarak giriş yap
2. "Excel Yükle" butonuna tıkla
3. Varakalar.xlsx dosyasını yükle
4. Men cezaları düzgün parse edildiğini kontrol et:
   - "15 gün men" → ceza_turu="men", ceza_miktari=0
   - Dashboard'da toplam ceza tutarına men cezaları dahil değil

## Dosya Lokasyonları

### SQL Scripts
- `/workspace/supabase-setup.sql` - Database tablo ve RLS
- `/workspace/create-admin-user.sql` - Admin user

### Edge Functions
- `/workspace/supabase/functions/user-approval/index.ts`
- `/workspace/supabase/functions/notify-admin-new-user/index.ts` (mevcut)
- `/workspace/supabase/functions/notify-admin-new-user-v2/index.ts` (email destekli)

### Documentation
- `/workspace/BACKEND-SETUP-REQUIRED.md` - Backend kurulum detayları
- `/workspace/EMAIL-NOTIFICATION-SETUP.md` - Email kurulum detayları
- `/workspace/ADMIN-SYSTEM-DEPLOYMENT.md` - Genel sistem dokümantasyonu

## Hata Durumları & Çözümler

### "new row violates row-level security policy"
**Neden**: RLS politikaları eksik
**Çözüm**: `/workspace/supabase-setup.sql` çalıştırıldığından emin olun

### "Admin bulunamadı" hatası
**Neden**: Admin user oluşturulmamış
**Çözüm**: `/workspace/create-admin-user.sql` çalıştırın

### "Function not found" hatası
**Neden**: Edge functions deploy edilmemiş
**Çözüm**: Her iki edge function'ı Supabase Dashboard'dan deploy edin

### Email gelmiyor
**Neden**: RESEND_API_KEY tanımlı değil
**Çözüm**: Opsiyonel - `/workspace/EMAIL-NOTIFICATION-SETUP.md` takip edin

## Başarı Kriterleri

- [ ] user_profiles tablosu oluşturuldu
- [ ] RLS politikaları aktif
- [ ] ozel.emre@gmail.com admin user olarak eklendi
- [ ] user-approval edge function deploy edildi
- [ ] notify-admin-new-user edge function deploy edildi
- [ ] Test user kayıt olabildi (pending status)
- [ ] Admin panel'de pending user görünüyor
- [ ] Admin onayladı, user active oldu
- [ ] Active user Excel upload yapabildi
- [ ] Men cezaları düzgün parse edildi
- [ ] (Opsiyonel) Email bildirimleri çalışıyor

## Tahmini Süre

- **Minimum kurulum** (email olmadan): 30 dakika
- **Tam kurulum** (email dahil): 50 dakika

## Destek

Kurulum sırasında sorun yaşarsanız:
1. Supabase Dashboard > Project Logs kontrol edin
2. Browser console loglarını kontrol edin
3. Edge function loglarını kontrol edin

Her şey doğru kurulduğunda sistem şu şekilde çalışacak:
1. Yeni kullanıcı kayıt olur
2. "pending" status alır
3. (Email varsa) Admin'e bildirim gider
4. Admin panel'de görünür
5. Admin onaylar
6. Kullanıcı "active" olur
7. Excel upload yetkisi gelir
