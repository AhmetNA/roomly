# Roomly — App Store (iOS) yayın planı

17 Kasım 2026. Android hazırlığı: [android-launch-status.md](android-launch-status.md). Bu plan Android için yapılan işi (hesap silme, UGC bildirme/engelleme, inceleme hesabı, gizlilik/destek sayfaları, veri güvenliği incelemesi) yeniden kullanır.

İşaretler: **[Ahmet]** yalnız senin yapabileceğin, **[Claude]** benim yapacağım, **[Karar]** başlamadan senin onayın gereken.

## Mevcut durum (kodda doğrulandı)

- Expo SDK 57; `ios/` klasörü gitignore'da. EAS her build'de `app.json`'dan yeniden üretir, bu yüzden tüm iOS ayarları `app.json` veya config plugin'e yazılmalı.
- `TARGETED_DEVICE_FAMILY = 1`: yalnız iPhone. iPad ekran görüntüsü ve iPad incelemesi gerekmez.
- Bundle ID `com.anonymous.roomly` (Expo yer tutucusu).
- Giriş: e-posta/şifre + Google OAuth. Push bildirimleri Expo push servisi üzerinden gidiyor; iOS için yalnız APNs anahtarı gerekiyor, backend değişikliği yok.
- İzin metinleri (kamera, fotoğraf) yalnız İngilizce ve kısa.
- Seçili Xcode beta (27A5228h). App Store Connect beta Xcode ile yapılan build'leri reddeder, bu yüzden mağazaya gidecek build'ler **EAS cloud** ile alınır (ücretsiz plan: ayda yaklaşık 30 build, en fazla 15'i iOS; az build hedeflenir). EAS'in SDK 57 için hangi Xcode imajını seçtiği ilk build logunda ("Spin up build environment") kontrol edilecek; scene desteği açık olduğu için Xcode 26 veya 27 ile de çalışmalı.

## Alınan kararlar (17 Kasım 2026, Ahmet)

- Ücret: **şimdilik bekle.** Kod ve yapılandırma hazırlanır, hiçbir şey yüklenmez.
- Bundle ID: **com.ahmetaydemir.roomly**.
- 4.8: **Sign in with Apple eklenecek.** Apple girişinin capability'si, Services ID ve Supabase'e verilecek anahtar ücretli Developer hesabı ister. Bu yüzden kod yazılabilir, ancak hesap açılmadan uçtan uca test edilemez.
- iPhone **yok**: yalnız simulator testi yapılır. Gerçek push, kamera ve TestFlight kurulumu doğrulanmamış kalır. Apple girişi simulator'da kısmen denenebilir.

## İlerleme — 17 Kasım 2026 (Aşama 1)

- `app.json` iOS: bundle ID `com.ahmetaydemir.roomly`, `supportsTablet: false`, `usesAppleSignIn: true`, `usesNonExemptEncryption: false`. Android paketi değişmedi.
- İzin metinleri Türkçe/İngilizce: `src/locales/ios/{tr,en}.json` (`expo.locales`), prebuild `tr.lproj`/`en.lproj` üretiyor.
- `expo-apple-authentication` eklendi. `signInWithApple()` (`src/lib/api/auth.ts`): nonce'un SHA-256'sı Apple'a, ham hali Supabase `signInWithIdToken`'a. İlk girişte gelen ad `user_metadata.full_name`'e yazılıyor; onboarding'deki "Adın" alanı bunu önceden dolduruyor (Apple adın tekrar sorulmasını reddediyor).
- Giriş ekranında yalnız iOS'ta Apple'ın kendi butonu (açık temada siyah, koyu temada beyaz) Google'ın üstünde.
- `npm run check` geçti.
- **iOS 27 SDK / UIScene:** iOS 27 SDK ile derlenen uygulamalar UIScene yaşam döngüsü olmadan açılışta çöküyor (simulator'da doğrulandı). Bu beta Xcode'a özgü değil; Xcode 27 ile yapılan her build'i (EAS dahil) etkiler. Çözüm Expo'nun resmi yolu: `expo` 57.0.20 → 57.0.33 (SDK 57 içinde yama, `npx expo install --fix` diğer expo-* paketlerini de güncelledi) ve `expo-build-properties` → `ios.enableSceneSupport: true`. SDK 58'e geçince bu ayar kaldırılmalı. Yama güncellemesi Android native kodunu da etkiler; bir sonraki Android build'inde uygulama tekrar denenmeli.
- **Simulator (iPhone 17 Pro Max, iOS 27):** Uygulama açılıyor; giriş ekranında Apple düğmesi açık temada siyah, koyu temada beyaz ve Google düğmesiyle aynı boyda. Düğme Apple'ın kendi giriş akışını açıyor; simulator'da Apple hesabı olmadığı için iOS "Ayarlar'dan giriş yap" diyor ve kapatınca genel hata uyarısı çıkıyor (`ERR_REQUEST_UNKNOWN`). Gerçek Apple girişi, Supabase oturumu ve onboarding ad doldurma test edilemedi.
- Yerel derleme notu: klasör yolundaki "ş" Homebrew Ruby 4 / CocoaPods'u bozuyor (`pod install` encoding hatası). Yerel iOS derlemesi ASCII bir yola APFS klonuyla (`cp -cR`) yapılmalı; EAS cloud'u etkilemez.

## İlerleme — 17 Kasım 2026 (Apple girişi tamamlama)

- **Google penceresi:** iOS'un "Roomly, vigmiiiwyliqslbwuzet.supabase.co'yu giriş için kullanmak istiyor" uyarısı `preferEphemeralSession: true` ile kaldırıldı. Bedeli: Google oturumu Safari ile paylaşılmaz, kullanıcı her girişte Google hesabını seçer. Google'ın kendi onay sayfasındaki "…supabase.co'ya devam et" yazısı ise Google Cloud OAuth onay ekranının uygulama adı/markası ile ilgilidir; Supabase alan adını tamamen gizlemek ücretli Supabase custom domain gerektirir.
- **Apple hata mesajları:** iptal sessiz; cihazda Apple hesabı yoksa (`ERR_REQUEST_UNKNOWN`) genel hata yerine "Ayarlar'dan Apple hesabına giriş yap" mesajı.
- **Hesap silmede Apple token iptali (5.1.1(v)) yazıldı:** iOS'ta Apple ile giriş yapmış kullanıcı silmeyi başlatınca Apple onay ekranı yeniden açılır, taze `authorizationCode` `delete-account`'a gider; fonksiyon kodu refresh token'a çevirip hemen `/auth/revoke` çağırır, hiçbir Apple token'ı saklanmaz. İptal başarısızsa hiçbir şey silinmez (503, tekrar denenebilir). Kod: `supabase/functions/delete-account/apple.ts`, Deno testi imzalı client secret'ı ve sırayı doğruluyor.
- `delete-account` v2 canlıya yüklendi (17 Kasım 2026, `verify_jwt: false` korundu); oturumsuz istek 401, geçersiz Apple kodu 400 döndü.
- Supabase Apple sağlayıcısı **açıldı** (17 Kasım 2026, Ahmet; Client ID `com.ahmetaydemir.roomly`). `/auth/v1/settings` apple: true; sahte token ile `signInWithIdToken` isteği Apple yolunda doğrulamaya girip reddedildi.

**Hesap açılınca yapılacaklar:**
1. **[Ahmet]** Apple Developer → Identifiers → `com.ahmetaydemir.roomly` App ID'sinde "Sign in with Apple" açık olsun (EAS ilk build'de oluşturur). Keys → yeni anahtar, "Sign in with Apple" işaretli → `.p8` dosyasını `.secrets/` altına koy, Key ID ve Team ID'yi söyle.
2. ~~Supabase Apple sağlayıcısını aç~~ — tamamlandı (17 Kasım 2026).
3. **[Claude]** Edge Function secret'ları: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (.p8 içeriği), `APPLE_CLIENT_ID=com.ahmetaydemir.roomly`. Secret'lar yokken Apple kullanıcısının silme isteği `apple_revoke_unavailable` ile hiçbir şey silmeden döner.
4. TestFlight'ta gerçek Apple girişi + hesap silme uçtan uca denenmeli (iPhone gerekiyor).

## Aşama 0 — Kararlar ve Apple hesabı (en uzun bekleme burada)

1. **[Karar][Ahmet] Apple Developer Program: yıllık yaklaşık 99 USD.** App Store için ücretsiz bir yol yok (CLAUDE.md ücretli servis kuralı gereği onayın gerekiyor). Kayıt: Apple ID + iki adımlı doğrulama, Apple Developer uygulamasında kimlik doğrulama, ödeme. Onay bir iki gün sürebilir, bu yüzden hemen başlamalı. Ben bu sırada kod işlerini yaparım.
2. **[Karar] iOS bundle ID.** Android paketi Play'de kilitli, ama iOS farklı olabilir. Öneri: `com.ahmetaydemir.roomly`. İlk yüklemeden sonra değiştirilemez.
3. **[Karar] Guideline 4.8 (üçüncü taraf giriş).** Google girişi olan bir uygulama, yalnız ad ve e-posta toplayan ve e-postayı gizlemeye izin veren eşdeğer bir giriş seçeneği de sunmalı. E-posta/şifre girişinin bu şartı karşıladığı kesin değil. İki yol var:
   - (a) **Sign in with Apple ekle.** Ücretsiz; `expo-apple-authentication` + Supabase `signInWithIdToken`. Ek iş: hesap silmede Apple token'ını iptal etmek gerekiyor (sunucuda authorization code takası, ek Supabase Apple provider ayarları).
   - (b) **iOS'ta Google girişini gizle**, yalnız e-posta/şifre kalsın. Daha az iş ve CLAUDE.md'deki "gerçek platform farkı" istisnasına uyuyor.
4. **[Karar] iPhone'un var mı?** Simulator gerçek push bildirimini ve TestFlight kurulumunu doğrulayamaz. iPhone yoksa bunlar doğrulanmamış kalır.

## Aşama 1 — Kod ve yapılandırma [Claude]

- `app.json` → `ios`: yeni bundle ID, `supportsTablet: false`, `config.usesNonExemptEncryption: false` (her build'de ihracat uyumu sorusu çıkmasın), `buildNumber` remote sayaç.
- İzin metinleri Türkçe ve İngilizce (`locales` + `ios.infoPlist`), fiş fotoğrafı amacını net anlatacak şekilde.
- Seçilen 4.8 yolu: (a) Apple girişi + hesap silmede token iptali, ya da (b) Google düğmesinin iOS'ta gizlenmesi. Metinler çeviri dosyalarına eklenir.
- Gizlilik bildirimi (`PrivacyInfo.xcprivacy`): AsyncStorage UserDefaults kullanıyor (gerekçe isteyen API). Expo'nun birleştirilmiş manifestini prebuild çıktısında kontrol edip eksik varsa `ios.privacyManifests` ile tamamlamak.
- `eas.json`: production iOS profili ve `submit.production.ios` (ascAppId, appleTeamId).
- `npm run check` temiz olmalı.

## Aşama 2 — Simulator doğrulaması [Claude]

- Yerel debug build (beta Xcode yalnız simulator testi için yeterli), iOS simulator'da açık ve koyu temada: giriş, onboarding, harcamalar, liste, görevler, istatistik, fiş fotoğrafı, hesap silme, bildirme/engelleme.
- Demo evinden 6.9" iPhone ekran görüntüleri (App Store'un zorunlu boyutu, 1320×2868).

## Aşama 3 — Apple tarafı kimlik bilgileri [Ahmet, ardından Claude]

1. **[Ahmet]** Kendi terminalinde ilk kez `npx eas-cli build -p ios --profile production` çalıştır. Apple ID girişi ve 2FA kodunu sen girersin. EAS dağıtım sertifikasını, provisioning profile'ı ve APNs push anahtarını kendisi oluşturur. Şifre ya da kodu bana yazma.
2. **[Ahmet]** App Store Connect → Kullanıcılar ve Erişim → Entegrasyonlar → **App Store Connect API anahtarı** oluştur (rol: App Manager). `.p8` dosyasını `.secrets/` altına koy, Key ID ve Issuer ID'yi söyle. Bundan sonra build ve `eas submit` işlerini ben yaparım.
3. **[Ahmet]** App Store Connect'te uygulama kaydı oluştur (ad Roomly, birincil dil Türkçe, seçilen bundle ID, SKU `roomly-ios`). İstersen bu formu tarayıcıda ben doldururum, giriş senden.

## Aşama 4 — Mağaza kaydı [Claude hazırlar, Ahmet onaylar]

- Türkçe metin Apple limitlerine uyarlanır: ad 30, alt başlık 30, anahtar kelimeler 100 karakter, açıklama, tanıtım metni. Kaynak: [play-store-listing-tr.md](play-store-listing-tr.md).
- Destek URL'si (zorunlu) ve gizlilik URL'si: mevcut GitHub Pages sayfaları. Gizlilik/koşul sayfalarına iOS, Apple (APNs, varsa Apple ile giriş) eklenir, site yeniden yayımlanır.
- **App Privacy etiketleri:** [data-safety-audit.md](data-safety-audit.md) eşlenir (e-posta, ad, kullanıcı içeriği/fotoğraf, finans kaydı, cihaz kimliği, teşhis; izleme yok, reklam yok).
- Yaş derecelendirme anketi, kategori Finans veya Verimlilik, fiyat ücretsiz.
- **Erişilebilirlik:** yalnız Türkiye önerilir. AB'de dağıtım DSA "trader" beyanını tetikler ve adres/telefonun mağazada yayımlanmasını gerektirebilir.
- App Review notları: mevcut inceleme hesabı (`.secrets/`), kurgusal demo ev, UGC bildirme/engelleme ve hesap silmenin yeri, "gerçek para transferi yok, yalnız kayıt" açıklaması.

## Aşama 5 — TestFlight ve gönderim

1. **[Claude]** EAS cloud production build → `eas submit` ile App Store Connect'e yükleme.
2. **[Ahmet]** TestFlight ile iPhone'una kur, bildirim izni + gerçek push + fiş fotoğrafını dene. Play'deki 12 test kullanıcısı / 14 gün şartı Apple'da yok; dahili test anında açılır.
3. **[Claude]** Kayıt eksiksizse incelemeye gönder butonundan hemen önce sana özet sunarım. **[Ahmet]** "Gönder" onayı.
4. İnceleme genelde 1–3 gün. Ret gelirse gerekçeyi birlikte düzeltiriz.

## Senin özet listen

1. Ücreti onayla, Apple Developer Program'a kaydol (hemen).
2. Bundle ID, 4.8 yolu ve iPhone sorusunu cevapla.
3. İlk `eas build -p ios` girişini kendi terminalinde yap (Apple ID + 2FA).
4. App Store Connect API anahtarını oluşturup `.secrets/` altına koy.
5. Uygulama kaydını oluştur (ya da bana tarayıcıda yaptır).
6. TestFlight'ta iPhone'da dene, son "İncelemeye gönder" onayını ver.
