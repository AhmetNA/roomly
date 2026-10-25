# Android yayın hazırlığı — güncel durum

25 Ekim 2026, Europe/Istanbul. Kaynak plan: [android-launch-plan.md](android-launch-plan.md).

## Kullanıcı kararları

- Paket: com.anonymous.roomly; uygulama sorumlusu gösterimi: Ahmet Aydemir.
- Destek: caludebabaq@gmail.com. Türkiye, 18 yaş üzeri hedef kitle, ücretsiz ve reklamsız.
- Kişisel veriler için ayrıca bekletme yok; hesap silme akışında kaldırılır. Ortak borç bakiyeleri korunur.
- Cihaz testleri, gerçek Android ekran görüntüleri ve test APK’sı kullanıcı kararıyla sonra yapılacak.
- Şifre sıfırlama genel Play şartı olarak doğrulanmadı; kullanıcı isteğiyle bu sürüme eklenmeyecek.

## Hazır ve doğrulananlar

| Alan                    | Sonuç                                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hesap silme             | Servis canlı; geçici hesap, ev ve gerçek fişle uçtan uca test geçti. Borç satırları değişmedi. Diğer hesap ve ev etkilenmedi. Yeniden sahiplenme ve eski JWT erişimi reddedildi.             |
| Silme arayüzü           | Kişiler/onboarding düğmesi, sonuç uyarısı ve kesilen işlemi sürdürme ekranı eklendi. Cihaz UI testi ayrı.                                                                                    |
| Silme talep sayfası     | public/delete-account/index.html; e-posta yoluyla uygulamayı kurmadan başvuru. Pages yayını ve canlı URL doğrulaması dağıtımda kontrol edilir.                                               |
| UGC asgari akışları     | Kişiler → Güvenlik ve destek: içerik/kullanıcı bildirimi, özel moderasyon kuyruğu, kullanıcı engelleme. Koşul sürümü hesapla kaydedilir, yeni istemci kabulden önce içerik ekranını açmaz.   |
| Engelleme               | Yorum SELECT RLS’i ve notify v10 alıcı filtresi sunucuda uygular. Engellenen kişinin yorumları gizlenir, başlattığı push/e-postalar kesilir. Ortak borçlar ve sistem hatırlatmaları korunur. |
| Kaynak kontrolleri      | TypeScript, ESLint, mevcut görev filtre/tarih testi, iki silme servis testi geçti. Silme ve güvenlik SQL rollback testleri geçti.                                                            |
| Yayın otomasyonu        | CI kaynak ve silme servisi testleri; web dağıtımı öncesi kaynak kontrolleri. GitHub Actions ve ayrı Pages deployment sonucu dağıtımda doğrulanır.                                            |
| Android izinleri        | Birleştirilmiş release manifestinde target API36, min API24. Overlay, geniş fotoğraf, mikrofon ve storage okuma yok. Eski kamera WRITE izni API≤28 ile sınırlı.                              |
| Production ayarları     | AAB, remote autoIncrement, ayrı preview/production ortamları ve kanalları. Public Supabase bağlantısı production profiline bağlandı; uygulamaya gizli servis anahtarı eklenmedi.             |
| Mağaza metni/görselleri | Türkçe ad/kısa/tam açıklama; özgün SVG marka; tam 512×512 ikon ve 1024×500 feature graphic. Gerçek ekran görüntüsü ertelendi.                                                                |
| Bilgi sayfaları         | privacy, terms, support, delete-account oturumsuz HTML; web export içinde bulundu. Gizlilik sayfası mevcut test durumunu açıklar, tamamlanmamış hukuki uyum beyan etmez.                     |

## Üretim için açık olanlar

1. İmzalı AAB 24 Ekim’de üretildi (1.0.0 / code 2); imza, API 36, 50 adet 64-bit ELF ve türetilen APK ZIP 16 KB kontrolleri geçti. Cihaz testi, ekran görüntüleri, Google Play kabulü ve Play App Signing eşlemesi açık.
2. Kişisel Play hesabındaki kimlik/iletişim/cihaz doğrulaması ve Console formları. Hesaba uygulanıyorsa gerçek 12 testçinin 14 gün kesintisiz kapalı teste katılması.
3. İnceleme hesabı, Data safety, IARC, finans ve reklam kimliği beyanları tamamlandı. Form kaydı Google inceleme onayı değildir. Mağaza görselleri eksik.
4. Amaç bazında hukuki sebepler, korunan finans kayıtlarının gerekçeli süresi ve sağlayıcı yurt dışı aktarım mekanizması. Kişisel verileri hemen silmek geçmiş aktarımı veya sağlayıcı log/yedeklerini ortadan kaldırmaz.
5. Operatörün destek kutusu ve content_reports kuyruğunu gerçekten takip etmesi; moderasyon/silme taleplerini sonuçlandırması. Otomatik yönetici e-postası yoktur.
6. Ayrı ev erişim kontrollerinin tüm eski RPC/Storage uçlarını kapsaması, cron/gerçek push teslimatı, tam şema baseline’ı ve izole geri yükleme.

Şu an “Play üretim yayını hazır/onaylandı” sonucu yoktur. Hazır girdiler ve kimin hangi adımı yapabileceği: [play-store-submission.md](play-store-submission.md). Silme kanıtı: [account-deletion-verification.md](account-deletion-verification.md). Moderasyon: [moderation-operations.md](moderation-operations.md).

25 Ekim Console ilerlemesi: Roomly kaydı oluşturuldu; 11 kurulum görevinin 10'u tamamlandı. Gizlilik, inceleme hesabı, reklam, hedef yaş, resmi kurum, finans, sağlık ve kategori/iletişim kaydedildi. Mağaza metinleri taslak; veri güvenliği kaynak/SDK kontrolü sonrasında kaydedildi. IARC ücretsiz olduğu resmi kaynaktan doğrulanıp kullanıcı onayıyla tamamlandı (25 Ekim 13:43). PEGI ebeveyn rehberliği, IARC Generic 12+; hedef kitle 18+ korunur. Görsel/AAB yükleme için Chrome dosya izni bekleniyor. Henüz test sürümü veya üretim yayını yok. Güncel kullanıcı adımları: [ahmet-yapilacaklar.md](ahmet-yapilacaklar.md).

Dahili test taslağı: `1.0.0 (2) - İlk dahili test`; Türkçe sürüm notları kaydedildi. Paket yüklenmediği için önizlemede üç paket hatası ve testçi eksikliği görüldü. Ek reklam kimliği beyanı “Hayır” kaydedildi; Uygulama içeriği ekranı “Tamamlanmayı bekleyen beyan yok” gösterdi. Dahili test, 12/14 gün şartının yerine geçmez. Kapalı test kurulumu mağaza eksikliği yüzünden panelde kilitli.

## 25 Ekim — dosya yükleme tamamlandı

Kullanıcı Chrome dosya URL iznini açtı. İkon (512×512) ve özellik grafiği (1024×500) mağaza taslağına yüklendi; ayrı sekmede tekrar açılıp kayıtlı oldukları doğrulandı. Telefon ekran görüntüleri hâlâ yok.

`roomly-production-20261024.aab` Google tarafından işlendi ve dahili test taslağına kaydedildi. Console 2 (1.0.0), API24+, target36, dört ABI gösterdi. Önizlemede engelleyici hata yok; iki uyarı: testçi listesi boş ve isteğe bağlı deobfuscation dosyası yok. Yerel Gradle varsayılanında minify kapalı; bu uyarı bir paket ret hatası değildir. Google indirme tahmini 30.5 MB. Henüz “Kaydet ve yayınla” uygulanmadı, dolayısıyla dağıtım/katılım süresi başlamadı.

Chrome dosya URL izni önceki onaya göre geçici kullanılmalıdır. Otomasyon güvenlik politikası uzantı ayarları sayfasına erişimi engellediğinden kullanıcı yükleme sonrası izni kapatmalıdır.

## 25 Ekim — APK ve hukuki paket

Kullanıcı güncel yerel APK istedi; testçi listesi en sona bırakıldı. Hukuki hazırlık paketi `docs/legal/README.md` altında sekiz dosya olarak hazırlandı: aydınlatma, koşullar, saklama/imha, aktarım matrisi, standart sözleşme ek hazırlığı, sağlayıcı yazışma taslakları ve başvuru prosedürü. Bunlar inceleme nüshasıdır; sağlayıcı imzası/bildirim veya yeni saklama cron'u tamamlanmış sayılmaz. Yayımdaki sayfalar bu yeni taslaklarla değiştirilmedi.

APK için native proje app.json'dan yenilendi (güncel Roomly ikonu ve izinler). Yalnız yerel/ignore kapsamındaki Android projede `roomlyFeatureTestBuild` ile `.featuretest` paket eki uygulanır; mağazadaki `com.anonymous.roomly` paketi değiştirilmez. Firebase servis hesabı veya özel anahtar eklenmedi. APK raporu derleme sonrasında ayrı teslim edilir; gerçek cihaz kullanımı kullanıcı tarafından yapılacak.
