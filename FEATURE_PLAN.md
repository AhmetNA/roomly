# Roomly: Kişisel harcama dökümü ve bireysel alışveriş listesi

Tarih: 2026-09-13

## Durum ve amaç

Bu belge uygulama yapacak ajan için hazırlanmış plandır. Henüz bu özellikler için kod veya veritabanı değişikliği yapılmadı. Kullanıcı mevcut borç sadeleştirmesinin altında parasının hangi harcamalara gittiğini görebileceği bir alan ve alışveriş listesinde ortak/bireysel kullanım istedi.

Çalışmaya başlamadan repodaki güncel `AGENTS.md` ve ilgili talimatları oku. Aşağıdaki dosya ve veri modeli gözlemleri yerel kaynak incelemesine dayanır; canlı veritabanı bu plan hazırlanırken doğrulanmadı. Uygulama öncesinde mevcut kaynakları ve migration geçmişini yeniden kontrol et. Expo kodu için proje talimatındaki SDK 57 dokümantasyonunu, Supabase değişikliklerinde ilgili beceri ve güncel dokümantasyonu kullan.

## 1. Param nereye gitti?

### Kullanıcı deneyimi

- Borç özeti ekranının altında **Param nereye gitti?** girişi bulunacak.
- Borç kalmamış olsa bile bu giriş erişilebilir olacak.
- Açılan döküm mevcut kullanıcının payının olduğu veya ödeme yaptığı harcamaları gösterecek.
- Her satırda harcama adı, tarih, toplam tutar, **Benim payım** ve **Benim ödediğim** gösterilecek.
- Satıra dokununca mevcut harcama detayı açılacak.
- Dönem seçenekleri: **Bu ay / Geçen ay / Tüm zamanlar**. Önerilen ilk seçim: Bu ay.
- Üstte seçilen dönem için toplam kişisel pay ve toplam ödenen tutar ayrı gösterilecek.
- Boş döküm ve veri yükleme/hata durumları anlaşılır metinlerle karşılanacak.
- Türkçe ve İngilizce metinler, mevcut tema ve erişilebilirlik düzeni kullanılacak.

Örnek:

| Harcama | Toplam tutar | Benim payım | Benim ödediğim |
| --- | ---: | ---: | ---: |
| Market | 900 TL | 300 TL | 900 TL |
| İnternet | 600 TL | 200 TL | 0 TL |

### Hesaplama sözleşmesi

- **Benim payım:** `expense_splits` içindeki mevcut üyeye ait `amount_owed` toplamı; kişinin harcamadaki maliyeti.
- **Benim ödediğim:** `expense_payments` içindeki mevcut üyeye ait `amount_paid` toplamı; harcama kaydında kişinin yaptığı ödeme.
- Payı sıfır olup ödeme yapan kişi de dökümde ilgili harcamayı görmeli.
- `settlements` borç kapatma kayıtları yeniden harcama olarak eklenmeyecek. Bu döküm banka hesabı hareketleri dökümü değildir.
- Sadeleştirilmiş bir transferin hangi harcamayı kapattığına ilişkin yapay dağılım yapılmayacak.
- Borç kapatma, harcamanın kişisel payını veya harcama sırasında ödenen tutarını değiştirmeyecek.
- Eski `expense_debts.is_settled` durumu nedeniyle harcamalar dökümden çıkarılmayacak.
- Tutarlar kuruş hassasiyetinde hesaplanacak; tarih sınırları mevcut dönem hesaplama yaklaşımıyla tutarlı olacak.
- Harcama düzenlenmesi/silinmesi döküm ve toplamları güncelleyecek.
- Mevcut sorgu pay ve ödeme kayıtlarını zaten getiriyor; bu özellik için yeni tablo beklenmiyor.

### İlgili dosyalar ve önerilen değişiklikler

- `src/components/debt-summary-modal.tsx`: yeni giriş ve açılış akışı.
- `src/components/personal-spending-modal.tsx` (önerilen yeni dosya): kişisel döküm.
- `src/lib/personal-spending.ts` (önerilen yeni dosya): filtreleme ve kuruş bazlı toplamlar.
- `src/lib/api/expenses.ts`: mevcut `ExpenseWithSplits` ve sorgu sözleşmesini kullan; yalnızca gerekirse değiştir.
- `src/hooks/use-expenses.ts`: mevcut sorgu/güncellenme davranışını kullan.
- `src/lib/statistics.ts`, `src/components/statistics-modal.tsx`: dönem davranışını tekrar kullanmak için incele.
- `src/components/expense-detail-modal.tsx`: mevcut detay açılış sözleşmesini incele.
- `src/locales/tr.json`, `src/locales/en.json`: yeni metinler.

### Kabul ve doğrulama

- Eşit, paylı ve sabit bölüşümde kişisel tutarlar doğru.
- Birden çok ödeyende yalnızca mevcut kişinin ödemeleri toplanıyor.
- Payı olmayan ama ödeme yapan kişinin kaydı görünüyor.
- Borç sıfırken giriş kullanılabiliyor; borç kapatma dökümü değiştirmiyor.
- Ay/yıl geçişleri, boş dönem, kuruş küsuratları doğru işleniyor.
- Harcama düzenleme/silme sonrası toplamlar ve satırlar güncelleniyor.
- Mevcut net borç hesaplaması ve ödeme kaydetme davranışı bozulmuyor.

## 2. Ortak ve bireysel alışveriş listesi

### Kesin kullanıcı isteği

- Doğrudan eklenen ürünler varsayılan olarak **Ortak** olacak.
- Kullanıcı kendini seçerek bireysel alışveriş ihtiyaçlarını da burada tutabilecek.

### Karar: görünürlük

**2026-09-13 kullanıcı kararı:** Bireysel listeler gizli olmayacak. Ortak ve kullanıcı bazlı listeler Supabase'de tutulacak, aynı evdeki herkes tarafından görülebilecek ve yönetilebilecek.

### Kullanıcı deneyimi

- Ürün ekleme formunda **Kimin için?** alanı: **Ortak** veya **Kendim — [kullanıcı adı]**.
- Her yeni ekleme açılışında seçim Ortak olacak; önceki bireysel seçim sessizce taşınmayacak.
- Liste ekranında **Ortak / Benim listem** geçişi olacak.
- Her görünümde kategoriler, alınanlar bölümü, düzenleme/silme ve alındı işaretleme çalışacak.
- Toplu eklenen bütün ürünler formda seçilen kapsama ait olacak.
- Düzenleme açıldığında mevcut kapsam korunacak. Kapsamlar arası taşıma ilk sürüm için gerekli değil; eklenecekse ayrıca erişim ve bildirim sonuçları ele alınmalı.
- Boş durumlar ve ürün sayıları seçili listeye göre gösterilecek.
- Alışveriş ürününün alınması otomatik harcama veya borç oluşturmayacak.

### Veri ve erişim planı

- Ürünü ekleyen kişi (`added_by`) ile bireysel kaydın sahibi ayrı bilgiler olacak.
- Ortak kayıtları temsil eden boş sahiplik değeri ve bireysel kayıtları gerçek hesaba bağlayan sahiplik alanı değerlendirilecek; kesin alan adı migration tasarımında seçilecek.
- Sahiplik yalnızca yeniden sahiplenilebilir `household_members` satırına bağlanmamalı: bir hesap ayrılıp o kişi başka hesapça sahiplenildiğinde bireysel liste yeni hesaba geçmemeli.
- Mevcut bütün alışveriş kayıtları ortak kalacak; veri kaybı veya mevcut kayıtlardan kişisel sahiplik çıkarımı yapılmayacak.
- Ortak ve bireysel kayıtlar mevcut ev üyelerinin tamamı tarafından okunabilecek ve yönetilebilecek.
- Okuma, ekleme, güncelleme ve silme kuralları sunucuda uygulanacak; yalnızca arayüz filtresine güvenilmeyecek.
- Kullanıcı başkasına bireysel kayıt atayamayacak; kayıt başka eve veya hesaba taşınamayacak.
- Evden ayrılınca kayıtları otomatik olarak ortaklaştırma veya yeni üyeye aktarma. Eski kişisel kayıtların korunma ve erişim davranışını uygulama öncesinde netleştir; varsayılan olarak veri silme.
- Veritabanı değişiklikleri migration olarak tutulacak ve TypeScript veritabanı tipleri yenilenecek.

### Sorgu, gerçek zamanlı güncelleme ve bildirimler

- Mevcut liste sorgusu ev kapsamında çalışıyor; görünürlük ve kullanıcı değişimine göre sorgu/önbellek anahtarları gözden geçirilecek.
- Hesap değiştirilince önceki kişinin bireysel verisi önbellekten görünmeyecek.
- Gerçek zamanlı güncelleme ortak ve bireysel listeleri bütün ev arkadaşlarında doğru yenilemeli.
- Ortak ve bireysel ürünlerin mevcut ev geneli bildirim davranışı korunacak.

### İlgili dosyalar ve önerilen değişiklikler

- `src/app/list.tsx`: liste geçişi, seçili kapsama göre bölümler ve boş durumlar.
- `src/components/add-shopping-item-modal.tsx`: Kimin için? seçimi ve ekleme sözleşmesi.
- `src/lib/api/shopping-items.ts`: sahiplik bilgisiyle ekleme ve erişime uygun sorgular.
- `src/hooks/use-shopping-items.ts`: mutation girdileri, cache yenileme, realtime ve bildirim koşulları.
- `src/lib/query-keys.ts`: kullanıcı/kapsam ayrımı gerektiği ölçüde anahtar güncellemesi.
- `src/hooks/use-session.tsx`: hesap değişiminde mevcut cache temizliğini incele.
- `src/lib/api/notifications.ts`: bildirim çağrısı sözleşmesini incele.
- `supabase/functions/notify/index.ts`: sunucu tarafında bireysel içerik bildirim engeli.
- `supabase/migrations/`: sahiplik, kısıtlar ve erişim kuralları için yeni migration.
- `src/types/database.ts`: güncel veritabanından üretilmiş tipler.
- `src/locales/tr.json`, `src/locales/en.json`: yeni metinler.
- `supabase/tests/`: sahiplik ve erişim testleri.

### Kabul ve doğrulama

- Eski ürünlerin tamamı ortak listede kalıyor.
- Yeni form varsayılan olarak ortak; kendini seçince bireysel kayıt oluşuyor.
- Toplu ekleme seçilen kapsamı bütün satırlara uyguluyor.
- Kategori ve alınanlar grupları seçili listeyi yansıtıyor.
- Sahibi düzenleyebiliyor, silebiliyor ve alındı işaretleyebiliyor.
- İkinci ev üyesi bireysel ürünü arayüzden ve doğrudan API üzerinden okuyamıyor/değiştiremiyor.
- Başka evdeki kullanıcı kayda erişemiyor.
- Ortak ve bireysel işlemler ev arkadaşlarına mevcut bildirim akışıyla ulaşıyor.
- Hesap değişimi, evden ayrılma ve üye sahiplenmede kişisel kayıt sızıntısı olmuyor.
- İki hesapla realtime ve erişim davranışı doğrulanıyor.

## Uygulama sırası ve teslim

1. Güncel kaynakları ve talimatları kontrol et; belirtilen varsayımları sonraki kullanıcı talimatlarıyla karşılaştır.
2. Mevcut verilerle kişisel harcama dökümünü uygula ve hesaplamayı doğrula.
3. Alışveriş sahipliğini ve erişim migration'ını tasarla; mevcut verilerin ortak kaldığını doğrula.
4. Liste arayüzü, sorgu/cache, realtime ve bildirim değişikliklerini tamamla.
5. Anlamlı hesaplama ve erişim testlerini, mevcut proje kontrollerini ve ilgili ekranların cihaz/simülatör kontrollerini yap.
6. `FEATURES.md`, `SCREENS.md` ve veri sözleşmesi değiştiyse `AGENTS.md` içindeki ilgili açıklamaları güncelle.
7. Değişen dosyaların tam listesini, gerekli migration/Edge Function dağıtım adımlarını ve gerçekten yapılan doğrulamaları raporla. Yerel test, derleme ve gerçek cihaz doğrulamasını birbirinden ayır.

Bu belge üretim değişikliği veya dağıtım yapıldığı anlamına gelmez. Uygulama ajanı canlı işlem kapsamını kendisine verilen kullanıcı talimatına göre belirlemelidir.
