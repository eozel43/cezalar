# Cezalar Projesi

Bu proje, varakalar verilerini görselleştiren ve yöneten bir dashboard uygulamasıdır.

## Proje Yapısı

- `varakalar-dashboard/`: React + Vite ile geliştirilmiş frontend uygulaması.
- `supabase/`: Veritabanı şemaları, migration'lar ve edge function'lar.
- `data/`: Örnek veri dosyaları.

## Netlify Dağıtımı

Proje Netlify üzerinde yayınlanmaya hazır şekilde yapılandırılmıştır.

### Gereksinimler

Netlify üzerinde aşağıdaki ortam değişkenlerini (Environment Variables) tanımlamanız gerekmektedir:

- `VITE_SUPABASE_URL`: Supabase proje URL'iniz.
- `VITE_SUPABASE_ANON_KEY`: Supabase anonim anahtarınız.

### Dağıtım Ayarları

`netlify.toml` dosyası otomatik olarak aşağıdaki ayarları kullanır:

- **Base directory:** `varakalar-dashboard`
- **Build command:** `pnpm build`
- **Publish directory:** `dist`

## Yerel Geliştirme

1. `varakalar-dashboard` dizinine gidin.
2. `pnpm install` ile bağımlılıkları kurun.
3. `pnpm dev` ile geliştirme sunucusunu başlatın.
