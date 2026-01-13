# Admin & User Approval System - Deployment Guide

## Deployment Status
**Frontend URL**: https://itw8zo3cl1gl.space.minimax.io
**Status**: DEPLOYED - Backend setup required

## Manual Supabase Setup Required

Supabase Access Token expired olduğu için aşağıdaki adımları manuel olarak gerçekleştirmeniz gerekiyor.

### Step 1: Database Table Creation

Supabase Dashboard > SQL Editor'de aşağıdaki SQL'i çalıştırın:

```sql
-- User profiles tablosu
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Herkes kendi profilini görebilir
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- Adminler tüm profilleri görebilir
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Herkes kayıt sırasında profil oluşturabilir
CREATE POLICY "Anyone can create profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Adminler profilleri güncelleyebilir
CREATE POLICY "Admins can update profiles" ON user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

### Step 2: Create Admin User

Önce ozel.emre@gmail.com ile hesap oluşturun (Supabase Auth'tan veya web üzerinden). Ardından:

```sql
-- Admin kullanıcı oluştur
INSERT INTO user_profiles (user_id, email, role, status)
SELECT 
    id,
    'ozel.emre@gmail.com',
    'admin',
    'active'
FROM auth.users
WHERE email = 'ozel.emre@gmail.com'
ON CONFLICT (email) DO UPDATE
SET role = 'admin', status = 'active';
```

### Step 3: Deploy Edge Functions

**Edge Function 1: user-approval**

Supabase Dashboard > Edge Functions > New Function

Function Name: `user-approval`

Kod: `/workspace/supabase/functions/user-approval/index.ts`

**Edge Function 2: notify-admin-new-user**

Function Name: `notify-admin-new-user`

Kod: `/workspace/supabase/functions/notify-admin-new-user/index.ts`

## System Features

### Admin Features
- Pending users listesini görüntüleme
- Kullanıcıları onaylama/reddetme
- Admin panel (sağ üst köşede "Admin Panel" butonu)

### User Features
- Kayıt olma (otomatik "pending" status)
- Giriş yapma
- Onay beklerken "Onay Bekleniyor" badge
- Onay sonrası Excel upload yetkisi

### Excel Upload Improvements
- Smart sheet detection (TümVeri, data, veri)
- Flexible column mapping (trim, case-insensitive)
- Men cezaları otomatik algılama:
  - "15 gün men" → ceza_turu="men", ceza_detay="15 gün men", ceza_miktari=0
  - Sayısal cezalar → normal işleme

## User Flow

1. Yeni kullanıcı kayıt olur → status="pending"
2. Admin notification (console log - email entegrasyonu eklenebilir)
3. Admin panel'de görünür
4. Admin "Onayla" veya "Reddet" butonuna tıklar
5. Onaylanan kullanıcı → role="user", status="active"
6. Artık Excel upload yapabilir

## Testing Checklist

- [ ] user_profiles tablosu oluşturuldu
- [ ] RLS politikaları uygulandı
- [ ] Admin user (ozel.emre@gmail.com) oluşturuldu
- [ ] user-approval edge function deploy edildi
- [ ] notify-admin-new-user edge function deploy edildi
- [ ] Test user kaydı
- [ ] Admin panel erişimi
- [ ] User approval akışı
- [ ] Excel upload (pending user reddedilmeli)
- [ ] Excel upload (active user başarılı olmalı)

## Database Schema

```
user_profiles
├── id (uuid, primary key)
├── user_id (uuid, unique) → auth.users
├── email (text, unique)
├── role (text: 'admin', 'user', 'pending', 'rejected')
├── status (text: 'active', 'pending', 'rejected')
└── created_at (timestamp)
```

## File Locations

- Edge Functions: `/workspace/supabase/functions/`
  - `user-approval/index.ts`
  - `notify-admin-new-user/index.ts`
- Frontend Components:
  - `AdminPanel.tsx` (yeni)
  - `AuthContext.tsx` (güncellendi)
  - `Header.tsx` (admin button eklendi)
  - `App.tsx` (admin panel modal)
  - `ExcelUpload.tsx` (men cezası parse)

## Next Steps

1. Manuel Supabase setup'ı tamamlayın
2. Test user ile kayıt olun
3. Admin olarak giriş yapın
4. Admin panel'de pending user'ı onaylayın
5. Excel upload test edin
