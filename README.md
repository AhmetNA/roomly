# Roomly

Roomly, ev arkadaşlarının ortak kullandığı bir mobil uygulamadır. İki temel işi yapar:

1. **Ortak Harcamalar** — Eve alınan bir şeye kim ne kadar ödedi, kaç kişi arasında bölünecek, kim kime ne kadar borçlu bunu otomatik hesaplar (Splitwise mantığı).
2. **İhtiyaç Listesi** — "Bu alınacak", "şu bitti" gibi ev ihtiyaçlarını ortak bir listeye ekleyip, alındıkça işaretleme.

iOS ve Android'de aynı anda çalışacak şekilde (cross-platform) geliştirilecek.

## Durum

Uygulama uçtan uca çalışır durumda: Supabase backend (auth, veritabanı, RLS, realtime) bağlı; email/şifre ile giriş-kayıt, ev oluşturma/katılma, kişiler, kategori yönetimi, ihtiyaç listesi, harcama ekleme (eşit/hisse/sabit bölüşüm), borç özeti (tek dokunuşla ödeme işaretleme) ve istatistikler (ay/yıl/tüm zamanlar) çalışıyor. Açık-koyu tema ve Türkçe/İngilizce yerelleştirme her ekranda aktif. Detaylar için:

- [FEATURES.md](FEATURES.md) — özellik listesi ve kapsam
- [SCREENS.md](SCREENS.md) — ekran ekran hangi özelliklerin nerede olacağı
- [CLAUDE.md](CLAUDE.md) — bu repo üzerinde Claude Code ile çalışırken uyulacak kurallar
- [AGENTS.md](AGENTS.md) — proje yapısı, teknoloji seçimleri ve ajan/geliştirici notları

## Teknoloji

- **React Native + Expo (SDK 57)** — tek kod tabanından iOS ve Android
- **Supabase** — auth (email/şifre), Postgres veritabanı + RLS, realtime senkronizasyon (evdeki herkes anlık görsün diye) — bağlı, proje: `roomly` (`vigmiiiwyliqslbwuzet`)
- **i18next** — Türkçe/İngilizce yerelleştirme

Detay ve gerekçe için [AGENTS.md](AGENTS.md)'ye bakın.

## Geliştirme

Proje native modüller kullanıyor (native tab bar, glass effect vb.), bu yüzden **Expo Go ile çalışmaz** — bir development build (custom dev client) gerekiyor.

```bash
npm install
cp .env.example .env    # EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY doldur
npx expo run:ios        # simulator/cihazda derleyip çalıştırır
npx expo run:android    # USB bağlı cihaz/emulator'da derleyip çalıştırır
```

`.env` gitignore'da; Supabase proje URL'i ve publishable key'i [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API'den alabilirsin. EAS build'lerde bu değerler `eas.json`'daki ilgili profilin `env` alanına da eklenmeli (aksi halde derlenen uygulama Supabase'e bağlanamaz).

### Google ile giriş

Aktif (`src/components/auth-screen.tsx`'te `GOOGLE_AUTH_ENABLED = true`). Kurulum: `src/lib/api/auth.ts` (PKCE + `expo-web-browser`), Google Cloud'da "Roomly" adlı bir OAuth 2.0 Web application istemcisi (yetkili yönlendirme URI: Supabase'in callback URL'i), Supabase Dashboard → Authentication → Providers → Google'da istemci ID/secret girilip etkinleştirildi, ve Authentication → URL Configuration → Redirect URLs'e `roomly://auth-callback` eklendi. Yeni bir Supabase projesine taşınırsa bu adımların hepsi tekrarlanmalı:

1. [Google Cloud Console](https://console.cloud.google.com/)'da bir OAuth 2.0 istemcisi oluştur (Web application), yetkili yönlendirme URI'sine Supabase'in verdiği callback URL'ini ekle.
2. Supabase Dashboard → Authentication → Providers → Google: istemci ID/secret'ı gir, provider'ı etkinleştir.
3. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs'e `roomly://auth-callback` ekle.
4. `GOOGLE_AUTH_ENABLED`'ı `true` yap (zaten yapıldı).

**Önemli kısıt**: Google Cloud OAuth consent screen henüz "Testing" modunda (uygulama Google tarafından doğrulanmadı). Bu haldeyken **sadece Google Cloud Console → Audience → Test users listesine eklenen hesaplar** Google ile giriş yapabilir — başka biri denerse "access blocked" hatası alır. Ev arkadaşların da Google ile girmek isterse e-postalarını o listeye eklemen gerekiyor (en fazla 100 kullanıcı). Herkese açmak için uygulamayı "Publish" edip Google'ın doğrulama sürecinden geçirmek gerekir (post-MVP).

### E-posta doğrulama

Supabase varsayılan olarak yeni kayıtlarda e-posta onayı istiyor ("Confirm email"). MVP'de hızlı test için Dashboard → Authentication → Providers → Email'den bu ayarı kapatabilirsin; açık kalırsa kullanıcı, e-postasındaki linke tıklamadan giriş yapamaz.

Kod değiştikçe `npx expo start` ile Metro'yu ayrı başlatıp dev client'ı ona bağlı tutabilirsiniz; native bir paket (yeni `expo install` ile eklenen bir modül) eklendiğinde `run:ios`/`run:android`'i tekrar çalıştırmak gerekir.

- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run format` — Prettier

### Telefonda test etme (kablo olmadan)

USB bağlantısı olmadan telefonda denemek için [EAS Build](https://docs.expo.dev/build/introduction/) (ücretsiz plan yeterli):

```bash
npx eas-cli login              # ücretsiz Expo hesabınla giriş yap
npx eas-cli build --platform android --profile preview
```

Derleme bulutta tamamlanınca bir indirme linki/QR verir; telefonda açıp APK'yı indirip kurman yeterli (ilk seferde "bilinmeyen kaynaklardan yükleme" izni istenir). iOS için aynı akış `--platform ios` ile çalışır ama cihaza kurmak için ücretsiz Apple hesabıyla sınırlı sayıda cihaz kaydı gerekir; simulator'da test etmek için yukarıdaki `npx expo run:ios` yeterli.

## Sahipsiz kişiler ve harcama ekleri

- Kişiler → **Eve kişi ekle** ile hesabı olmayan bir kişi eklenebilir; harcama, bölüşüm ve ödeme seçimlerinde hemen görünür.
- Eve davet koduyla katılan kullanıcı **Kişileri göster** ile henüz sahiplenilmemiş kişilerden birini seçer veya yeni kişi olarak katılır. Sahiplenme aynı üye kimliğini korur; geçmiş kayıtlar taşınmadan hesaba bağlanır.
- Harcama formundaki kapalı başlayan **İçerik ve fiş** alanı, her satıra bir içerik (en fazla 50 satır, satır başına 200 karakter) ve isteğe bağlı tek fotoğraf kabul eder. İçerik listesi açıklamadır; toplam tutarı veya bölüşümü değiştirmez.
- Fişler özel `receipts` bucket'ında, ev/hesap/benzersiz dosya yolunda, en fazla 5 MB olarak saklanır. Evin üyeleri süreli imzalı URL ile görüntüler. Başarısız harcama kaydının yüklemesi, bağlı kayıt yoksa temizlenir. Silinen harcamaların eski fişleri için periyodik Storage temizliği henüz yoktur.
- Üye evden ayrıldığında hesap bağlantısı ve IBAN temizlenir; kişi ve finansal geçmiş korunur. Son hesap da ayrılsa ev silinmez; mevcut davet koduyla yeniden katılınabilir.
- `expo-image-picker`, cihazın ücretsiz yerel kamera/galeri seçicisi için eklendi. Yeni native modül ve izin açıklamaları nedeniyle geliştirme istemcisi yeniden derlenmelidir (`npx expo run:ios` / `npx expo run:android`).
- Şema değişiklikleri `supabase/migrations/` altında, Edge Function kaynakları `supabase/functions/<slug>/` altında tutulur (`notify` fonksiyonunun kaynağı deploy edilmiş sürümden indirildi). Önceki uzak migration geçmişi bu repoda henüz baseline olarak bulunmuyor ve `supabase/` klasörünün tamamı henüz git'e eklenmedi; bu klasör boş veritabanı kurulumu için tek başına yeterli değildir (bkz. AGENTS.md "Bilinen boşluklar").
- `supabase/tests/household_and_expense_details.sql` rollback ile çalışan entegrasyon kontrolüdür; test kullanıcıları ve kayıtları kalıcı olmaz.
- Supabase güvenlik danışmanındaki authenticated SECURITY DEFINER uyarıları, uygulamanın kontrollü RPC girişleri için beklenir; yeni RPC'ler oturumu ve ev kapsamını denetler. [Danışman açıklaması](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

### Android bildirim kurulumu

Roomly'nin Google giriş projesi `roomly-507715` (Google Cloud), Android paket kimliği `com.anonymous.roomly`, EAS proje kimliği `4287ec94-5a1f-430a-a130-07279e1a1dab`.

Android push için ayrı `roomly-notifications` Firebase projesi kullanılır: Spark ($0/ay), faturalandırma hesabı olmadan. FCM V1 etkin; Android uygulamasının `google-services.json` dosyası `expo.android.googleServicesFile` üzerinden APK'ya bağlanır. Google giriş projesi bundan bağımsızdır. FCM V1 servis hesabı EAS'e yüklenmelidir. Bu proje Blaze planına yükseltilmemeli ve faturalandırma hesabına bağlanmamalıdır. Servis hesabının özel anahtarı APK'ya veya repoya konulmaz. Yapılandırma eklenince APK yeniden derlenip mevcut EAS imzasıyla imzalanmalıdır. [Expo FCM kurulum dokümanı](https://docs.expo.dev/push-notifications/fcm-credentials/).

Cihaz kaydı yalnızca eve katıldıktan sonra yapılır. Başarısız kayıt, uygulama yeniden aktif olduğunda denenir. `push_tokens` tablosunda yalnızca kendi token'ını okuma politikası, tekrar kayıt/UPSERT işleminin çalışması için gereklidir; diğer kullanıcıların token'ları görünmez. Entegrasyon kontrolü: `supabase/tests/push_token_refresh.sql`.

#### Kurulum adımları

**1. FCM V1 servis hesabı anahtarını EAS'e yükle.** Bu anahtar Expo'nun sunucusunda durur ve gönderim anında okunur — APK'ya girmez, dolayısıyla adım 2'yi beklemesi gerekmez, ikisi paralel yürütülebilir.

- Firebase Console → `roomly-notifications` → ⚙️ Project settings → **Service accounts** → **Generate new private key** → inen JSON'ı repo dışında tut (`.gitignore` `*-firebase-adminsdk-*.json` ve `service-account*.json` desenlerini kapsar, yine de repoya kopyalama).
- expo.dev → `ahmetna/roomly` → **Credentials** → **Android** → `com.anonymous.roomly` → **FCM V1 service account key** → JSON'ı yükle.

**2. APK'yı yeniden derle.** Gerekçe FCM değil: `google-services.json` build sırasında binary'ye gömülür, dosya eklendikten sonra derlenmiş bir APK gerekir.

```bash
npx eas-cli build --platform android --profile preview
```

**3. Telefonda bildirim iznini ver.** Uygulama izni ancak eve katıldıktan sonra ister; izin verilince cihaz token'ı `push_tokens`'a otomatik yazılır.

**4. Harcama/liste/borç değişikliği yaparak test et.**

#### Teşhis: `{sent: 0}` tek başına hiçbir şey kanıtlamaz

`notify` fonksiyonu Expo'dan dönen bilet hatalarını yutuyor (yalnızca `status === 'ok'` sayılıyor, `DeviceNotRegistered` dışındakiler atlanıyor). Bu yüzden "FCM anahtarı yüklenmemiş" (`MismatchSenderId`), "hiç token kaydolmamış" ve "ev arkadaşı yok" durumlarının üçü de aynı `{sent: 0}` yanıtını verir. Bildirim gelmediğinde hangisi olduğunu görmek için fonksiyon loglarını oku:

```bash
npx supabase@latest functions logs notify --project-ref vigmiiiwyliqslbwuzet
```

Komut CLI sürümünde yoksa Supabase Dashboard → Edge Functions → `notify` → Logs aynı bilgiyi verir.
