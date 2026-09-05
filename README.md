# Roomly

Roomly, ev arkadaşlarının ortak kullandığı bir mobil uygulamadır. İki temel işi yapar:

1. **Ortak Harcamalar** — Eve alınan bir şeye kim ne kadar ödedi, kaç kişi arasında bölünecek, kim kime ne kadar borçlu bunu otomatik hesaplar (Splitwise mantığı).
2. **İhtiyaç Listesi** — "Bu alınacak", "şu bitti" gibi ev ihtiyaçlarını ortak bir listeye ekleyip, alındıkça işaretleme.

iOS ve Android'de aynı anda çalışacak şekilde (cross-platform) geliştirilecek.

## Durum

Proje henüz planlama aşamasında. Detaylar için:

- [FEATURES.md](FEATURES.md) — özellik listesi ve kapsam
- [CLAUDE.md](CLAUDE.md) — bu repo üzerinde Claude Code ile çalışırken uyulacak kurallar
- [AGENTS.md](AGENTS.md) — proje yapısı, teknoloji seçimleri ve ajan/geliştirici notları

## Teknoloji (öneri)

- **React Native + Expo** — tek kod tabanından iOS ve Android
- **Supabase** — auth, Postgres veritabanı, realtime senkronizasyon (evdeki herkes anlık görsün diye)

Bu seçim henüz kesinleşmedi; alternatifler ve gerekçe için AGENTS.md'ye bakın.

## Geliştirme

```bash
npm install
npx expo start
```

(Proje iskeleti henüz oluşturulmadı.)
