# CLAUDE.md

Bu dosya, Claude Code'un bu repoda nasıl çalışması gerektiğini tanımlar. Genel proje yapısı için [AGENTS.md](AGENTS.md), özellik kapsamı için [FEATURES.md](FEATURES.md).

## Genel Yaklaşım

- Kullanıcı ile Türkçe iletişim kur, kod/commit/dosya isimleri İngilizce olsun.
- Bu bir MVP: FEATURES.md'deki "MVP Sırası" bölümünü takip et, kapsamı büyütme (feature creep'ten kaçın).
- Cross-platform hedef: iOS ve Android'de test edilmeden bir özellik "bitti" sayılmaz. Simulator/emulator ile görsel doğrulama yap. Platform'a özel kod (`Platform.OS === 'ios'` gibi) yalnızca gerçekten gerektiğinde (native davranış farkı) yazılır, varsayılan olarak tek kod yolu her iki platformda da çalışmalı.
- Supabase kullanılıyor: RLS (Row Level Security) politikaları olmadan hiçbir tabloyu prod'a açma — her tablo sadece kendi evinin (household) verisini görmeli.

## Kod Stili

- TypeScript strict mode, `any` kullanma (gerekirse `unknown` + daraltma).
- Gereksiz soyutlama yok — MVP aşamasında basit, doğrudan kod tercih et.
- Yorum satırı yalnızca WHY açıklaması gerektiğinde (ör. bir Supabase/Expo kısıtlaması yüzünden alışılmadık bir çözüm).
- Fonksiyon bileşenleri + hook'lar; class component yok.
- Dosya/klasör adları: `kebab-case` (örn. `expense-list.tsx`), bileşen adları `PascalCase`, fonksiyon/değişken `camelCase`, sabitler `UPPER_SNAKE_CASE`.
- Her ekran AGENTS.md'deki klasör yapısına göre `app/` altında Expo Router konvansiyonuyla yer alır; ekrana özel olmayan paylaşılan bileşenler `components/`'a çıkarılır.
- Supabase sorguları doğrudan bileşen içine yazılmaz; `lib/api/` altında fonksiyon olarak tanımlanıp React Query hook'larıyla (`hooks/`) sarmalanır.
- Formatlama ve lint: Prettier + ESLint (Expo/React Native default config) — commit öncesi `npm run lint` temiz olmalı.
- Import sırası: 1) harici paketler, 2) `lib`/`hooks`/`types` gibi proje içi mutlak importlar, 3) göreli importlar; aralarında boş satır.
- Renk, spacing gibi tekrar eden değerler dosyaya gömülmez, `lib/theme.ts` gibi tek bir yerden paylaşılır (tasarım sistemi netleşince genişletilecek).

## Test / Doğrulama

- Yeni bir ekran veya akış eklendiğinde iOS simulator'da (mcp Claude_Code_iOS_Simulator araçlarıyla) gözle doğrula.
- Android tarafı için gerekirse kullanıcıdan emulator/cihaz üzerinde teyit iste (bu ortamda Android emulator kontrolü yok).
- Supabase şema değişikliklerinde migration dosyası oluştur, elle dashboard değişikliği yapma.

## Ücretsiz Kalma İlkesi

- Proje her zaman ücretsiz katmanlarla (free tier) ilerlemeye çalışır. Yeni bir servis/paket/SDK önermeden önce ücretsiz bir seçeneği olup olmadığını kontrol et.
- Supabase, Expo/EAS gibi servislerin free tier limitlerini (satır sayısı, storage, aylık build sayısı vb.) aşacak bir tasarım önerme; limit yaklaşıyorsa kullanıcıyı uyar.
- Ücretli bir servis/paket gerçekten gerekiyorsa (ücretsiz alternatif yoksa) önce kullanıcıya sor, onaysız ekleme.
- Push notification, fotoğraf depolama gibi özellikler için önce Expo/Supabase'in kendi ücretsiz araçları (Expo Notifications, Supabase Storage free tier) değerlendirilir.

## Dikkat Edilecekler

- Gerçek para transferi/ödeme entegrasyonu YOK — sadece borç/kayıt takibi. Bu sınırı aşan bir istek gelirse kullanıcıya hatırlat.
- Realtime senkronizasyon önemli: bir ev arkadaşı harcama veya liste öğesi eklediğinde diğerlerinin ekranı otomatik güncellenmeli (Supabase Realtime subscriptions).
- Borç basitleştirme (debt simplification) algoritması MVP sonrası — önce basit "kim kime ne kadar borçlu" hesaplaması yeterli.

## Henüz Netleşmemiş Kararlar

AGENTS.md'deki "Henüz Karara Bağlanmamış" bölümüne bak. Bu konularda büyük bir yönde ilerlemeden önce kullanıcıya sor.
