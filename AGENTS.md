# AGENTS.md

Bu dosya, bu repoda çalışan herhangi bir AI ajanı (Claude Code dahil) için proje yapısı ve teknik yönlendirme içerir.

## Proje Özeti

Roomly, ev arkadaşları için iki modüllü bir mobil uygulama: ortak harcama/borç takibi ve paylaşımlı ihtiyaç listesi. Detaylı özellik listesi için [FEATURES.md](FEATURES.md).

## Teknoloji Seçimleri

| Katman | Seçim | Gerekçe |
|---|---|---|
| Mobil framework | React Native + Expo | Tek kod tabanından iOS + Android, hızlı iterasyon, EAS ile kolay build/dağıtım |
| Backend / DB | Supabase (Postgres + Auth + Realtime) | Kendi backend'imizi yazmadan auth, veritabanı ve realtime senkronizasyon; ev arkadaşları arasında anlık güncelleme gerektiği için Realtime önemli |
| State management | React Query (TanStack Query) + Zustand (gerekirse) | Sunucu verisi için React Query, basit local UI state için Zustand |
| Navigasyon | Expo Router | Dosya tabanlı routing, Expo ile native entegrasyon |
| Stil | NativeWind (Tailwind for RN) veya sade StyleSheet | Henüz kesinleşmedi |

Bu seçimler ilk kuruluşta değiştirilebilir; büyük bir teknoloji değişikliği yapılacaksa önce kullanıcıyla teyitleşin.

## Veri Modeli (taslak)

Not: Tek ev yönetiliyor varsayımıyla tasarlandı — çoklu ev/kullanıcı-ev ilişkisi yok (bkz. FEATURES.md "Ev / Grup Yönetimi"). Yine de `household_id` alanları RLS ve gelecekte olası genişleme için tutuluyor.

```
households (id, name, invite_code, created_at)
household_members (household_id, user_id, iban, joined_at)
categories (id, household_id, name, created_by, created_at)
expenses (id, household_id, paid_by, description, amount, category_id, split_type, receipt_photo_url, created_at)
expense_line_items (id, expense_id, name, amount)
expense_splits (expense_id, user_id, shares, amount_owed, is_settled)
shopping_items (id, household_id, name, category_id, added_by, is_purchased, created_at, purchased_at)
```

- `household_members.iban`: kullanıcı yalnızca kendi satırındaki `iban`'ı düzenleyebilir (RLS: `user_id = auth.uid()`), diğerlerinin IBAN'ını sadece okuyabilir.
- `categories`: dinamik, kullanıcı tanımlı; hem `expenses.category_id` hem `shopping_items.category_id` aynı havuzdan referans alır.
- `expenses.receipt_photo_url`: Supabase Storage'a yüklenen fiş fotoğrafının yolu (opsiyonel).
- `expense_line_items`: bir harcamanın altındaki kalem kalem liste (opsiyonel; girilmezse harcama tek kalem gibi davranır).
- `expense_splits.split_type` harcama seviyesinde: `equal` | `shares` | `fixed`.
  - `equal`: `shares` kullanılmaz, tutar kişi sayısına bölünür.
  - `shares`: `shares` alanına pay sayısı yazılır (örn. 4, 3, 2), `amount_owed` bu paylara göre hesaplanıp saklanır. Yüzdelik giriş yok.
  - `fixed`: `amount_owed` doğrudan girilen sabit tutar, `shares` kullanılmaz.
- `expense_splits.is_settled`: borcun ödendi olarak işaretlenip işaretlenmediği (kolay borç kapatma, tek dokunuş).

## Klasör Yapısı (öneri, iskelet oluşturulunca netleşecek)

```
roomly/
  app/                 # Expo Router sayfaları
  components/
  lib/
    supabase.ts        # Supabase client
    api/                # veritabanı sorguları
  hooks/
  types/
  README.md
  AGENTS.md
  CLAUDE.md
  FEATURES.md
```

## Çalışma Kuralları

- Türkçe konuşma, kod ve commit mesajları İngilizce olabilir (kod tabanı standardı); ama kullanıcıyla iletişim Türkçe.
- Yeni bir bağımlılık eklemeden önce gerekçesini kısaca not düş (bu dosyaya veya commit mesajına).
- Supabase şema değişiklikleri migration dosyası olarak tutulmalı (`supabase/migrations/`), doğrudan dashboard'dan elle değişiklik yapılıp unutulmamalı.
- Gerçek para transferi/ödeme entegrasyonu yapılmayacak — sadece borç kaydı (bkz. FEATURES.md "Kapsam Dışı").

## Henüz Karara Bağlanmamış

- Kimlik doğrulama yöntemi: telefon numarası mı, email mi, davet kodu ile şifresiz giriş mi?
- Push notification servisi: Expo Notifications yeterli mi, yoksa ayrı bir servis mi?
- Web versiyonu olacak mı (Expo web ile aynı kod tabanından)?
- Fiş fotoğrafı depolama: Supabase Storage bucket yapısı ve boyut/format kısıtı ne olacak?
