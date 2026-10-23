# Android yayın hazırlığı — güncel durum

23 Ekim 2026, Europe/Istanbul. Kaynak plan: [android-launch-plan.md](android-launch-plan.md).

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

1. Kullanıcının ertelediği cihaz testi, gerçek Android ekran görüntüleri; imzalı final AAB, upload key/Play App Signing, 64-bit ve 16 KB/Play ön kontrolü.
2. Kişisel Play hesabındaki kimlik/iletişim/cihaz doğrulaması ve Console formları. Hesaba uygulanıyorsa gerçek 12 testçinin 14 gün kesintisiz kapalı teste katılması.
3. İnceleme hesabı, Data safety, IARC ve finansal özellik beyanının gerçek release/Console seçenekleriyle son kontrolü.
4. Amaç bazında hukuki sebepler, korunan finans kayıtlarının gerekçeli süresi ve sağlayıcı yurt dışı aktarım mekanizması. Kişisel verileri hemen silmek geçmiş aktarımı veya sağlayıcı log/yedeklerini ortadan kaldırmaz.
5. Operatörün destek kutusu ve content_reports kuyruğunu gerçekten takip etmesi; moderasyon/silme taleplerini sonuçlandırması. Otomatik yönetici e-postası yoktur.
6. Ayrı ev erişim kontrollerinin tüm eski RPC/Storage uçlarını kapsaması, cron/gerçek push teslimatı, tam şema baseline’ı ve izole geri yükleme.

Şu an “Play üretim yayını hazır/onaylandı” sonucu yoktur. Hazır girdiler ve kimin hangi adımı yapabileceği: [play-store-submission.md](play-store-submission.md). Silme kanıtı: [account-deletion-verification.md](account-deletion-verification.md). Moderasyon: [moderation-operations.md](moderation-operations.md).
