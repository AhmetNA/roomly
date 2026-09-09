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
- Her ekran AGENTS.md'deki klasör yapısına göre `src/app/` altında Expo Router konvansiyonuyla yer alır; ekrana özel olmayan paylaşılan bileşenler `src/components/`'a çıkarılır.
- Supabase sorguları doğrudan bileşen içine yazılmaz; `lib/api/` altında fonksiyon olarak tanımlanıp React Query hook'larıyla (`hooks/`) sarmalanır.
- Formatlama ve lint: Prettier + ESLint (Expo/React Native default config) — commit öncesi `npm run lint` temiz olmalı.
- Import sırası: 1) harici paketler, 2) `lib`/`hooks`/`types` gibi proje içi mutlak importlar, 3) göreli importlar; aralarında boş satır.
- Renk, spacing gibi tekrar eden değerler dosyaya gömülmez, `src/constants/theme.ts` gibi tek bir yerden paylaşılır.
- **Hardcoded renk YOK**: bileşen içine doğrudan hex/rgb yazılmaz, her zaman tema token'ı üzerinden kullanılır (bkz. "Tema" bölümü).
- **Hardcoded kullanıcıya görünen metin YOK**: bileşen içine doğrudan Türkçe/İngilizce string yazılmaz, her zaman çeviri anahtarı üzerinden kullanılır (bkz. "Yerelleştirme" bölümü). Kod içi log/yorum bu kurala tabi değil.

## Tema (Dark / Light Mode)

- Uygulama hem açık hem koyu temayı destekler; cihazın sistem temasını (`useColorScheme`) takip eder, MVP'de manuel tema seçici gerekmez (ileride Kişiler/Ayarlar'a eklenebilir).
- Renkler `src/constants/theme.ts` altında `light` ve `dark` iki palet (`Colors`) olarak tanımlanır; bileşenler `useTheme()` hook'u üzerinden erişir (bkz. `src/hooks/use-theme.ts`).
- Yeni bir bileşen/ekran yazarken her iki temada da simulator'da görsel doğrulama yapılır (bkz. "Test / Doğrulama").
- Statik ikon/görsel eklerken de iki temada okunabilirliği kontrol et (gerekirse tema bazlı varyant).

## Yerelleştirme (i18n)

- Kullanıcıya görünen tüm metinler çeviri dosyalarından gelir, kod içine gömülmez (`t('expenses.addButton')` gibi).
- `i18next` + `react-i18next` (Expo ile uyumlu, ücretsiz) kullanılması öneriliyor; alternatif çıkarsa önce kullanıcıyla teyitleşin.
- Çeviri dosyaları dile göre ayrılır (`src/locales/tr.json`, `src/locales/en.json`), kurulum `src/lib/i18n.ts`'de; MVP'de varsayılan dil Türkçe, İngilizce altyapısı en baştan kurulur ama tüm metinlerin çevrilmesi MVP'yi bloklamaz.
- Yeni bir metin eklerken önce ilgili çeviri dosyasına anahtar eklenir, sonra kodda o anahtar kullanılır — asla önce hardcoded yazıp sonra çevirmeyi "sonra yaparız" deme.
- Tarih/sayı/para birimi formatlama da dile duyarlı olmalı (örn. `Intl` API veya kütüphanenin formatlama yardımcıları), elle string birleştirme yapılmaz.

## Test / Doğrulama

- Yeni bir ekran veya akış eklendiğinde iOS simulator'da (mcp Claude_Code_iOS_Simulator araçlarıyla) gözle doğrula — hem açık hem koyu temada.
- Android tarafı için gerekirse kullanıcıdan emulator/cihaz üzerinde teyit iste (bu ortamda Android emulator kontrolü yok).
- Supabase şema değişikliklerinde migration dosyası oluştur, elle dashboard değişikliği yapma.
- Aynı kural Edge Function'lar için: fonksiyon kaynağı `supabase/functions/<slug>/index.ts` altında repoda durur, yalnızca deploy edilmiş halde bırakılmaz. Uzakta olup repoda olmayan bir fonksiyon varsa önce indir (`npx supabase@latest functions download <slug> --project-ref vigmiiiwyliqslbwuzet`), sonra üzerinde çalış.
- `supabase/` klasörünün tamamı (`migrations/`, `functions/`, `tests/`) git'e commit'lenmeli. Bu klasör şu an takip edilmiyor ve hiçbir migration `create table` içermiyor — yani şema repodan yeniden üretilemez durumda (bkz. AGENTS.md "Bilinen boşluklar").
- Servis hesabı özel anahtarları (Firebase/FCM) repoya konulmaz; `.gitignore` `*-firebase-adminsdk-*.json` ve `service-account*.json` desenlerini kapsar.

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
