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

```bash
npm install
npx expo start
```

- `npm run ios` / `npm run android` / `npm run web` — belirli platformda başlatır
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run format` — Prettier
