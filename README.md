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
