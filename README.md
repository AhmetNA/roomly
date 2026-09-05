# Roomly

Roomly, ev arkadaşlarının ortak kullandığı bir mobil uygulamadır. İki temel işi yapar:

1. **Ortak Harcamalar** — Eve alınan bir şeye kim ne kadar ödedi, kaç kişi arasında bölünecek, kim kime ne kadar borçlu bunu otomatik hesaplar (Splitwise mantığı).
2. **İhtiyaç Listesi** — "Bu alınacak", "şu bitti" gibi ev ihtiyaçlarını ortak bir listeye ekleyip, alındıkça işaretleme.

iOS ve Android'de aynı anda çalışacak şekilde (cross-platform) geliştirilecek.

## Durum

İskelet kuruldu: Expo Router tabanlı 3 sekme (Harcamalar / Liste / Kişiler), açık-koyu tema desteği, Türkçe/İngilizce yerelleştirme altyapısı hazır; ekranların içeriği henüz boş durumlarla (empty state) yer tutuyor. Detaylar için:

- [FEATURES.md](FEATURES.md) — özellik listesi ve kapsam
- [SCREENS.md](SCREENS.md) — ekran ekran hangi özelliklerin nerede olacağı
- [CLAUDE.md](CLAUDE.md) — bu repo üzerinde Claude Code ile çalışırken uyulacak kurallar
- [AGENTS.md](AGENTS.md) — proje yapısı, teknoloji seçimleri ve ajan/geliştirici notları

## Teknoloji

- **React Native + Expo (SDK 57)** — tek kod tabanından iOS ve Android
- **Supabase** — auth, Postgres veritabanı, realtime senkronizasyon (evdeki herkes anlık görsün diye) — henüz entegre edilmedi
- **i18next** — Türkçe/İngilizce yerelleştirme

Detay ve gerekçe için [AGENTS.md](AGENTS.md)'ye bakın.

## Geliştirme

Proje native modüller kullanıyor (native tab bar, glass effect vb.), bu yüzden **Expo Go ile çalışmaz** — bir development build (custom dev client) gerekiyor.

```bash
npm install
npx expo run:ios       # simulator/cihazda derleyip çalıştırır
npx expo run:android   # USB bağlı cihaz/emulator'da derleyip çalıştırır
```

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
