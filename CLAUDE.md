# CLAUDE.md

Bu dosya, Claude Code'un bu repoda nasıl çalışması gerektiğini tanımlar. Genel proje yapısı için [AGENTS.md](AGENTS.md), özellik kapsamı için [FEATURES.md](FEATURES.md).

## Genel Yaklaşım

- Kullanıcı ile Türkçe iletişim kur, kod/commit/dosya isimleri İngilizce olsun.
- Bu bir MVP: FEATURES.md'deki "MVP Sırası" bölümünü takip et, kapsamı büyütme (feature creep'ten kaçın).
- Cross-platform hedef: iOS ve Android'de test edilmeden bir özellik "bitti" sayılmaz. Simulator/emulator ile görsel doğrulama yap.
- Supabase kullanılıyor: RLS (Row Level Security) politikaları olmadan hiçbir tabloyu prod'a açma — her tablo sadece kendi evinin (household) verisini görmeli.

## Kod Stili

- TypeScript strict mode.
- Gereksiz soyutlama yok — MVP aşamasında basit, doğrudan kod tercih et.
- Yorum satırı yalnızca WHY açıklaması gerektiğinde (ör. bir Supabase/Expo kısıtlaması yüzünden alışılmadık bir çözüm).

## Test / Doğrulama

- Yeni bir ekran veya akış eklendiğinde iOS simulator'da (mcp Claude_Code_iOS_Simulator araçlarıyla) gözle doğrula.
- Android tarafı için gerekirse kullanıcıdan emulator/cihaz üzerinde teyit iste (bu ortamda Android emulator kontrolü yok).
- Supabase şema değişikliklerinde migration dosyası oluştur, elle dashboard değişikliği yapma.

## Dikkat Edilecekler

- Gerçek para transferi/ödeme entegrasyonu YOK — sadece borç/kayıt takibi. Bu sınırı aşan bir istek gelirse kullanıcıya hatırlat.
- Realtime senkronizasyon önemli: bir ev arkadaşı harcama veya liste öğesi eklediğinde diğerlerinin ekranı otomatik güncellenmeli (Supabase Realtime subscriptions).
- Borç basitleştirme (debt simplification) algoritması MVP sonrası — önce basit "kim kime ne kadar borçlu" hesaplaması yeterli.

## Henüz Netleşmemiş Kararlar

AGENTS.md'deki "Henüz Karara Bağlanmamış" bölümüne bak. Bu konularda büyük bir yönde ilerlemeden önce kullanıcıya sor.
