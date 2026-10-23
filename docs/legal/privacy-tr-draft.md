# Roomly — Gizlilik ve kişisel veriler hakkında aydınlatma taslağı

**Çalışma taslağı; yayımlanmamalı.** Sürüm: 2026-10-23-draft. Amaç bazında hukuki sebepler, yurt dışı aktarım yöntemi, başvuru için gerekli tam kimlik/iletişim bilgileri ve kategori bazında saklama süreleri tamamlanmadan nihai aydınlatma metni değildir.

## Sorumlu ve iletişim

Uygulama sorumlusu: **Ahmet Aydemir**. Destek ve veri başvuruları: **caludebabaq@gmail.com**. Bu gösterim adı kullanıcı tarafından seçilmiştir; hukuki metinde tam yasal kimlik ve gerekli başvuru bilgilerinin yeterliliği ayrıca doğrulanmalıdır.

## Uygulama ve veriler

Roomly, 18 yaş üzeri kullanıcıların ortak ev harcamalarını, ihtiyaç listelerini ve görevlerini takip etmesi için hazırlanır. İlk yayın Türkiye, ücretsiz ve reklamsız olarak planlanmıştır. Roomly para transferi yapmaz veya banka hesabına bağlanmaz.

- Hesap: e-posta, kullanıcı kimliği ve giriş yöntemi; Google ile giriş seçilirse sağlayıcının girişte paylaştığı profil bilgileri. Şifre yönetimi Supabase Auth tarafından yürütülür.
- Ev ve kişiler: ev adı, davet kodu, üye adları ve isteğe bağlı IBAN. Hesabı bulunmayan kişilerin adları da diğer ev üyelerince eklenebilir.
- Ortak kayıtlar: harcama tutarları, para birimi, bölüşümler, ödemeler, borç kayıtları, açıklamalar, ihtiyaç listeleri, görevler ve yorumlar.
- Fişler: kullanıcı seçerse kamera veya sistem fotoğraf seçicisiyle yüklenen fotoğraflar. Kimlik, sağlık verisi, açık kart bilgileri gibi gereksiz bilgileri yüklemeyin; fişi yüklemeden önce bunları çıkarın.
- Bildirim: bildirim izni, teslimat token’ı ve dil. Görev uyarılarında e-posta gönderimi de kullanılabilir.
- Teknik bilgiler: sağlayıcıların bağlantı, kimlik doğrulama, güvenlik ve dağıtım sırasında işlediği IP/işlem logları ve uygulama güncellemesi istekleri. Kesin kapsam ve süreler sağlayıcı ayarlarıyla ayrıca eşleştirilecektir.

Veriler, kullanıcının formlara yazması, dosya seçmesi, giriş sağlaması ve uygulama/sağlayıcı bağlantıları yoluyla elektronik olarak elde edilir. Hesap ve ev erişimi sağlama, kayıtları hesaplama/paylaşma, bildirim teslimi, destek ve güvenlik amaçları ayrı ayrı hukuki sebep değerlendirmesine bağlanacaktır.

## Kimler görebilir?

Aynı evin üyeleri ortak verileri görebilir ve ilgili kayıtları yönetebilir. Kişisel ihtiyaç listeleri de aynı evin üyelerine görünür; gizli liste değildir. IBAN diğer ev üyelerince okunabilir. Fişler özel Storage alanındadır; yetkili ev üyeleri süreli bağlantı alabilir. Süreli bağlantıyı alan kişi, geçerlilik süresince kullanabilir; bağlantıların dışarı paylaşılmaması gerekir.

## Altyapı ve yurt dışı aktarım

Supabase Auth/veritabanı/Storage/Realtime, Expo dağıtım ve push altyapısı, Google OAuth/FCM ve yapılandırılmışsa Gmail SMTP kullanılır. Canlı Supabase projesinin bölgesi **eu-central-1** olarak doğrulanmıştır. Bu bölge bilgisi, tüm sağlayıcı işlemlerinin tek ülkede kaldığını veya aktarım yükümlülüklerinin karşılandığını göstermez. Sağlayıcı, alt işleyen, ülke ve uygulanabilir aktarım mekanizması matrisi tamamlanacaktır.

## Saklama, silme ve haklar

Hesaptan çıkmak veya evden ayrılmak hesabı silmez. Mevcut evden ayrılma işlemi hesap/IBAN bağını kaldırıp üye ve ortak kayıtları korur. Yeni hesap silme servisi geçici hesap ve fişle canlı testten geçti. Hesaba bağlanabilen üyelerin adı/IBAN’ı, yorumları, liste içerikleri, görev metinleri, fişleri ve bildirim token’ları temizlenir; Auth hesabı silinir. Borç, bölüşüm ve ödeme kayıtları “Silinen hesap” adıyla korunur ve bu üye yeniden sahiplenilemez. Tarihî bağlantısız üye kayıtları ile ortak açıklamalar ayrıca incelenir. Korunan finans kayıtları ve sağlayıcı log/yedekleri için gerekçeli süreler hâlâ netleştirilmelidir; bu taslak kesin süre taahhüt etmez.

Erişim, düzeltme ve silme başvuruları destek adresine iletilebilir. Başvuru sahipliği, gereksiz kimlik belgesi toplamadan uygun şekilde doğrulanmalıdır. Şifre veya ödeme bilgisi gönderilmemelidir. Kanuni hakların kapsamı ve başvuru usulü nihai metinde tamamlanacaktır.

## Yayın öncesi tamamlanacaklar

1. Amaç başına somut hukuki sebep ve veri minimizasyonu.
2. Sağlayıcılar/alt işleyenler ve yurt dışı aktarım mekanizması/sözleşmeleri.
3. Hesap, finans kaydı, fiş, yorum, token, log ve yedek için gerekçeli süre ve silme yöntemi.
4. Gerçekte çalışan hesap silme ve başvuru prosedürü; anonimleştirme sonrası yeniden sahiplenmenin önlenmesi.
5. Nihai metinle aynı davranışı gösteren release ve Data safety cevapları.

Kaynaklar: [KVKK aydınlatma yükümlülüğü](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-), [Google Play kullanıcı verileri](https://support.google.com/googleplay/android-developer/answer/10144311).
