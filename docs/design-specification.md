# Tasarım Spesifikasyonu - Varakalar Dashboard

## 1. Yön ve Gerekçe

**Stil:** Modern Minimalism Premium

**Özü:** Profesyonel restraint, temiz arayüz, güven odaklı dashboard tasarımı. %90 nötr gri tonları, cömert boşluklar (48-96px arası), 12-16px yuvarlatma. Veri okunabilirliği maksimize edilmiş, interaktif elementler subtle feedback'lerle desteklenmiş.

**Gerçek Dünya Örnekleri:**
- Stripe Dashboard (ödeme analytics)
- Linear Issues (proje yönetimi)
- Vercel Analytics (web analytics)

**Gerekçe:** Dashboard uygulamaları için kanıtlanmış standart. Tablo ve grafik okunabilirliği en yüksek, kurumsal kullanıcılar için güvenilir ve tanıdık.

---

## 2. Tasarım Token'ları

### 2.1 Renkler

#### Primary (Modern Blue - Aksiyon ve Vurgu)

| Token | Hex | Kullanım |
|-------|-----|----------|
| primary-50 | #E6F0FF | Hover arka planlar |
| primary-100 | #CCE0FF | Seçili öğe arka planları |
| primary-500 | #0066FF | Primary butonlar, linkler, aktif durumlar |
| primary-600 | #0052CC | Buton hover durumu |
| primary-900 | #003D99 | Koyu vurgular (nadir) |

#### Neutrals (Yapı ve İçerik - %90 kullanım)

| Token | Hex | Kullanım |
|-------|-----|----------|
| neutral-50 | #FAFAFA | Sayfa arka planı |
| neutral-100 | #F5F5F5 | Kart yüzeyleri |
| neutral-200 | #E5E5E5 | Kenarlıklar, ayırıcılar |
| neutral-500 | #A3A3A3 | Devre dışı metin |
| neutral-700 | #404040 | İkincil metin |
| neutral-900 | #171717 | Ana metin |

#### Semantic (Durum Göstergeleri)

| Token | Hex | Kullanım |
|-------|-----|----------|
| success | #10B981 | Başarı mesajları |
| warning | #F59E0B | Uyarılar |
| error | #EF4444 | Hata mesajları |
| info | #3B82F6 | Bilgi mesajları |

#### Background System (Derinlik İllüzyonu)

| Token | Hex | Kullanım |
|-------|-----|----------|
| bg-page | #FAFAFA | Ana sayfa arkaplan (neutral-50) |
| bg-surface | #FFFFFF | Kartlar, modal arkaplan (≥5% kontrast) |
| bg-elevated | #FFFFFF | Aktif/hover kartlar (shadow ile vurgu) |

**WCAG Doğrulaması (AA Standart - 4.5:1 minimum):**
- primary-500 (#0066FF) on white: 4.53:1 ✅ (metin için güvenli)
- neutral-900 (#171717) on white: 16.5:1 ✅ AAA (body text için ideal)
- neutral-700 (#404040) on white: 8.6:1 ✅ AAA (secondary text)

### 2.2 Tipografi

#### Font Families

| Kullanım | Font Stack |
|----------|-----------|
| Primary | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |

**Notlar:**
- Inter: Ekran optimizasyonlu, mükemmel okunabilirlik, nötr kişilik
- Weights: Regular 400, Medium 500, Semibold 600, Bold 700

#### Type Scale (Desktop)

| Token | Boyut | Ağırlık | Line Height | Letter Spacing | Kullanım |
|-------|-------|---------|-------------|----------------|----------|
| heading-xl | 48px | Bold 700 | 1.2 | -0.01em | Ana sayfa başlığı |
| heading-lg | 32px | Semibold 600 | 1.3 | 0 | Bölüm başlıkları |
| heading-md | 24px | Semibold 600 | 1.4 | 0 | Kart başlıkları |
| body-lg | 18px | Regular 400 | 1.6 | 0 | Öne çıkan paragraflar |
| body | 16px | Regular 400 | 1.5 | 0 | Standart metin, tablo içerikleri |
| body-sm | 14px | Regular 400 | 1.5 | 0 | Yardımcı metin, caption |
| caption | 12px | Regular 400 | 1.4 | 0.01em | Metadata, timestamp |

#### Type Scale (Mobile <768px)

| Token | Boyut |
|-------|-------|
| heading-xl | 36px |
| heading-lg | 28px |
| heading-md | 20px |
| body | 16px |

**Okunabilirlik:**
- Max satır uzunluğu: 60-75 karakter (~600px)
- Body line-height: 1.5-1.6
- Heading line-height: 1.2-1.4

### 2.3 Boşluklar (8-Point Grid)

| Token | Değer | Kullanım |
|-------|-------|----------|
| spacing-xs | 8px | İkon + metin arası |
| spacing-sm | 16px | Form elemanları arası |
| spacing-md | 24px | İlgili grup boşluğu |
| spacing-lg | 32px | Kart iç padding (minimum) |
| spacing-xl | 48px | Bölüm iç boşlukları |
| spacing-2xl | 64px | Bölümler arası (minimum) |
| spacing-3xl | 96px | Hero bölüm boşlukları |

**Kritik Kurallar:**
- Kart padding: minimum 32px (mobilde 24px)
- Bölümler arası: minimum 64px
- İçerik:boşluk oranı = 60:40

### 2.4 Border Radius

| Token | Değer | Kullanım |
|-------|-------|----------|
| radius-sm | 8px | İkonlar, küçük elementler |
| radius-md | 12px | Butonlar, inputlar |
| radius-lg | 16px | Kartlar, modaller |
| radius-xl | 24px | Büyük containerlar (nadir) |

### 2.5 Shadows

```css
/* sm - Subtle kart gölgesi */
shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)

/* md - Kart hover */
shadow-md: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)

/* lg - Modal/elevated */
shadow-lg: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)
```

### 2.6 Animasyon

| Token | Değer | Kullanım |
|-------|-------|----------|
| duration-fast | 200ms | Buton hover |
| duration-base | 250ms | Standart transition |
| duration-slow | 300ms | Modal, drawer |
| easing-default | ease-out | %90 kullanım |
| easing-smooth | ease-in-out | Elegance gerekli yerlerde |

---

## 3. Komponent Spesifikasyonları

### 3.1 Stat Card (İstatistik Kartı)

**Yapı:**
```
Card Container
  └─ Icon + Label (üst)
  └─ Large Number (ortada, vurgulu)
  └─ Subtitle/Trend (alt)
```

**Tokenlar:**
- Padding: spacing-lg (32px tüm yönlerde)
- Background: bg-surface (white)
- Radius: radius-lg (16px)
- Border: 1px solid neutral-200
- Shadow: shadow-sm (default)

**Tipografi:**
- Label: body-sm, neutral-700
- Number: heading-xl (48px), neutral-900, Bold 700
- Subtitle: body-sm, neutral-500

**States:**
- Default: shadow-sm, scale(1)
- Hover: shadow-md, translateY(-4px), scale(1.02), 250ms ease-out

**Not:** Grid layout 3 kolon (desktop), 1 kolon (mobil). Gap 24px.

### 3.2 Button

**Primary:**
- Height: 48px
- Padding: 16px horizontal
- Radius: radius-md (12px)
- Font: Semibold 600, body (16px)
- Background: primary-500
- Text: white
- Hover: primary-600 + translateY(-2px) + scale(1.02)
- Active: primary-900

**Secondary:**
- Aynı boyutlar
- Border: 2px solid neutral-200
- Background: transparent
- Text: neutral-700
- Hover: bg neutral-50

### 3.3 Input / Search Field

**Yapı:**
- Height: 48px
- Padding: 12px horizontal
- Radius: radius-md (12px)
- Border: 1px solid neutral-200
- Font: Regular 400, body (16px)
- Placeholder: neutral-500

**States:**
- Focus: 2px primary-500 ring (outline), border transparent
- Error: border error, 2px error ring
- Disabled: bg neutral-100, text neutral-500

**Icon Slot:** 20px icon, spacing-xs (8px) gap

### 3.4 Table (Varaka Tablosu)

**Yapı:**
```
Table Container (card)
  └─ Table Header (sticky)
  └─ Table Body (rows)
  └─ Pagination (footer)
```

**Tokenlar:**
- Container: bg-surface, radius-lg (16px), padding spacing-lg (32px)
- Border: 1px solid neutral-200
- Shadow: shadow-sm

**Header:**
- Background: neutral-50
- Text: body-sm, Semibold 600, neutral-900
- Padding: spacing-sm (16px) vertical, spacing-md (24px) horizontal
- Border-bottom: 1px solid neutral-200

**Body Rows:**
- Height: 56px minimum
- Padding: spacing-sm (16px) vertical, spacing-md (24px) horizontal
- Border-bottom: 1px solid neutral-100
- Text: body (16px), Regular 400, neutral-900
- Hover: bg neutral-50, transition 200ms

**Sıralama İkonları:** 16px, neutral-500, hover neutral-900

**Responsive:** Mobilde horizontal scroll, minimum 320px genişlik

### 3.5 Chart Container

**Yapı:**
```
Card Container
  └─ Chart Title (üst)
  └─ Chart Canvas (Chart.js)
  └─ Legend (alt, opsiyonel)
```

**Tokenlar:**
- Container: bg-surface, radius-lg (16px), padding spacing-lg (32px)
- Shadow: shadow-sm
- Chart height: 300px (desktop), 250px (mobile)

**Chart Styling (Chart.js config):**
- Renk paleti: primary-500, primary-300, neutral-400 (maksimum 3 renk)
- Font: Inter, body (16px)
- Grid lines: neutral-200, 1px
- Tooltip: bg neutral-900, text white, radius-md
- Animations: easing-smooth, duration-base (250ms)

**Chart Türü:** Pasta (Pie) veya Bar chart önerilir

### 3.6 Navigation Bar

**Yapı:**
```
Fixed Header
  └─ Logo/Title (sol)
  └─ Nav Links (merkez, opsiyonel)
  └─ User Menu / CTA (sağ, opsiyonel)
```

**Tokenlar:**
- Height: 64px
- Position: sticky top
- Background: bg-surface + backdrop-blur (8px)
- Border-bottom: 1px solid neutral-200
- Padding: 0 spacing-xl (48px) horizontal

**Logo/Title:**
- Font: heading-lg (32px), Bold 700
- Color: neutral-900

**Shadow on Scroll:** shadow-sm (dinamik JavaScript ile)

---

## 4. Layout & Responsive

### 4.1 Layout Desenleri

**Content-structure-plan.md'e göre sayfa yapısı:**

**Navigation Section (64px):**
- Fixed header
- "Varakalar Dashboard" başlığı
- Horizontal layout

**Stats Section (auto height):**
- 3-column grid (desktop) → 1-column stack (mobile)
- Stat Card Pattern (§3.1) kullanılır
- Gap: 24px
- Container padding: spacing-2xl (64px) vertical

**Filter Section (auto height):**
- Horizontal layout: Search Input (60%) + Dropdown Filter (40%)
- Input Pattern (§3.3) kullanılır
- Gap: 16px
- Container padding: spacing-md (24px) vertical

**Chart Section (auto height):**
- Full-width chart container (12 columns)
- Chart Container Pattern (§3.5) kullanılır
- Height: 300px (fixed)
- Margin: spacing-2xl (64px) top

**Table Section (auto height):**
- Full-width table container (12 columns)
- Table Pattern (§3.4) kullanılır
- Min-height: 400px (scroll içeride)
- Margin: spacing-2xl (64px) top

### 4.2 Grid System

**Max Container Width:** 1280px
**Grid:** 12-column system
**Gutter:** 24px (desktop), 16px (mobile)

**Kullanım:**
- Stat cards: 4 columns each (4-4-4), mobilde 12 full
- Chart/Table: 12 full width
- Filter row: Search 7 cols, Dropdown 5 cols

### 4.3 Breakpoints

```
sm:  640px  (Mobile landscape)
md:  768px  (Tablet)
lg:  1024px (Desktop)
xl:  1280px (Large desktop)
```

### 4.4 Responsive Adaptasyonlar

**Desktop (≥1024px):**
- 3-column stat grid
- Table full-width
- Chart 300px height

**Tablet (768px-1023px):**
- 2-column stat grid (ilk iki kart yan yana, üçüncü alta)
- Table horizontal scroll
- Chart 280px height

**Mobile (<768px):**
- 1-column stack (tüm elementler dikey)
- Spacing %30 azalt (64px → 40px)
- Touch targets minimum 44×44px
- Filter row dikey stack
- Table card view (her satır kart formatında, opsiyonel)

### 4.5 Touch Targets

- Minimum: 44×44px (iOS standard)
- Preferred: 48×48px (buttons, inputs)
- Spacing: 8px minimum aralarında

---

## 5. İnteraksiyon

### 5.1 Animasyon Standartları

**Timing:**
- Hızlı: 200ms (button hover, input focus)
- Standart: 250ms (çoğu transition)
- Yavaş: 300ms (modal açılma, drawer)

**Easing:**
- %90 ease-out (doğal deceleration)
- %10 ease-in-out (smooth başlangıç/bitiş)

**Performance Kuralı:**
- ✅ Sadece `transform` ve `opacity` animate edilir
- ❌ ASLA width, height, margin, padding, top, left (reflow neden olur)

### 5.2 Komponent İnteraksiyonları

**Stat Card:**
- Hover: translateY(-4px) + scale(1.02) + shadow-md
- Duration: 250ms ease-out

**Button:**
- Hover: translateY(-2px) + scale(1.02) + color darkening
- Active: translateY(0) + scale(0.98)
- Duration: 200ms ease-out

**Table Row:**
- Hover: background neutral-50
- Duration: 200ms ease-out

**Input Field:**
- Focus: 2px ring primary-500 (outline animation)
- Duration: 200ms ease-out

**Chart:**
- Initial load: fade in + scale(0.95 → 1)
- Duration: 300ms ease-out
- Stagger: 50ms delay per element

### 5.3 Accessibility (prefers-reduced-motion)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5.4 Loading States

**Skeleton Screens:**
- Stat cards: pulse animation neutral-100 → neutral-200
- Table: shimmer effect soldan sağa
- Chart: spinner (primary-500)
- Duration: 1500ms loop

### 5.5 Micro-İnteraksiyonlar

- **Sayfa yüklenme:** Fade in + translateY(20px → 0), stagger her bölüm
- **Arama:** Input'a her yazıda 300ms debounce, sonra tablo filtrele
- **Filtreleme:** Dropdown değişiminde smooth transition (fadeOut old rows, fadeIn new)
- **Sıralama:** Icon rotation (0° → 180°), 200ms

---

## 6. Özel Dashboard Kuralları

### 6.1 Veri Görselleştirme İlkeleri

**Grafik Renkleri (maksimum 2-3 renk):**
- Ana: primary-500 (#0066FF)
- İkincil: primary-300 (#99CCFF)
- Üçüncül: neutral-400 (#A3A3A3)

**Tablo Okunabilirliği:**
- Alternatif satır renklendirme YAPMA (modern minimalism)
- Sadece hover efekti (neutral-50 bg)
- Border'lar subtle (neutral-100/200)

**İstatistik Sayıları:**
- Büyük ve bold (48px, Bold 700)
- Koyu renk (neutral-900)
- İkon desteği (opsiyonel, 24px)

### 6.2 Türkçe Karakter Desteği

- Font: Inter (Türkçe karakterleri destekler)
- Büyük İ/i problemleri yok
- Line-height Türkçe metinler için 1.5-1.6 (İngilizce'den %5 fazla)

### 6.3 Anti-Pattern'ler (YAPILMAMALILAR)

❌ **Layout:**
- Sidebar navigation kullanma (horizontal header kullan)
- <32px kart padding
- <48px bölüm boşlukları

❌ **Renkler:**
- Neon/fluorescent renkler
- Gradient arka planlar (solid renkler kullan)
- Düşük kontrast (<4.5:1)

❌ **Animasyonlar:**
- Width/height/margin animasyonları
- Glow efektleri (text-shadow blur)
- >500ms duration

❌ **Typography:**
- UI ikonu olarak emoji kullanma (SVG kullan)
- Karışık font aileleri (sadece Inter)

---

**Doküman Sürümü:** 1.0  
**Oluşturma Tarihi:** 2025-10-27  
**Toplam Kelime:** ~2400  
**Sayfa Sayısı:** 5 bölüm, 6 komponent
