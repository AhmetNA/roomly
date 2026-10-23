# Roomly — Düşük maliyetli Android yayın planı

Hazırlanma ve kaynak kontrol tarihi: **23 Ekim 2026 (Europe/Istanbul)**.

Bu belge bir uygulama ve yayın planıdır; maddeler tamamlanmış iş anlamına gelmez. Bu çalışmada uygulama kodu değiştirilmedi, mağazaya yükleme yapılmadı ve ücretli servis açılmadı. Yerel kaynaklar incelendi; Play Console, Google Cloud, EAS ve canlı Supabase hesap ayarları denetlenmedi. Bu nedenle konsol ayarları ve gerçek cihaz sonuçları ayrıca doğrulanmalıdır.

## Uygulama günlüğü — 23 Ekim 2026

Planın başlangıç bulguları aşağıda korunmuştur; güncel ilerleme için [yayın hazırlığı durumuna](android-launch-status.md) bakın.

Kullanıcı kararları: mevcut `com.anonymous.roomly` korunacak; Play hesabı kişisel ve yaklaşık dört aylık; kamuya açık destek adresi `caludebabaq@gmail.com`. Henüz mağazaya yükleme yapılmadı.

## 1. Önerilen başlangıç ve bütçe

**Öneri:** Android / Google Play, ilk dağıtım Türkiye, ücretsiz ve reklamsız uygulama, mevcut Expo + Supabase mimarisi. iOS yayını, abonelik, reklam SDK’sı, ödeme entegrasyonu ve yeni ücretli izleme servisleri ilk sürüm kapsamına alınmasın. Türkiye ile başlamak yurt dışına veri aktarımı yükümlülüğünü ortadan kaldırmaz.

| Kalem | Başlangıç bütçesi | Sınır / karar |
| --- | --- | --- |
| Google Play geliştirici hesabı | **Tek seferlik 25 USD** | Mevcut hesap varsa yeniden ödenmez. Kur/banka maliyeti ayrıca olabilir. Bireysel geliştirici için kişisel hesap değerlendirilir; yanlış kuruluş beyanı yapılmaz. [G1] |
| Expo / EAS | **0 USD/ay hedefi** | Free planda ayda 15 Android build’e kadar, düşük öncelikli kuyruk. Deneme derlemelerini yerelde yap; bulutu sürüm adaylarına ayır. Kota yetmezse yerel imzalı AAB veya sonraki kota dönemi. [M1] |
| Supabase Free | **0 USD/ay hedefi** | 500 MB DB, 1 GB dosya, 5 GB egress + 5 GB cached egress, 50.000 MAU; 1 hafta hareketsizlikte duraklatma ve 2 aktif proje sınırı. Gerçek kullanım konsoldan izlenmeli. [M2] |
| Expo Push + Firebase FCM | **0 USD** | Expo push ücretsiz; FCM ücretsiz. Mevcut Spark planını koru, sırf push için Blaze açma. [M3][M4] |
| Gizlilik / silme / destek sitesi | **0 USD hedefi** | Sadece kamuya açık belgeler içeren ayrı public repo ile GitHub Pages kullanılabilir. Özel ana uygulama reposunu açmak gerekmez. [M5] |
| Alan adı | **İlk aşamada 0 USD hedefi** | Play için özel alan adı satın alma zorunluluğu yok. Google OAuth marka/alan sahipliği doğrulaması veya SMTP sağlayıcısı gerektirirse ayrı karar ve fiyat araştırması yapılır. |
| E-posta | **Koşullu 0 USD hedefi** | Auth için çalıştığı doğrulanmış custom SMTP gerekir. Gmail mevcut düşük hacimli pilot için denenebilir; üretim teslimatı/kotası garanti değildir. Mevcut görev SMTP’si Auth SMTP ayarı değildir. [M6] |
| Test kullanıcıları | **0 USD hedefi** | Gerçek kullanacak arkadaş/öğrenci grubu; ücretli/sahte test satın alma. |
| Hukuki inceleme | **Fiyatı belirlenmedi** | Yurt dışı aktarım ve ortak finansal kayıt saklama için sınırlı kapsamlı uzman incelemesi gerekebilir; 25 USD toplam bütçeye dahil varsayılmaz. |

**Alt sınır:** Hesap yoksa 25 USD tek seferlik mağaza kaydı; aylık altyapı hedefi 0 USD. Bu, ölçekten bağımsız veya hukuki uyum dahil garanti toplam değildir. Ücretsiz katmanda SLA/otomatik geri yükleme güvencesi varsayılmamalı. Ücretli yükseltme otomatik çözüm olarak seçilmemeli.

**Maliyet kontrol önerisi:** Her hafta storage, DB, egress, Realtime, Edge Function, Auth ve EAS Update kullanımını kontrol et. Her kota için %70’te incele, %85’te büyümeyi/yüklemeleri sınırla veya kapasite kararı al. Bunlar sağlayıcı eşikleri değil, önerilen iç eşiklerdir. 1 GB storage, 5 MB’lık yaklaşık 200 fotoğrafla dolabilir; gerçek sınır diğer dosyalar ve overhead nedeniyle daha erken gelebilir. Fotoğraf sıkıştırma, kullanıcıya anlaşılır yükleme sınırı ve yetim dosya temizliği ilk sürümde değerlidir.

## 2. Mevcut projeden doğrulanan durum

| Bulgular | Kanıt | Yayına etkisi |
| --- | --- | --- |
| Expo 57 / React Native 0.86.3; Android paketi `com.anonymous.roomly` | `package.json`, `app.json` | Paket kimliği ilk Play yüklemesinden önce kesinleşmeli. Bu ad tek başına ret sebebi değildir. Sonradan değiştirmek yeni uygulama kimliğidir. |
| Preview APK, production profili ve otomatik sürüm artırma var | `eas.json` | Production ortam değişkenleri dosyada açıkça yok; EAS ortamında bulunuyor olabilir. Eksik olduğu kesinleşmedi. |
| Supabase bağlantı değişkeni yoksa başlangıçta exception atılıyor | `src/lib/supabase.ts` | İmzalı production build’in doğru ortamla üretildiği kanıtlanmalı. |
| Yerel Gradle release yapılandırması debug signing kullanıyor | `android/app/build.gradle` | Yerel release doğrudan mağaza için güvenilir kabul edilemez. EAS imza enjeksiyonu ayrıca kontrol edilir; son AAB sertifikası doğrulanır. |
| Çıkış ve evden ayrılma var; hesap silme/gizlilik/şifre sıfırlama akışı aramada bulunmadı | `src/app/people.tsx`, `src/lib/api/auth.ts`, `src/` araması | Hesap silme ve yasal erişim yolları geliştirme işi. Şifre sıfırlama, e-posta girişinin kullanılabilirliği için gerekli. |
| Google OAuth, PKCE ve özel şema callback mevcut | `src/lib/api/auth.ts` | Play’den kurulu sürümde test edilmeli. README Testing modu diyor; güncel konsol durumu bilinmiyor. |
| Manifest’te overlay ve eski storage izinleri mevcut | `android/app/src/main/AndroidManifest.xml` | Asıl karar merged release manifest üzerinden verilmeli; gereksiz izinler kaldırılmalı. Mikrofon kaldırma kuralı mevcut. |
| Supabase migration, function ve test dosyaları Git’te takip ediliyor | `git ls-files supabase` | Eski AGENTS/README’deki “takip edilmiyor” notu güncel değil. |
| Yeni tabloları oluşturan migration’lar var; ilk çekirdek şema baseline’ı görünmüyor | `supabase/migrations/` | “Hiç CREATE TABLE yok” eski notu yanlış; boş DB’den tam kurulum hâlâ ayrıca kanıtlanmalı. |
| GitHub Pages deploy workflow mevcut | `.github/workflows/deploy-pages.yml` | Yasal sayfaların gerçekten yayında olduğu veya auth dışında erişildiği kanıtlanmış değil. |
| SQL testleri ve görev filtre testi var | `supabase/tests/` | Bu plan çalışmasında testler/build çalıştırılmadı. Gerçek cihaz uygunluğu kanıtlanmadı. |

## 3. Kategori A — Kod ve teknik değişiklikler

Öncelik: **P0** = dış testte kişisel veri toplamadan / mağaza başvurusundan önce; **P1** = herkese açık üretimden önce; **P2** = ölçülen ihtiyaç sonrası. P0/P1 burada proje yayın kapısıdır; her madde bağımsız Google zorunluluğu değildir.

| ID | Öncelik | İş | Tamamlanma kanıtı |
| --- | --- | --- | --- |
| A01 | P0 | Paket adı, release imzası, upload key ve Play App Signing kararını sabitle. FCM kaydını seçilen paketle eşleştir. | AAB doğru paket/sürüm/sertifika ile Play internal track’e kabul edilir; anahtar yedeği güvenli yerde. |
| A02 | P0 | Production EAS ortamını doğrula; public bağlantı ayarlarını üretim profiline bağla. Service-role, SMTP ve FCM sırlarını uygulamaya gömme. | Temiz kurulumda Metro olmadan açılış ve gerçek sunucu bağlantısı; build çıktısında gizli anahtar yok. |
| A03 | P0 | Uygulama içi hesap silme başlatma + uygulama dışı silme talep sayfası + yetkili sunucu işlemi geliştir. | Başka hesabı silemeyen, yeniden denenebilir işlem; Auth, üyelik, token, fotoğraf ve kullanıcı içerikleri için kayıtlı sonuç. |
| A04 | P0 | Giriş/kayıtta ve ayarlarda gizlilik/aydınlatma, koşullar ve destek bağlantıları; koşullar kabulünün sürümünü kaydet. | Oturum açmadan metinler erişilebilir; hesap açmadan/UGC üretmeden koşullar gösterilir. |
| A05 | P0 | Google OAuth’un genel kullanıcıyla çalışmasını ve e-posta doğrulama/şifre sıfırlama callback’lerini tamamla; custom SMTP ayarla. | Test listesinde olmayan Google hesabı ve proje ekibi dışındaki e-posta ile kayıt, onay, parola kurtarma çalışır. |
| A06 | P0 | API 36+, 64-bit native kütüphaneler ve 16 KB page-size uyumunu son AAB’de doğrula. | Play kontrolü ve 16 KB Android ortamında açılış/temel akış başarılı. SDK sürümü tek başına kanıt değildir. [G4][G5] |
| A07 | P0 | İzinleri merged release manifest üzerinden azalt. Fiş için sistem Photo Picker; geniş galeri/overlay izni isteme. Kamera ve bildirim yalnız gerektiğinde. | İzin reddedilince uygulama çalışır; gereksiz `SYSTEM_ALERT_WINDOW`, storage ve medya izinleri final pakette yok. [G6] |
| A08 | P0 | UGC bildirme, kullanıcı şikâyeti ve görev uyarılarını susturma/engelleme tasarımı; destek işlem kuyruğu. | Başka evin kaydına erişmeden şikâyet edilebilir; uygunsuz içerik için işlem yapılabilir; engellenen kişi kişisel uyarı gönderemez. [G9] |
| A09 | P0 | İki ayrı ev ve çıkış yapmış kullanıcıyla RLS, RPC, Storage, davet/sahiplenme ve Edge Function yetkilendirme testleri. | URL/ID değiştirerek başka evin verisine erişilemez; brute force ve spam limitleri çalışır. |
| A10 | P1 | Android sürüm adayında Harcamalar/Liste/Görevler/Kişiler tam akışları; crash/ANR teşhisi. | Release cihaz test raporu ve logcat; Görevler dahil her sekmede soğuk açılış, gezinme ve işlem başarılı. |
| A11 | P1 | Fiş boyut azaltma, artık dosya temizliği, hesap silmede storage temizliği; sınırlı sorgu ve pagination. | Silinen fiş erişilemez; kota dolunca anlaşılır hata; başarılı yüklemeler yanlışlıkla silinmez. |
| A12 | P1 | Bildirim hata/receipt takibi, geçersiz token temizliği ve çıkış/hesap değişiminde token ayrıştırma. | Play sürümü foreground/background/kapalıyken doğru alıcıya bildirim alır; eski kullanıcıya veri gitmez. |
| A13 | P1 | Kira/görev cron’u, tekrar önleme, saat dilimi ve e-posta hatalarını doğrula. Kilit ekranında borç/tutar gibi veriyi varsayılan olarak azalt. | İstanbul tarih sınırları, tarih değişikliği ve tekrar çalıştırma testleri; yanlış kişiye gönderim yok. |
| A14 | P1 | Çekirdek şema baseline’ı, migration sırası, secrets envanteri ve geri yükleme prosedürü. | İzole test DB’si sıfırdan kurulur; şifreli DB + Storage yedeğinden geri dönüş denenir. Üretimde reset yapılmaz. |
| A15 | P1 | CI’de lint/typecheck ve anlamlı mevcut testler; sürüm notu ve hata müdahale prosedürü. | Temiz checkout’tan tekrar üretilebilir build; başarısız sürümün dağıtımını durdurma adımları yazılı. |
| A16 | P1 | EAS Update production/preview kanallarını ayır; native değişiklikte yeni binary/runtime politikası. | Preview güncellemesi production’a gitmez; uyumsuz OTA yayınlanamaz; önceki uyumlu JS sürümüne dönüş denenir. |
| A17 | P2 | Kullanım büyürse ek gözlemleme ve ücretli kapasiteyi değerlendir. | Önce Play Android vitals ve mevcut loglarla ihtiyaç ölçülür; yeni SDK’nın maliyet/veri etkisi belgelenir. |

Kod çalışmasına başlanırken proje kuralı gereği [Expo SDK 57 dokümantasyonu](https://docs.expo.dev/versions/v57.0.0/) okunmalı. Paket güncellemesi sırf “en yeni” olsun diye yapılmamalı.

### Hesap silme tasarımı: Roomly’ye özgü kritik nokta

`leave_household` hesap bağlantısını kaldırıp kişiyi ve finansal geçmişi korur. Bu, **hesap silme değildir**. Silme akışında kimlik doğrulama, oturum iptali, Auth kullanıcısı, push token’ları, profil/IBAN, fişler, görev yorumları, loglar ve yedekler ayrı ele alınmalıdır. Sadece `user_id = null` yapmak anonimleştirme sayılmaz; isim, açıklama veya fiş kişiyi tanımlayabilir.

Ortak harcama geçmişinin korunması diğer ev üyeleri açısından önemli olsa da bu, süresiz kişisel veri saklamak için tek başına gerekçe değildir. Hukuken gerekli ve sınırlı kayıtlar belirlenmeli; kalan veriler silinmeli veya gerçekten anonimleştirilmelidir. Uygun tasarımda finansal toplam korunurken kişisel metin/ekler kaldırılabilir. Borç bakiyesinin silme sonrasında nasıl korunacağı ve yeniden sahiplenmenin nasıl engelleneceği test edilmelidir. Kullanıcıya silinecek/saklanacak veri ve süre önceden açıklanmalı. [G7]

En ucuz dış talep akışı, erişilebilir statik sayfada açık destek adresi ve adımlardır; canlı izlenen bir gelen kutusu, hesap sahipliği doğrulaması ve talebi gerçekten işleyen prosedür gerekir. Sayfa yalnız “uygulamayı yeniden yükle” dememeli. Uzun vadede doğrulanmış otomatik form tercih edilir.

### Asgari cihaz test paketi

- Play internal track’ten kurulum; güncelleme; ilk açılış; uygulama kapatılıp yeniden açılınca oturum.
- Desteklenen en düşük Android sürümü, Android 16 ve erişilebilen en az iki gerçek cihaz/üretici; 16 KB ortamı ayrıca.
- Email/Google giriş, iptal, şifre kurtarma, doğrulama bağlantısı, ağ kesintisi, token yenileme.
- İki ev ile izolasyon; aynı evde iki cihaz ile Realtime; sahipsiz kişiyi sahiplenme ve evden ayrılma.
- Eşit/hisse/sabit bölüşüm, çoklu ödeyen, kuruş ve para birimleri; düzenleme/silme/ödeme kaydı.
- Liste ve kişisel listelerin ev üyelerine görünürlüğü; görev atama, yorum, tamamlama, bildirim.
- Kamera/galeri/bildirim izni reddi; fiş yükleme/silme; açık/koyu tema; büyük yazı ve TalkBack.
- Hesap silme sonrası diğer cihazdan erişim, eski dosya bağlantısı ve bildirim teslimatının kesilmesi.

## 4. Kategori B — Hukuksal metinler ve veri işleme düzeni

Bu bölüm yayın hazırlığıdır; Roomly’nin işletmecisi, gerçek veri akışı ve hizmet sağlayıcı sözleşmeleri görülmeden kesin hukuki uygunluk sonucu verilemez. Özellikle **B03 ve B04** canlı kişisel veriyle yayına geçmeden somutlaştırılmalıdır.

| ID | Gereken iş | Roomly için içerik / karar | Çıktı |
| --- | --- | --- | --- |
| B01 | Veri sorumlusu ve kapsam | İşletmeci gerçek kişi mi şirket mi; yasal ad, başvuru adresi, destek e-postası; Türkiye ve yetişkin kullanıcı odağı önerisi. Play kişisel hesabı şirket zorunluluğu anlamına gelmez; vergi/ticari faaliyet ayrıca değerlendirilir. | Kimlik ve sorumluluk bilgileri |
| B02 | KVKK aydınlatma + gizlilik politikası | Kimlik/iletişim, amaçlar, toplama yöntemi, her amaç için hukuki sebep, alıcılar, haklar, saklama/silme, güvenlik ve iletişim. Rıza gerektiren iş ayrı; aydınlatma genel “her şeye izin veriyorum” onayı değildir. [L1][G8] | Türkçe kamuya açık HTML; İngilizce sunuluyorsa tutarlı çeviri |
| B03 | Yurt dışına aktarım | Supabase bölgesi/alt işleyenleri, Google OAuth/FCM, Expo, SMTP, log/yedek/hosting akışları tespit edilir. Türkiye’deki kullanıcıdan yabancı sağlayıcıya sürekli aktarım için KVKK md.9 mekanizması belirlenir. EU bölgesi tek başına yeterli değildir. [L3][L4] | Sağlayıcı/ülke/aktarım mekanizması matrisi ve gerekli sözleşmeler |
| B04 | Silme ve saklama politikası | Ortak finans kayıtları, sahipsiz kişiler, IBAN, fiş, yorum, log ve yedek için süre/amaç/silme yöntemi. Genel “mali veri 10 yıl saklanır” kopyası kullanılmaz. | Veri kategorisi bazında süre ve hukuki gerekçe |
| B05 | Kullanım koşulları | Yalnız kayıt/hesaplama aracı olduğu, para transferi yapmadığı, ev üyelerinin düzenleme yetkisi, kişisel listelerin evde görünür olduğu, kabul edilmeyen içerik ve şikâyet süreci. | Sürümlenmiş koşullar ve kabul akışı |
| B06 | Başvuru ve ihlal süreçleri | Erişim/düzeltme/silme talepleri için kimlik doğrulama ve kayıt; başvuruların en geç 30 gün içinde cevaplanması. İhlal için kapsam tespiti, erişim kesme ve gerekli bildirimlerin sürelerinin doğrulanması. [L2] | Sorumlu kişi, takip listesi, yanıt şablonları |
| B07 | VERBİS değerlendirmesi | Küçük geliştirici otomatik olarak bütün KVKK yükümlülüklerinden muaf değildir. Çalışan/bilanço ve faaliyet kriterlerine göre kayıt istisnası değerlendirilir. [L5] | Gerekçeli kayıt/istisna notu |
| B08 | Üçüncü kişi ve içerik riski | Hesabı olmayan ev arkadaşlarının isimleri de kişisel veri. Fişler adres/kart parçası/özel nitelikli bilgi içerebilir. Gereksiz bilgiyi yüklememe, mümkünse kırpma ve silme yolu. | Veri minimizasyonu ve üçüncü kişiye aydınlatma yolu |
| B09 | Haklar ve marka | Roomly adı, ikon, font ve görseller için kullanım hakkı/lisans kontrolü; bağımlılık lisans bildirimleri. | Lisans listesi; marka araştırması sonucu |

**Aktarım maliyeti riski:** Standart sözleşme yolu seçilirse uygun tarafların imzaları ve beş iş günü içinde Kuruma bildirim şartı gündeme gelir. Supabase’in genel DPA/GDPR SCC belgesi, Türk KVKK standart sözleşmesinin yerine otomatik geçmez. Sağlayıcının uygun sözleşmeyi yapıp yapmadığı doğrulanmalı; sonuç alınamazsa veri akışı/sağlayıcı yeniden tasarlanmalı. Sürekli bulut aktarımı, arızi aktarım istisnası veya tek bir açık rıza kutusuyla çözülmüş sayılmamalıdır. [L3][L4]

**Önerilen süreler (henüz kabul edilmiş politika değil):** Destek/silme taleplerine 7 gün içinde ilk dönüş, hukuki üst sınır içinde sonuç; operasyonel loglarda 30 gün başlangıç hedefi; yedek döngüsünde silinen verinin tekrar canlanmasını engelleyen prosedür. Gerçek sağlayıcı kapasitesi ve hukuki gerekçe belirlendikten sonra metne kesin süre yazılır.

## 5. Kategori C — Google Play ve Google hizmetlerinin talepleri

### C01 — Geliştirici hesabı

- [ ] Mevcut Play hesabı olup olmadığını, hesap türünü ve açılış tarihini kontrol et.
- [ ] Yoksa doğru kişisel/kuruluş türüyle hesap aç; kayıt bedeli 25 USD, kimlik/iletişim doğrulamalarını tamamla.
- [ ] Yeni kişisel hesap için Play Console mobil uygulamasından gerçek Android cihaz erişimini doğrula.
- [ ] Mağazada yayınlanacak geliştirici/iletişim bilgilerini incele; bunları özel kalacak varsayma.

Kaynak: [G1]. Kuruluş hesabını yalnız test sürecinden kaçmak için seçme; kuruluş belgeleri ve ek doğrulamalar gerekebilir.

### C02 — Zorunlu test ve üretim erişimi

13 Kasım 2023 sonrasında açılan kişisel hesaplarda **en az 12 testçinin 14 gün kesintisiz katılımıyla kapalı test** gerekir. Internal test veya dışarıdan APK paylaşımı bu koşulun yerine geçmez. 14 gün sonunda üretim erişimi için başvuru ve test/geri bildirim soruları vardır; otomatik kabul garantisi yoktur. [G2]

Öneri: 15–20 gerçek gönüllü bul; 12’nin altına düşme riskini azalt. Yalnız katılım değil, kayıt/görev/fiş/borç/silme gibi akışlarda gerçek kullanım ve geri bildirim topla. Test kullanıcı listesini ve gerçek kişisel veriyi repoya koyma.

### C03 — Teknik paket

- [ ] İmzalı **Android App Bundle (AAB)**; doğru paket kimliği; her yüklemede artan versionCode; Play App Signing. [G3]
- [ ] **Yeni uygulama için Android 16 / API 36 veya üstü**: 31 Ağustos 2026 itibarıyla geçerli gereklilik. Final AAB’de doğrula. [G4]
- [ ] Native kütüphanelerde 64-bit ve 16 KB sayfa boyutu uygunluğu; Play ön kontrolleri ve pre-launch raporu. [G5]
- [ ] Gereksiz izin yok; fiş seçimi için geniş fotoğraf erişimi yerine sistem picker. [G6]
- [ ] Debug/dev client, test menüsü veya geliştirme sunucusu bağımlılığı olmayan release.

### C04 — Mağaza metinleri ve görseller

- [ ] Uygulama adı (en fazla 30), kısa açıklama (80), tam açıklama (4.000 karakter), kategori/etiketler ve destek e-postası. [G3]
- [ ] Hazırlanacak görseller: 512×512 mağaza ikonu, 1024×500 feature graphic, gerçek sürümden en az 2 telefon ekran görüntüsü. Yüklemede güncel Console ölçü/biçim kontrolleriyle doğrula.
- [ ] Harcama, liste ve görev ekranlarını gerçek kişisel veri içermeyen örnek evle göster. Bankacılık/para transferi yapıyormuş izlenimi verme.
- [ ] Ücretsiz fiyat ve Türkiye dağıtımı; hedef kitle ve içerik derecelendirme anketini gerçek özelliklere göre doldur. “18+ hedef kitle” seçimi IARC yaş derecesiyle aynı şey değildir.

### C05 — App content ve inceleme erişimi

- [ ] Gizlilik URL’si + uygulama içi bağlantı; erişilebilir HTML, oturum zorunluluğu yok, PDF’ye bağımlı değil. [G8]
- [ ] Hesap silme URL’si + uygulama içi talep yolu. [G7]
- [ ] Data safety formu: gerçek release’in SDK/veri akışıyla uyumlu cevaplar.
- [ ] App access: inceleyicinin email/şifre ile kullanabileceği, MFA/kişisel Google hesabı/ev davetini beklemeyen örnek hesap ve dolu örnek ev. Giriş bilgileri sadece Console’da güvenli paylaşılır; bu belgeye konmaz.
- [ ] Ads, hedef kitle, içerik derecelendirme ve Console’da çıkan diğer beyanlar; reklam SDK’sı yoksa fiilî durumla tutarlı “reklam yok”.
- [ ] **Financial features declaration** tamamlanmalı. Roomly para transferi/kredi sunmuyor; ancak harcama/borç yönetimi nedeniyle otomatik “finansal özellik yok” seçilmemeli. Formdaki “Other” dahil güncel kapsamla eşleştir, gerekirse politika desteğinden sınıflandırma al. [G10][G11]
- [ ] UGC: görev yorumları, isimler, fişler ve paylaşılan metinler için koşullar, bildirme ve moderasyon; doğrudan uyarı gibi kişi etkileşimlerinde engelleme ihtiyacını uygula. “Sadece ev arkadaşları” olması blanket muafiyet değildir. [G9]

### C06 — Google OAuth / Firebase

Google Play onayı ile Google OAuth marka/veri erişim doğrulaması ayrı süreçlerdir. OAuth Audience/Publishing durumu, Branding, redirect allowlist ve scope’lar incelenmeli. Yalnız giriş için gereken temel scope’lar kullanılmalı; gereksiz Gmail/Drive erişimi istenmemeli. Marka doğrulaması ile hassas/kısıtlı scope doğrulaması ayrıdır; test modu durumunu sadece eski README’den kesinleştirme. [G12][G13]

Mevcut yöntem Supabase üzerinden web OAuth + PKCE; native Google Sign-In SDK kurulmuş varsayarak rastgele SHA eklemek çözüm değildir. Paket/imza değişirse ilgili Firebase Android kaydı ve gerekiyorsa sertifika ayarları güncellenir. FCM özel anahtarı sunucu/EAS’te kalır. Gerçek Play kurulumu ile OAuth ve push birlikte test edilir.

## 6. Data safety için ön veri envanteri

Bu tablo nihai form cevabı değildir. “Collected” ve “shared” Google’ın tanımlarıyla ayrı değerlendirilir; hizmet sağlayıcıya aktarım, kullanıcı tarafından başlatılan paylaşım ve üçüncü tarafın bağımsız kullanımı farklı olabilir. “Veri satmıyoruz” demek “hiç veri toplanmıyor/paylaşılmıyor” demek değildir.

| Veri | Kaynak / kullanım | Kontrol edilecek beyan |
| --- | --- | --- |
| İsim, email, kullanıcı ID | Auth, üyelik ve ev içi görünürlük | Personal info; zorunlu/isteğe bağlı, hesap yönetimi |
| IBAN | Üyenin isteğe bağlı bilgisi; diğer ev üyeleri okuyabilir | Financial info → ödeme/banka bilgisi kategorisi |
| Tutar, borç, ödeme kaydı, para birimi | Harcama ve mutabakat | Financial info / purchase history / other financial info ayrımı |
| Fiş fotoğrafı | Private Storage; ev üyelerine imzalı URL | Photos; isteğe bağlı yükleme, saklama/silme |
| Görev, yorum, liste ve açıklama | Paylaşımlı içerik | App activity / other user-generated content; yorumların kullanımına göre mesaj kategorisi |
| Push token ve cihazla ilişkili tanımlayıcı | Expo/FCM teslimatı | Device or other IDs; çıkış/silmede temizleme |
| IP, auth/işlem logları, hata verisi | Hosting ve hizmet sağlayıcılar | Gerçek toplanan diagnostics/identifiers; süre ve alt işleyenler |
| EAS Update istekleri ve varsa ölçümler | OTA indirme/dağıtım | Release SDK davranışı, aktarım ve saklama |

Şifreyi uygulama logları/veritabanı tablolarında tutma. HTTPS aktarımı, erişim kontrolü ve silme beyanları yalnız testle desteklendiğinde işaretlenmeli. Data safety hazırlanırken [Google’ın resmî form rehberi](https://support.google.com/googleplay/android-developer/answer/10787469) ve yayın anındaki Console açıklamaları üzerinden satır satır kontrol yapılmalı.

## 7. Uygulama sırası ve zaman tahmini

Süreler mühendislik tahminidir; hukuki sözleşme, kimlik/OAuth doğrulaması ve mağaza incelemesi için garanti süre değildir.

| Aşama | İş / bağımlılık | Yaklaşık süre | Sorumlu |
| --- | --- | --- | --- |
| 0 | Hesap/env/davetli testçi envanteri, paket adı, veri akışı ve yayın kapsamı | 0,5–1 gün | Ahmet + geliştirici |
| 1 | A01–A09, yasal metin taslakları, aktarım/silme kararları | 4–8 iş günü; hukuki bekleme ayrıca | Geliştirici + Ahmet, gerektiğinde hukuk uzmanı |
| 2 | A10–A16, imzalı AAB, cihaz testleri, mağaza metinleri ve internal test | 2–4 iş günü | Geliştirici + testçiler |
| 3 | Uygunsa zorunlu kapalı test; gerçek geri bildirim ve düzeltmeler | En az 14 kesintisiz gün | Ahmet + 12 aktif katılımcı |
| 4 | Üretim erişimi başvurusu, inceleme sorunları ve ilk Türkiye yayını | Google incelemesine bağlı | Ahmet + geliştirici |
| 5 | İlk hafta crash/ANR, auth, push, silme talepleri ve kota takibi | Günlük kısa kontrol | İşletmeci |

**Planlama payı:** Yeni kişisel hesapta yaklaşık 4–6 hafta ayır; aktarım sözleşmesi veya inceleme uzarsa daha uzun sürebilir. 14 günlük süre, hazır AAB kapalı teste alınıp gerekli kişiler katıldığında başlar. Hukuki/teknik P0 işleri bitmeden gerçek veri toplayarak takvimi hızlandırma.

İlk üretim yayını için uygun ülke kapsamını kullan; yüzde bazlı staged rollout’un her ilk yayında mevcut olduğunu varsayma. Sonraki güncellemelerde Console destekliyorsa kademeli dağıtım yap. Hatalı native sürümü eski versionCode’a dönerek düzeltemezsin: daha yüksek versionCode’lu düzeltme gerekir. Backend değişiklikleri eski istemciyle uyumlu tutulmalı.

## 8. Yayın kararı kontrol listesi

- [ ] P0 ve P1 maddeleri tamamlandı veya gereksiz olduğu somut gerekçeyle belgelendi.
- [ ] Hesap silme uygulama ve web yolundan uçtan uca çalıştı; saklanan veri açıklaması gerçekle aynı.
- [ ] Yurt dışı aktarım yöntemi, sağlayıcı sözleşmeleri ve veri sorumlusu bilgileri netleşti.
- [ ] Production AAB; doğru imza/env; API 36+; 16 KB; minimum izinler doğrulandı.
- [ ] Email/Google giriş, şifre kurtarma, Realtime, fiş, görev ve push gerçek cihazlarda geçti.
- [ ] Ayrı ev erişim testleri ve silme sonrası erişim testleri geçti.
- [ ] UGC şikâyet/engelleme akışı ve işletmecinin yanıt süreci hazır.
- [ ] Mağaza açıklaması, gizlilik metni ve Data safety aynı davranışı anlatıyor.
- [ ] İnceleme hesabı çalışıyor; kapalı test şartı gerekiyorsa sağlandı ve üretim erişimi onaylandı.
- [ ] Yedek/geri yükleme denendi; maliyet takibi ve hata müdahalesi sahibi belli.

## 9. Uygulamaya başlamadan netleştirilecek bilgiler

Plan bunlar bilinmeden hazırlanabilir; ilgili işlemler sırasında gerçek bilgiler gerekir:

1. Play hesabın var mı; varsa kişisel/kuruluş ve açılış tarihi?
2. En az 12 Android testçi bulunabiliyor mu; önerilen 15–20 kişilik yedekli grup?
3. İlk yayın yalnız Türkiye ve yetişkin hedef kitle olarak uygun mu?
4. Mağazada ve yasal metinlerde kullanılacak geliştirici adı, destek/başvuru iletişimi?
5. `com.anonymous.roomly` korunacak mı; ilk yükleme öncesi kalıcı yeni ad mı seçilecek?
6. Supabase bölgesi, mevcut ücret planı/kotalar, Auth SMTP ve OAuth production durumu?
7. Yurt dışı aktarım sözleşmesi ve silme/saklama tasarımının uygunluğu nasıl sağlanacak?

## 10. Resmî kaynaklar

Politikalar ve fiyatlar 23.10.2026 tarihinde incelendi; başvurudan hemen önce yeniden kontrol edilmeli. Aşağıdaki bağlantılar belge içindeki numaraların karşılığıdır.

### Google

- **[G1]** [Play Console kayıt, ücret ve doğrulama](https://support.google.com/googleplay/android-developer/answer/6112435)
- **[G2]** [Yeni kişisel hesapların test şartları](https://support.google.com/googleplay/android-developer/answer/14151465)
- **[G3]** [Uygulama oluşturma, AAB, imza ve mağaza bilgileri](https://support.google.com/googleplay/android-developer/answer/9859152)
- **[G4]** [Güncel hedef API gereksinimi](https://support.google.com/googleplay/android-developer/answer/11926878)
- **[G5]** [16 KB sayfa boyutu gereksinimi](https://android-developers.googleblog.com/2025/05/prepare-play-apps-for-devices-with-16kb-page-size.html)
- **[G6]** [Fotoğraf/video izinleri](https://support.google.com/googleplay/android-developer/answer/14115180)
- **[G7]** [Hesap silme gereksinimi](https://support.google.com/googleplay/android-developer/answer/13327111)
- **[G8]** [Kullanıcı verileri ve gizlilik politikası](https://support.google.com/googleplay/android-developer/answer/10144311)
- **[G9]** [Kullanıcı tarafından üretilen içerik politikası](https://support.google.com/googleplay/android-developer/answer/9876937)
- **[G10]** [Finansal özellik beyanı](https://support.google.com/googleplay/android-developer/answer/13849271)
- **[G11]** [Finansal hizmetler politikası](https://support.google.com/googleplay/android-developer/answer/9876821)
- **[G12]** [OAuth marka yönetimi ve doğrulama](https://support.google.com/cloud/answer/15549049)
- **[G13]** [OAuth 2.0 politikaları](https://developers.google.com/identity/protocols/oauth2/policies)

### Maliyet ve altyapı

- **[M1]** [Expo fiyatlandırması](https://expo.dev/pricing)
- **[M2]** [Supabase fiyatlandırması ve ücretsiz sınırlar](https://supabase.com/pricing)
- **[M3]** [Expo push SSS](https://docs.expo.dev/push-notifications/faq/)
- **[M4]** [Firebase fiyatlandırması](https://firebase.google.com/pricing)
- **[M5]** [GitHub Pages plan uygunluğu](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- **[M6]** [Supabase Auth custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

### Hukuk

- **[L1]** [KVKK aydınlatma yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-)
- **[L2]** [İlgili kişi başvurularını cevaplama](https://www.kvkk.gov.tr/Icerik/2046/Ilgili-Kisiler-Tarafindan-Yapilan-Basvurularin-Cevaplanmasi-Yukumlulugu)
- **[L3]** [KVKK yurt dışına aktarım](https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim)
- **[L4]** [KVKK 2024 değişiklikleri ve standart sözleşme bildirimi — Kurum bülteni](https://kvkk.gov.tr/SharedFolderServer/CMSFiles/4eba766b-7425-4cd4-97f5-cb09c4cf4ef9.pdf)
- **[L5]** [2025 VERBİS istisna duyurusu](https://www.kvkk.gov.tr/Icerik/8388/KAMUOYU-DUYURUSU)
