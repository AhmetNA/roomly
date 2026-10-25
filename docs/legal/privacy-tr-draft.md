# Roomly — Gizlilik ve kişisel veriler hakkında aydınlatma

Sürüm: **2026-10-25 inceleme nüshası**. Yayımdaki metnin yerine henüz geçirilmemiştir. Aktarım güvencesi ve saklama uygulaması için [paket durumunu](README.md) okuyun.

## 1. Sorumlu ve kapsam

Roomly uygulama sorumlusu **Ahmet Aydemir**; destek ve kişisel veri başvuruları **caludebabaq@gmail.com**. Resmi kimlik ve gerekli başvuru/tebligat bilgileri yayından önce doğrulanacaktır; bu nüshada doğrulanmamış bir adres verilmez.

Roomly, 18 yaş ve üstündeki ev arkadaşlarının harcamalarını, ihtiyaçlarını ve görevlerini takip etmek için hazırlanır. Hizmet ücretsiz ve reklamsızdır. Banka hesabına bağlanmaz; para transferi, kredi, tahsilat veya yatırım hizmeti vermez.

## 2. Hangi veriler, nasıl toplanır?

- **Hesap:** E-posta, hesap kimliği, giriş yöntemi ve seçilirse Google hesabından uygulamaya dönen profil bilgileri. Şifre ile giriş Supabase Auth üzerinden yürür; şifrenizi destek adresine göndermeyin.
- **Ev ve üyeler:** Ev/üye adı, davet kodu, hesap bağlantısı ve isteğe bağlı IBAN. Bir üye hesabı olmayan kişiyi de ekleyebilir; yalnız gerekli, paylaşmaya yetkili olunan bilgileri kullanmalıdır.
- **Ortak kayıtlar:** Harcama, para birimi, bölüşüm, borç, ödeme kaydı, açıklama ve içerik satırları; ortak ve görünür kişisel listeler; görev, sorumlu, durum, son tarih ve yorumlar.
- **Fiş:** Kullanıcı seçerse kamera veya sistem seçicisiyle yüklenen görüntü. Kimlik, sağlık, açık kart bilgisi ve gereksiz üçüncü kişi bilgisini yüklemeyin; yüklemeden önce çıkarın.
- **İletişim ve güvenlik:** Bildirim tokenı/dil, koşul sürümü ve kabul zamanı, içerik raporu, engelleme tercihi, destek talebi ve silme işlemi durumu.
- **Teknik:** Bağlantı/IP ve kimlik doğrulama kayıtları, platform/uygulama sürümü, EAS/Firebase kurulum kimliği, güncelleme bilgisi ve oluştuğunda hata/tanı bilgisi. Uygulamada reklam SDK'sı yoktur; kurulum kimliği reklam kimliği değildir.

Veriler formlardan, kullanıcı işlemlerinden, dosya seçiminden, giriş sağlayıcısından ve hizmet bağlantılarından elektronik olarak elde edilir. Cihazdan veri alınması, sunucuda saklanmasa bile veri işleme olabilir. Konum özelliği, rehber içeriği, mikrofon kaydı veya geniş fotoğraf arşivi taraması bu sürümde kullanılmaz.

## 3. Amaçlar ve hukuki sebep değerlendirmesi

Aşağıdaki eşleştirme operatörün gerçek işlemine göre yayından önce kesinleştirilir; aydınlatmayı okumak veya koşulu kabul etmek bütün işlemlere açık rıza sayılmaz.

| Amaç                                                                 | Gerekli veri                                 | Değerlendirilen KVKK şartı                                                           |
| -------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Hesap, ev erişimi ve ortak kayıt hizmeti                             | Hesap, üye ve ortak kayıt                    | m.5/2(c): tarafın talep ettiği hizmetin kurulması/ifası için gereklilik              |
| Kullanıcının seçtiği fiş, IBAN, yorum ve bildirim özelliği           | Yalnız seçilen özellik verisi                | Özelliğin ifası için gereklilik; isteğe bağlılık korunur, gereksiz veri istenmez     |
| Güvenlik, kötüye kullanım ve teknik işletim                          | Asgari log, kurulum kimliği, rapor ve tercih | m.5/2(f): hak/özgürlükleri gözeten, gerekliliği belgelenmiş meşru menfaat            |
| Destek ve hak başvurusu                                              | İletişim, talep ve doğrulama kaydı           | Somut başvuruda m.5/2(ç) hukuki yükümlülük ve/veya m.5/2(e) hak koruma               |
| Hesap silindikten sonra diğer üyelerin finansal haklarının korunması | Kimlik bağı kaldırılmış asgari finans satırı | Somut gereklilik varsa m.5/2(e); otomatik ve sınırsız bir saklama yetkisi oluşturmaz |

Hesabı olmayan kişinin verisi, o kişi sözleşmenin tarafıymış gibi m.5/2(c)'ye bağlanmaz; alternatif şart ve bilgilendirme yükümlülüğü ayrıca değerlendirilir. Yetkiniz olmayan gerçek kişi bilgisi yerine tanınabilirliği azaltılmış ad kullanın. Özel nitelikli veri işlemek hizmetin amacı değildir; böyle veri istenmez.

## 4. Verileri kimler görebilir?

Aynı eve katılan üyeler ortak kayıtları, görünür kişisel listeleri, IBAN'ı ve fişleri görebilir; ortak harcama/liste/görevleri yönetebilir. Kişisel liste “gizli” demek değildir. Davet kodunu yalnız erişim vermek istediğiniz kişilerle paylaşın. Sahipsiz üyeyi sahiplenmek ilgili geçmişe erişim sağlar; silinen hesap arşivi sahiplenilemez.

Fişler özel depodadır; yetkili kullanıcıya süreli erişim bağlantısı verilir. Bağlantıyı veya fişin kopyasını başkalarına iletmeyin. Şikâyet açıklaması ve kişisel engelleme tercihi diğer üyelere açılmaz; yetkili operatör başvuruları inceler.

## 5. Hizmet sağlayıcılar ve yurt dışı

Supabase hesap/veritabanı/özel dosya/eşitleme; Expo güncelleme/push; Google giriş ve Firebase/FCM teslimat; yapılandırılmış Gmail SMTP görev e-postası; GitHub Pages kamuya açık bilgi sayfaları için kullanılır. Supabase uygulama projesi `eu-central-1` bölgesindedir; bu, bütün alt işlemlerin veya bütün alıcıların aynı ülkede bulunduğu anlamına gelmez.

[Sağlayıcı matrisi](international-transfers-tr.md), veri sınıfları ve işlem rollerini gösterir. Uygulanabilir Türk aktarım mekanizmasına ilişkin imza/bildirim kanıtı henüz tamamlanmamıştır. Bu inceleme nüshası tamamlanmış aktarım güvencesi beyan etmez. Hesap silmek, gerçekleşmiş aktarımı geriye dönük ortadan kaldırmaz.

## 6. Saklama ve hesap silme

Hesap aktifken kayıtlar hizmetin çalışması için tutulur. Uygulamadan çıkmak veya evden ayrılmak hesap silme değildir. Hesap silme uygulamadan veya [başvuru sayfasından](https://ahmetna.github.io/roomly/delete-account/) başlatılabilir.

Hesaba bağlanabilen kişisel alanlar için ilave bekletme uygulanmaz: silme işlemi üye adı/IBAN ve hesap bağını temizler, yorumları, ilgili listeleri, görev metinlerini, kullanıcı fişlerini/tokenlarını ve Auth hesabını kaldırır. Ağ/dosya temizliği hatasında işlem tekrar denenir; işlem tamamlanmadıysa sonuç kesin silinme olarak sunulmaz.

Diğer üyelerin bakiyelerini değiştirmemek için asgari finansal üye kimliği, harcama, bölüşüm, borç ve ödeme satırları “Silinen hesap” olarak kalır. Bu satırlar tam anonim veri sayılmaz. Ortak açıklamalar ve eski bağlantısız üyeler için kayıt bazında inceleme gerekir. Yetkili başvuru ve gereksiz kişisel metinler ayrıca değerlendirilir; haklar somut veri için kullanılabilir.

Sağlayıcı log/yedekleri ve daha önce teslim edilmiş e-posta veya kullanıcıların aldığı kopyalar eşzamanlı geri çağrılamaz. [Saklama tablosu](retention-and-deletion-tr.md) bugünkü davranışla önerilen yeni süreleri ayrı gösterir; henüz uygulanmayan otomatik süre taahhüt edilmez.

## 7. Haklar ve başvuru

Kanunun 11. maddesi kapsamında verinizin işlenip işlenmediğini öğrenme, işleniyorsa bilgi isteme, amacını/amacına uygun kullanımını ve alıcılarını öğrenme; yanlış/eksik verinin düzeltilmesini veya şartları oluştuğunda silinmesini/yok edilmesini isteme; bu işlemlerin alıcılara bildirilmesini isteme; yalnız otomatik analizle aleyhinize sonuca itiraz ve hukuka aykırı işleme nedeniyle zararın giderilmesini talep haklarınız bulunur.

Başvuruyu kayıtlı e-posta adresinizle **caludebabaq@gmail.com** adresine, “Roomly kişisel veri başvurusu” konusuyla iletebilirsiniz. Kimlik doğrulama somut talebe uygun, asgari veriyle yapılır. Şifre, OTP veya ilgisiz kimlik belgesi göndermeyin. Kanuni başvuru usulleri ve Kurula şikâyet hakkı saklıdır. Usulüne uygun talepler en kısa sürede ve en geç 30 gün içinde sonuçlandırılır; ilave maliyet halinde yalnız mevzuattaki ücretlendirme şartları uygulanabilir.

## Resmi kaynaklar

- [Aydınlatma yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-)
- [İşleme şartları](https://www.kvkk.gov.tr/Icerik/2050/Kisisel-Veriler)
- [İlgili kişinin hakları](https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari)
- [Başvuruların cevaplanması](https://www.kvkk.gov.tr/Icerik/2046/Ilgili-Kisiler-Tarafindan-Yapilan-Basvurularin-Cevaplanmasi-Yukumlulugu)
- [Yurt dışına aktarım](https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim)
