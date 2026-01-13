# Email Notification Sistemi Kurulumu

## Resend Entegrasyonu (Önerilen)

### 1. Resend Hesabı Oluşturun

1. https://resend.com adresine gidin
2. Ücretsiz hesap oluşturun (3,000 email/ay ücretsiz)
3. API Key alın

### 2. Supabase'e API Key Ekleyin

**Supabase Dashboard > Project Settings > Edge Functions > Secrets**

Secret Name: `RESEND_API_KEY`
Secret Value: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Domain Doğrulaması (Opsiyonel ama Önerilen)

Resend Dashboard'da domain ekleyin ve DNS kayıtlarını yapılandırın. Bu yapılmazsa:
- `from` adresini değiştirin: `noreply@yourdomain.com` → kendi domain'iniz
- Veya Resend'in test domain'ini kullanın (sadece test için)

### 4. Edge Function Güncelleme

Yeni versiyonu deploy edin: `/workspace/supabase/functions/notify-admin-new-user-v2/index.ts`

Bu versiyon:
- RESEND_API_KEY varsa email gönderir
- Yoksa sadece console.log yapar (mevcut davranış)
- Hem email hem console log destekler
- Hata durumlarını loglar

### Alternatif: SendGrid

```typescript
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        personalizations: [{
            to: admins.map(a => ({ email: a.email }))
        }],
        from: { email: 'noreply@yourdomain.com' },
        subject: 'Yeni Kullanıcı Kaydı - Onay Bekliyor',
        content: [{
            type: 'text/html',
            value: `<h2>Yeni Kullanıcı: ${email}</h2>`
        }]
    })
});
```

## Test

1. RESEND_API_KEY ekledikten sonra edge function'ı deploy edin
2. Web sitesine gidin ve test user kaydı yapın
3. Admin email'i kontrol edin
4. Eğer email gelmezse:
   - Supabase Logs > Edge Functions > notify-admin-new-user loglarını kontrol edin
   - Resend Dashboard > Logs bölümünü kontrol edin

## Email Template

Mevcut template basit HTML içeriyor:
- Kullanıcı email
- "Onay bekliyor" durumu
- Bilgilendirme metni

Özelleştirmek için edge function kodundaki HTML kısmını düzenleyin.

## Güvenlik Notları

- API key'i asla frontend'e eklemeyin
- API key'i sadece Supabase Secrets'ta tutun
- from adresi doğrulanmış domain olmalı (spam engelleme)
