# Backend Kurulum Talimatları

## Gerekli İşlemler

Supabase token expired olduğu için aşağıdaki işlemleri **Supabase Dashboard** üzerinden yapmanız gerekiyor:

### 1. Database Setup

**Supabase Dashboard > SQL Editor > New Query**

Aşağıdaki SQL'i çalıştırın:

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

-- Edge function'lar için ek policy
CREATE POLICY "Service role can do anything" ON user_profiles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
```

### 2. Admin User Oluşturma

**Önce ozel.emre@gmail.com ile Supabase Auth'tan hesap oluşturun:**

Supabase Dashboard > Authentication > Users > Invite User
- Email: ozel.emre@gmail.com
- Geçici şifre belirleyin

**Sonra SQL Editor'de:**

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

### 3. Edge Functions Deployment

**Edge Function 1: user-approval**

Supabase Dashboard > Edge Functions > Deploy new function

```
Function Name: user-approval
```

Kod dosyası: `/workspace/supabase/functions/user-approval/index.ts`

**Edge Function 2: notify-admin-new-user**

```
Function Name: notify-admin-new-user
```

Kod dosyası: `/workspace/supabase/functions/notify-admin-new-user/index.ts`

### 4. Test

1. https://itw8zo3cl1gl.space.minimax.io adresine gidin
2. "Giriş Yap" > "Kayıt Ol" ile test kullanıcı oluşturun
3. ozel.emre@gmail.com ile admin olarak giriş yapın
4. "Admin Panel" butonuna tıklayın
5. Pending user'ı onaylayın
6. Test user ile tekrar giriş yapın
7. "Excel Yükle" butonu artık aktif olmalı

## Dosya Lokasyonları

- SQL Setup: `/workspace/supabase-setup.sql`
- Admin User SQL: `/workspace/create-admin-user.sql`
- Edge Function 1: `/workspace/supabase/functions/user-approval/index.ts`
- Edge Function 2: `/workspace/supabase/functions/notify-admin-new-user/index.ts`

## Not: Email Bildirimleri

Şu anda `notify-admin-new-user` edge function'ı sadece console.log yapıyor. Gerçek email göndermek için:

1. Resend, SendGrid gibi bir email servisi seçin
2. API key'i Supabase secrets'a ekleyin
3. Edge function kodunu güncelleyin (TODO kısımları)

Örnek Resend entegrasyonu:

```typescript
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: admins.map(a => a.email),
        subject: 'Yeni Kullanıcı Kaydı',
        html: `<p>Yeni kullanıcı kaydı: ${email}</p>`
    })
});
```
