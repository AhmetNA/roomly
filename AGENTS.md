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
expenses (id, household_id, category_id, title, total_amount, currency_code, split_type, receipt_photo_url, created_at)
expense_line_items (id, expense_id, name, amount)
expense_splits (id, expense_id, member_id, shares, amount_owed)
expense_payments (id, expense_id, member_id, amount_paid)
expense_debts (id, expense_id, from_member_id, to_member_id, amount, is_settled)
shopping_items (id, household_id, category_id, name, added_by, list_owner_user_id, is_purchased, created_at)
```

`shopping_items.list_owner_user_id` nullable kullanıcı sahipliğidir: `null` Ortak listeyi, bir `auth.users.id` değeri görünür kişisel listeyi ifade eder. Kişisel listeler gizli değildir; aynı evdeki herkes okuyup yönetebilir. Kullanıcı eklerken yalnızca Ortak veya kendi hesabını seçebilir; sahiplik sonradan değiştirilemez. `added_by` ürünü ekleyen üyeyi ayrı olarak tutmaya devam eder.

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
- Borç özeti (`src/lib/debt.ts`) household genelinde **sadeleştirilmiş** transferler üretiyor: `expense_debts` (ödenmemiş satırlar) eksi `settlements` tablosundan her üyenin net pozisyonu kuruş cinsinden çıkarılıp, en büyük borçludan en büyük alacaklıya greedy eşleştirmeyle en fazla n−1 transfere indirgeniyor (`computeSimplifiedTransfers`). Bunun bedeli: bir transfer artık tek bir harcamaya izlenemez (borç kırılımı — `computeDebtBreakdown` — kaldırıldı). "Ödendi" işaretleme artık `settle_debt` (silindi) yerine `record_settlement(from, to, amount)` RPC'siyle `settlements` tablosuna satır yazıyor; `amount` değer olduğu için kısmi ödeme de kaydedilebilir (UI'da yok). `settlements` realtime `use-settlements.ts`'de dinleniyor. Eski `expense_debts.is_settled = true` satırları net hesabından hâlâ dışlanıyor (çift sayım olmasın diye); yeni akış bu kolonu yazmıyor, yani harcama listesindeki "ödendi" rozeti (`isExpenseFullySettled`) ve `expense_already_settled` düzenleme kilidi yalnızca eski veriyi yansıtıyor.
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
  supabase/
    migrations/              # şema değişiklikleri (baseline yok, bkz. "Bilinen boşluklar")
    functions/notify/        # push bildirimi Edge Function'ı (deploy edilmiş sürümün kaynağı)
    tests/                   # rollback ile çalışan entegrasyon kontrolleri
  assets/
  README.md
  AGENTS.md
  CLAUDE.md
  FEATURES.md
  SCREENS.md
```

Not: `supabase/` klasörü artık yerelde mevcut (migration'lar, `notify` fonksiyonunun kaynağı ve testler). Ancak klasörün tamamı henüz git'e eklenmedi ve şema baseline'ı yok — ayrıntı için "Bilinen boşluklar".

## Çalışma Kuralları

- Türkçe konuşma, kod ve commit mesajları İngilizce olabilir (kod tabanı standardı); ama kullanıcıyla iletişim Türkçe.
- Yeni bir bağımlılık eklemeden önce gerekçesini kısaca not düş (bu dosyaya veya commit mesajına).
- Supabase şema değişiklikleri migration dosyası olarak tutulmalı (`supabase/migrations/`), doğrudan dashboard'dan elle değişiklik yapılıp unutulmamalı.
- Gerçek para transferi/ödeme entegrasyonu yapılmayacak — sadece borç kaydı (bkz. FEATURES.md "Kapsam Dışı").

## Henüz Karara Bağlanmamış

- Web versiyonu olacak mı (Expo web ile aynı kod tabanından)?
- Fiş fotoğrafı depolama: Supabase Storage bucket yapısı ve boyut/format kısıtı ne olacak?

## Karara Bağlandı

- **Kimlik doğrulama**: Email + şifre + Google OAuth (ikisi de aktif, Supabase Auth). Google Cloud OAuth istemcisi ayrı bir proje (`Roomly`) altında, `src/components/auth-screen.tsx`'te `GOOGLE_AUTH_ENABLED = true` (bkz. README "Google ile giriş" kurulum adımları — yeni bir Supabase projesine taşınırsa tekrarlanmalı).
- **Harcama düzenleme/silme yetkisi**: herkes düzenleyebilir/silebilir (tek ev, güven bazlı roommate modeli).
- **Kategori silme davranışı**: bağlı kayıtlar kategorisiz kalır, otomatik başka kategoriye taşınmaz.
- **Push notification**: Expo Notifications yeterli, ayrı servis alınmadı. Gönderim `notify` Edge Function'ı üzerinden `https://exp.host/--/api/v2/push/send`'e yapılır; Android için ayrı `roomly-notifications` Firebase projesinin FCM V1 servis hesabı EAS'e yüklenir (kurulum adımları README "Android bildirim kurulumu").
- **Görev uyarısı e-postası**: `notify` fonksiyonundaki `task_nudge`, push'a ek olarak Gmail SMTP (465, nodemailer) ile mail atar. Alan adı gerektirmediği için Resend yerine seçildi. `GMAIL_USER` ve `GMAIL_APP_PASSWORD` (Google uygulama şifresi) Supabase secret'ı olarak tanımlı değilse yalnızca push gider. Görev başına saatte bir uyarı sınırı `task_nudges` tablosunda tutulur (yalnızca servis rolü erişir).
- **Görev son tarih hatırlatmaları**: `pg_cron` saat başı `task-reminders` Edge Function'ını çağırır (`x-cron-secret` başlığı Vault'taki `task_reminders_cron` sırrından okunur; fonksiyon `verify_jwt` kapalı ama sırrı `verify_task_reminders_secret` RPC'si ile doğrular). `due_date` saatsiz olduğu için son an gün sonu kabul edilir: bir gün önce 18:00'de push + e-posta, son gün 18:00'de (6 saat kala) push gider; yalnızca atanan kişilere. Ev saat dilimi şimdilik sabit `Europe/Istanbul`. Her hatırlatma `task_reminders` tablosuyla bir kez gönderilir; tarih değişirse yeniden kurulur.
- **Kira günü hatırlatması**: aynı `task-reminders` fonksiyonu, `households.rent_day` gününde (kısa aylarda ayın son günü) saat 10:00'da evdeki her hesaplı üyeye push gönderir; mesaj, borç özeti ekranıyla aynı sadeleştirilmiş borç hesabıyla (`src/lib/debt.ts` ile fonksiyondaki `simplifyDebts` birlikte değiştirilmeli) kime ne ödeyeceğini ve kimden ne alacağını içerir. `rent_reminders` tablosu ev başına ayda bir gönderimi garanti eder. Cihazda yerel kira bildirimi kurulmaz.
- **E-posta doğrulama (Supabase Auth "Confirm email")**: bu ayar dashboard'dan kontrol edilmeli — MCP araçlarıyla okunamıyor/değiştirilemiyor. Açıksa kayıt olan kullanıcı session almadan önce e-postasını onaylamalı; MVP test hızını artırmak isteniyorsa dashboard'dan kapatılabilir.

## 2026-09-09 güncellemesi: kişiler ve harcama ekleri

Yukarıdaki eski yapı notlarının yerine şu sözleşmeler geçerlidir:
- `household_members.user_id` nullable: `null` sahipsiz kişidir. Sahiplenme `join_household_with_member` RPC'siyle aynı üye satırına hesap bağlar. `preview_household_members` geçerli davet koduyla yalnızca sahipsiz ad/kimlikleri döndürür. `add_unclaimed_member` yalnızca mevcut eve ekler.
- `leave_household` kişiyi silmez; hesap/IBAN bağlantısını temizleyip finansal geçmişi korur. Son üye ayrıldığında da ev korunur.
- `expense_line_items` artık UI'da kullanılıyor; `amount` nullable, `sort_order` sıralamadır. Şimdilik içerikler açıklama satırlarıdır, toplam tutar hesabına katılmaz.
- `create_expense_with_details` mevcut harcama RPC'sini çağırır ve içerik satırları/fiş yolunu aynı transaction içinde kaydeder.
- `expenses.receipt_photo_url` public URL değil, özel `receipts` Storage bucket'ındaki yoldur. Bucket 5 MB ve JPEG/PNG/WebP sınırıyla yalnızca ev üyelerine okunabilir. Kamera/galeri için `expo-image-picker` eklendi.
- Yeni migration dosyaları `supabase/migrations/` altında tutulur; eski uzak geçmiş henüz baseline edilmedi.

## Bilinen boşluklar

2026-09-09 itibarıyla doğrulandı; bir sonraki temizlik turunda kapatılmalı:

- **`supabase/` klasörü git'e eklenmemiş.** `git ls-files supabase` boş dönüyor: migration'lar, `functions/notify/index.ts` ve testler takip edilmiyor. Yani repoyu klonlayan (veya bir ajan) bu dosyaları göremez.
- **Şema baseline'ı yok.** Mevcut migration'ların hiçbiri `create table` içermiyor; `push_tokens` dahil tüm tablolar uzak projede elle/MCP ile oluşturulmuş. Şema repodan sıfır veritabanına yeniden üretilemez. Bu, CLAUDE.md'deki "elle dashboard değişikliği yapma" kuralıyla çelişiyor.
- **`notify` fonksiyonu yalnızca deploy edilmişti.** Kaynağı `npx supabase@latest functions download notify` ile indirilip `supabase/functions/notify/index.ts` altına alındı; dosya sunucudaki ACTIVE sürümle birebir aynı, yeniden deploy edilmedi.
- **`notify` Expo bilet hatalarını yutuyor.** Fonksiyon yalnızca `status === 'ok'` sayıyor ve `DeviceNotRegistered` dışındaki hataları (ör. FCM kimlik bilgisi eksikse gelen `MismatchSenderId`) sessizce atlıyor. Sonuç her durumda `{sent: 0}` olduğu için "FCM anahtarı yüklenmemiş", "hiç token kaydolmamış" ve "ev arkadaşı yok" durumları dışarıdan ayırt edilemiyor — teşhis için fonksiyon logları okunmalı (bkz. README "Android bildirim kurulumu").

## 2026-10-12 güncellemesi: paylaşımlı görevler

- Sekme sırası: Harcamalar → Liste → Görevler → Kişiler. `src/app/tasks.tsx` yeni görev ekranıdır.
- `tasks`: başlık, açıklama, status (`todo`/`in_progress`/`done`), priority (`low`/`normal`/`high`), nullable `due_date` (yerel takvim günü), ekleyen/tamamlayan üye ve zaman damgaları.
- `task_assignees`: bir göreve birden fazla ev üyesi atanabilir; hesap bağlantısı olmayan üyeler de seçilebilir. `task_comments`: evdeki herkes okur/ekler, yalnızca yazan kendi yorumunu düzenler/siler.
- Üç tabloda household RLS ve çapraz ev ilişkilerini engelleyen bileşik foreign key vardır. Tüm ev üyeleri görevleri düzenleyip silebilir. Ekleyen kişi sabittir, tamamlayan kişi/zaman sunucuda hesaplanır.
- `save_task` SECURITY INVOKER RPC'si görev ve sorumlu değişikliklerini atomik kaydeder. Üç tablo Realtime yayınına eklenmiştir.
- Migration: `supabase/migrations/20261012084612_household_tasks.sql`; rollback ile entegrasyon testi: `supabase/tests/household_tasks.sql`.
