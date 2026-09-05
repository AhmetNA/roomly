# AGENTS.md

Bu dosya, bu repoda çalışan herhangi bir AI ajanı (Claude Code dahil) için proje yapısı ve teknik yönlendirme içerir.

## Proje Özeti

Roomly, ev arkadaşları için iki modüllü bir mobil uygulama: ortak harcama/borç takibi ve paylaşımlı ihtiyaç listesi. Detaylı özellik listesi için [FEATURES.md](FEATURES.md).

## Teknoloji Seçimleri

| Katman           | Seçim                                                  | Gerekçe                                                                                                                                           |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobil framework  | React Native + Expo                                    | Tek kod tabanından iOS + Android, hızlı iterasyon, EAS ile kolay build/dağıtım                                                                    |
| Backend / DB     | Supabase (Postgres + Auth + Realtime)                  | Kendi backend'imizi yazmadan auth, veritabanı ve realtime senkronizasyon; ev arkadaşları arasında anlık güncelleme gerektiği için Realtime önemli |
| State management | React Query (TanStack Query) + Zustand (gerekirse)     | Sunucu verisi için React Query, basit local UI state için Zustand                                                                                 |
| Navigasyon       | Expo Router                                            | Dosya tabanlı routing, Expo ile native entegrasyon                                                                                                |
| Stil             | NativeWind (Tailwind for RN) veya sade StyleSheet      | Henüz kesinleşmedi                                                                                                                                |
| Tema             | React Native `useColorScheme` + özel `theme.ts` paleti | Ek ücretli/harici servis gerektirmeden sistem temasını takip eden light/dark destek                                                               |
| Yerelleştirme    | i18next + react-i18next                                | Ücretsiz, Expo ile uyumlu, yaygın kullanılan i18n çözümü                                                                                          |

Bu seçimler ilk kuruluşta değiştirilebilir; büyük bir teknoloji değişikliği yapılacaksa önce kullanıcıyla teyitleşin.

> **Not:** Proje Expo SDK 57 üzerine kuruldu — bu sürüm önceki SDK'lara göre önemli API değişiklikleri içeriyor (ör. `expo-router/unstable-native-tabs` ile native SF Symbol/Material Symbol destekli tab bar, `expo-glass-effect`). Kod yazmadan önce https://docs.expo.dev/versions/v57.0.0/ adresindeki versiyonlu dokümantasyona bakılmalı, genel bilgiye güvenilmemeli.

## Veri Modeli (uygulandı)

Supabase MCP ile canlı proje `roomly` (`vigmiiiwyliqslbwuzet`) üzerinde kuruldu. Tek ev yönetiliyor varsayımıyla tasarlandı: her `auth.users` satırı en fazla bir `household_members` satırına sahip olabilir (`user_id` unique).

```
households (id, name, invite_code, created_at)
household_members (id, household_id, user_id, name, iban, created_at)
categories (id, household_id, name, icon, sort_order, created_at)
expenses (id, household_id, category_id, title, total_amount, split_type, receipt_photo_url, created_at)
expense_line_items (id, expense_id, name, amount)
expense_splits (id, expense_id, member_id, shares, amount_owed)
expense_payments (id, expense_id, member_id, amount_paid)
expense_debts (id, expense_id, from_member_id, to_member_id, amount, is_settled)
shopping_items (id, household_id, category_id, name, added_by, is_purchased, created_at)
```

Her tabloda RLS açık, `get_my_household_id()` (security definer) helper'ı ile `household_id = get_my_household_id()` şeklinde kapsanıyor. Client-side RLS'in tek başına çözemediği (chicken-and-egg / atomiklik gereken) akışlar **security-definer RPC** olarak yazıldı:

- `create_household(household_name, my_name)` — ev + ilk üye + varsayılan 8 kategori atomik oluşturur.
- `join_household(code, my_name)` — davet koduyla eve katılır.
- `leave_household()` — üyeliği siler; son üyeyse evi de siler (boş/erişilemez ev kalmasın diye).
- `create_expense(...)` — harcama + `expense_splits` + `expense_payments` satırlarını atomik ekler (`sum(amount_owed) = sum(amount_paid) = total_amount` doğrulaması yapar), ve her ower'ın borcunu ödedikleri kişilere **orantılı olarak** dağıtıp `expense_debts`'e materialize eder (bkz. "Çoklu ödeyici" notu).
- `settle_debt(from_member_id, to_member_id)` — iki kişi arasındaki tüm ödenmemiş `expense_debts` satırlarını tek seferde `is_settled = true` yapar.

Notlar:

- `household_members.iban`: kullanıcı yalnızca kendi satırındaki `iban`'ı düzenleyebilir (RLS: `user_id = auth.uid()`), diğerlerinin IBAN'ını sadece okuyabilir. `src/lib/iban.ts`'de ISO 13616 mod-97 checksum (her ülke için geçerli) + TR'ye özel sabit uzunluk (26) kontrolü var; geçersiz IBAN kaydedilemez.
- `categories`: dinamik, kullanıcı tanımlı; hem `expenses.category_id` hem `shopping_items.category_id` aynı havuzdan referans alır. Kategori silinince bağlı kayıtlar kategorisiz kalır (varsayılan kategoriye taşınmaz — karar verildi). `icon` bir anahtar (`src/constants/category-icons.ts`'de SF Symbol/Material Symbol çiftine çözülür), `sort_order` manuel görüntülenme sırası (varsayılan set: Market, Temizlik, Su, Elektrik, Doğalgaz, İnternet, Yemek, Diğer).
- `expenses.receipt_photo_url`: henüz kullanılmıyor — Supabase Storage bucket'ı kurulmadı (bkz. "Henüz Karara Bağlanmamış").
- `expense_line_items`: şema hazır ama UI'da henüz kullanılmıyor (post-MVP).
- **Çoklu ödeyici**: bir harcamayı birden fazla kişi ödeyebilir (`expense_payments`, `sum(amount_paid) = total_amount`). `expense_splits` hâlâ "kim toplamın ne kadarını borçlu" bilgisini tutar (bölüşüm tipinden bağımsız); `create_expense` RPC'si her ower'ın borcunu, ödeyenlerin katkı oranına göre kuruş hassasiyetinde dağıtıp `expense_debts` (from → to → amount, is_settled) tablosuna yazar — kendi payını kendine borçlanma satırı oluşturulmaz. Bölüşüm hesaplama mantığı (`equal`/`shares`/`fixed`) client'ta `src/lib/expense-split.ts`'de değişmedi; küsurat ilk seçilen ödeyene yuvarlanır.
- Borç özeti (`src/lib/debt.ts`) ayrı bir tablo tutmuyor; `expense_debts`'ten runtime'da ikili net bakiye hesaplanıyor (çoklu-hop sadeleştirme yok — post-MVP).
- Harcama düzenleme/silme yetkisi: **herkes** (tek ev/güven bazlı roommate modeliyle tutarlı) — karar verildi, SCREENS.md güncellenmeli.

## Klasör Yapısı

İskelet `create-expo-app` default (SDK 57) şablonuyla kuruldu; tüm kaynak kod `src/` altında, `@/*` path alias'ı `src/*`'e işaret ediyor.

```
roomly/
  src/
    app/                     # Expo Router sayfaları (dosya bazlı routing)
      _layout.tsx            # Session/household gating (auth -> onboarding -> tabs) + providers
      index.tsx              # Harcamalar (başlangıç ekranı): liste, borç özeti, istatistikler
      list.tsx                # İhtiyaç Listesi (kategori filtresi/gruplaması dahil)
      people.tsx              # Kişiler
    components/
      auth-screen.tsx         # Email/şifre giriş-kayıt (Google girişi hazır ama kapalı, bkz. aşağı)
      onboarding-screen.tsx   # Ev oluştur / ev'e katıl
      add-expense-modal.tsx, add-shopping-item-modal.tsx, category-manager-modal.tsx
      category-picker.tsx, debt-summary-modal.tsx, expense-detail-modal.tsx, statistics-modal.tsx
      app-tabs.tsx           # Native tab bar (iOS/Android), app-tabs.web.tsx web varyantı
      themed-text.tsx / themed-view.tsx / empty-state.tsx / floating-action-button.tsx / screen-header.tsx
    constants/
      theme.ts               # Colors (light/dark: text/background/accent/onAccent/success/danger/border/...), Fonts, Spacing
    hooks/
      use-theme.ts, use-color-scheme.ts
      use-session.tsx         # SessionProvider (auth durumu, tek kaynak)
      use-household.ts, use-categories.ts, use-shopping-items.ts, use-expenses.ts  # React Query + realtime
    lib/
      i18n.ts                 # i18next kurulumu
      supabase.ts             # Supabase client (PKCE, AsyncStorage session, AppState auto-refresh)
      query-client.ts         # Paylaşılan QueryClient
      query-keys.ts           # Household-scoped query key factory
      expense-split.ts        # equal/shares/fixed bölüşüm hesaplama (kuruş cinsinden, kalan ödeyene)
      debt.ts                 # expenses+splits'ten ikili net borç hesaplama
      statistics.ts           # dönem bazlı (ay/yıl/tüm zamanlar) toplam hesaplama
      api/                    # Supabase sorguları (auth.ts, household.ts, categories.ts, shopping-items.ts, expenses.ts)
    locales/
      tr.json, en.json
    types/
      database.ts             # Supabase generate_typescript_types çıktısı (migration sonrası yeniden üretilmeli)
  supabase/                    # (henüz yok, bkz. not) — migration'lar şimdilik Supabase MCP ile uzak projeye uygulanıyor
  assets/
  README.md
  AGENTS.md
  CLAUDE.md
  FEATURES.md
  SCREENS.md
```

Not: `CLAUDE.md` migration dosyası tutulmasını istiyor; şu an migration'lar Supabase MCP (`apply_migration`) ile doğrudan uzak projeye uygulanıyor ve yerelde bir `supabase/migrations/` klasörü yok. Supabase CLI kurulup yerel migration geçmişi tutulacaksa bu bir sonraki adım.

## Çalışma Kuralları

- Türkçe konuşma, kod ve commit mesajları İngilizce olabilir (kod tabanı standardı); ama kullanıcıyla iletişim Türkçe.
- Yeni bir bağımlılık eklemeden önce gerekçesini kısaca not düş (bu dosyaya veya commit mesajına).
- Supabase şema değişiklikleri migration dosyası olarak tutulmalı (`supabase/migrations/`), doğrudan dashboard'dan elle değişiklik yapılıp unutulmamalı.
- Gerçek para transferi/ödeme entegrasyonu yapılmayacak — sadece borç kaydı (bkz. FEATURES.md "Kapsam Dışı").

## Henüz Karara Bağlanmamış

- Push notification servisi: Expo Notifications yeterli mi, yoksa ayrı bir servis mi?
- Web versiyonu olacak mı (Expo web ile aynı kod tabanından)?
- Fiş fotoğrafı depolama: Supabase Storage bucket yapısı ve boyut/format kısıtı ne olacak?

## Karara Bağlandı

- **Kimlik doğrulama**: Email + şifre + Google OAuth (ikisi de aktif, Supabase Auth). Google Cloud OAuth istemcisi ayrı bir proje (`Roomly`) altında, `src/components/auth-screen.tsx`'te `GOOGLE_AUTH_ENABLED = true` (bkz. README "Google ile giriş" kurulum adımları — yeni bir Supabase projesine taşınırsa tekrarlanmalı).
- **Harcama düzenleme/silme yetkisi**: herkes düzenleyebilir/silebilir (tek ev, güven bazlı roommate modeli).
- **Kategori silme davranışı**: bağlı kayıtlar kategorisiz kalır, otomatik başka kategoriye taşınmaz.
- **E-posta doğrulama (Supabase Auth "Confirm email")**: bu ayar dashboard'dan kontrol edilmeli — MCP araçlarıyla okunamıyor/değiştirilemiyor. Açıksa kayıt olan kullanıcı session almadan önce e-postasını onaylamalı; MVP test hızını artırmak isteniyorsa dashboard'dan kapatılabilir.
