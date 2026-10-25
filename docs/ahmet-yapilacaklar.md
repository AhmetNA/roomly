# Roomly — Ahmet’in tamamlayacağı adımlar

Güncelleme: 25 Ekim 2026. Amaç, senin yapman gerekenlerle benim bilgisayardan yapabileceklerimi ayırmak.

## Şu anda gerçekten doğrulanan durum

- Roomly uygulama kaydı kullanıcı tarafından oluşturuldu. Console kurulum panelinde 11 görevin 10'u tamamlandı.
- Kaydedildi: gizlilik URL'si, inceleme erişimi, reklamsız beyanı, 18+ hedef kitle, resmi kurum değil, sağlık özelliği yok, finans için diğer (yalnız ortak harcama/borç kaydı), Verimlilik kategorisi ve destek iletişimi.
- Ayrı inceleme hesabı normal Supabase kayıt API'siyle oluşturuldu. Giriş doğrulandı; yalnız kendi örnek evine erişti. İki örnek üye, bir harcama, iki liste ürünü ve bir görev hazır. Kimlik bilgileri yalnız gitignore kapsamındaki `.secrets/` altında ve Play inceleme erişiminde; kamuya açık dosyalarda bulunmaz.
- Google/güvenilir iş ortağı cihazlarında ek test için varsayılan açık seçenek kapatılıp kaydedildi; gerekli inceleme erişimi korunur.
- Türkçe mağaza açıklamaları taslak kaydedildi. İkon ve özellik grafiği yüklendi ve kayıtları doğrulandı; gerçek Android ekran görüntüleri henüz yüklenmedi.
- Veri güvenliği formu kaynak/SDK ve resmi sağlayıcı belgeleriyle kontrol edilip kaydedildi. Expo kurulum kimliği ve hata teşhisi eklendi. İnceleme: [data-safety-audit.md](data-safety-audit.md).
- İmzalı AAB Play'e yüklendi, işlendi ve dahili test taslağına kaydedildi; dağıtım başlatılmadı. Servis hesabı/JSON zorunlu değil.
- Kimlik/telefon/cihaz doğrulamaları için yalnız Console görev gösterirse işlem gerekir.

## 1. Dosya yükleme izni ve hazır durum

1. Chrome → Uzantılar → ChatGPT → Ayrıntılar → **Dosya URL'lerine erişime izin ver** seçeneğini aç. Geçici izin kullanıcı tarafından onaylandı ancak otomasyon güvenlik politikası `chrome://extensions/` sayfasını açmayı engelledi. İkon/feature graphic/AAB yüklemesinden sonra bu ayar yeniden kapatılmalı. Sistem dosya seçicisiyle deneme de yüklemeyi tamamlayamadı.
2. IARC tamamlandı: kullanıcı ücretsiz olması koşuluyla kabulü onayladı; resmi IARC FAQ ile ücretsiz olduğu doğrulandı. 25 Ekim 2026 13:43 Console durumu Tamamlandı. Avrupa PEGI ebeveyn rehberliği; IARC Generic 12+. Hedef kitle seçimi 18+ olarak korunuyor. Sertifika kimliği henüz Console’da “-”.

Uygulama oluşturma beyanları önceki adımda kullanıcı tarafından tamamlandı; yeniden yapılmayacak. IARC özel onayı da alınıp uygulandı; bu anlaşma için yeniden onay gerekmiyor.

## 2. Google isterse: kişisel hesap doğrulaması

Play Console → Ana Sayfa veya Hesabı yönetme → Hesap ayrıntıları bölümünde Google eksik doğrulama gösterirse:

- E-posta/SMS kodunu kendi ekranında gir. Kodları bu sohbete yazma.
- Kimlik belgesi isterse yalnız Google’ın resmi doğrulama ekranına yükle. Bana kimlik fotoğrafı göndermen gerekmiyor.
- Android cihaz doğrulaması gösterirse webdeki “Android mobil cihaza erişiminiz olduğunu doğrulayın” görevini aç; QR ile resmi Play Console mobil uygulamasını aç/kur; geliştirici hesabının sahibi olan aynı Google hesabıyla giriş yapıp ekrandaki Doğrula adımını tamamla.
- Bu doğrulama için root edilmemiş, Android 10 veya üstü gerçek bir Android telefon kullanılabilir. Mac veya emülatör bunun yerine geçmez.

Görev görünmüyorsa yapılmış olabileceği için yeniden yapmaya çalışma. “Doğrulama gerekiyor mu?” sorusunun kesin cevabı Console’daki görev durumudur.

## 3. Kapalı test için gerçek gönüllüler bul

Yeni kişisel hesaplara ilişkin güncel Google şartı: en az 12 kişi, en az 14 gün kesintisiz kapalı teste kayıtlı olmalı. Hesabının yaklaşık dört aylık olduğu bilgisi bu kapsamı işaret ediyor; Roomly kaydı açıldıktan sonra uygulama panelindeki şartı da kontrol edeceğim.

Senin yapacağın:

1. Android telefonu ve Google hesabı olan en az 12 gerçek gönüllü bul. Birkaç yedek kişi olması iyi olur.
2. Gönüllülerin Google hesabı e-posta adreslerini kendi testçi listende tut; herkese açık GitHub’a koyma.
3. Ben kapalı test sürümünü ve katılım bağlantısını hazırladıktan sonra bağlantıyı gönüllülere ulaştır.
4. Herkes bağlantıdan teste katılmalı ve uygulamayı Play’den kurup gerçekten denemeli. Testte en az 14 gün kesintisiz kayıtlı kalmalılar; bu, telefonun sürekli açık olması demek değildir.
5. Hangi akışta sorun yaşadıklarını ve geri bildirimlerini topla. Üretim erişimi başvurusunda gerçek test sürecini anlatacağız.

Dışarıdan APK göndermek Google’ın kapalı test şartını karşılamaz. Test başlamadan önceki günler bu 14 güne dahil değildir. Sahte hesap/testçi veya yapılmamış kullanım beyanı oluşturmayacağım. Testçileri ben senin yerine gerçek katılımcı yapamam.

## 4. Daha sonra: gerçek Android kullanım testi

Bunu daha önce erteledin; şu an hemen telefon testi yapmanı istemiyorum. Yayına yaklaşırken birlikte yapılacak:

- Play’den kurulum, açılış, çıkış ve tekrar giriş.
- E-posta ve Google girişi.
- Harcama/borç, liste, görev ve yorum işlemleri.
- Kamera/galeri ve bildirim izni reddedildiğinde davranış.
- Push bildiriminin doğru kişiye ulaşması.
- Geçici bir hesapla hesap silme ve diğer ev üyelerinin bakiyelerinin korunması.
- Görsel taşma, açık/koyu tema; gerçek kişisel veri içermeyen örnek evden mağaza ekran görüntüleri.

Test bağlantısını ve test sırasını ben hazırlayabilirim. Hata gelirse loglarını inceleyip düzeltmeyi ben yapabilirim. Fiziksel telefonda gerçekten ne olduğunu görmeden testi geçmiş sayamam.

## 5. Yayın öncesi: veri işleme konusunda açık kalan karar

Uygulamanın veritabanı Türkiye dışında; Google/Expo gibi kullanılan servisler de yurt dışında işlem yapabilir. “Hesap silinince kişisel veriler hemen kaldırılsın” kararını uyguladık; bu, önceki yurt dışı aktarımı veya sağlayıcının log/yedek kopyalarını geriye dönük yok etmez.

Benim hazırlayabileceğim: hangi verinin hangi sağlayıcıya gittiği, teknik silme/saklama davranışı, sözleşme ve metin eksikleri.

Senin sorumluluğunda netleşecek: bu servislerle kullanıcıya hizmet sunmak için uygulanabilir hukuki sebep ve yurt dışı aktarım mekanizması; korunan ortak finans kayıtlarının gerekçeli saklama düzeni. Sağlayıcıların uygun sözleşmeyi yapıp yapmadığı ve gerekiyorsa uzman değerlendirmesi ayrıca ele alınmalı. Bu, Console’da “evet” seçerek çözülen bir ayar değildir.

Gizlilik sayfası şu an bu değerlendirmenin tamamlandığını iddia etmiyor. Bu açık madde kapanmadan “tüm hukuki uygunluk tamam” diye Google’a veya kullanıcıya beyan vermeyeceğim.

## 6. Yayın sonrası: destek ve içerik bildirimleri

- caludebabaq@gmail.com kutusunu düzenli kontrol edecek kişi belli olmalı; mevcut durumda uygulama sorumlusu sensin.
- Kullanıcıların hesap/veri silme ve destek başvuruları bu adrese gelir. Kimlik doğrulamadan başkasının hesabını silme.
- Uygulama içi içerik bildirimleri Supabase’de content_reports kuyruğuna düşer. Şu an ayrı bir otomatik yönetici e-postası yok; bu kuyruğun da düzenli kontrol edilmesi gerekir.
- Teknik inceleme ve silme/düzeltme işlemlerinde yardımcı olabilirim. Sürekli insan moderasyonu yapılmış gibi otomatik sonuç yazmayacağım.

## Benim yapacağım, sana devretmediğim işler

Roomly uygulama kaydı açıldıktan sonra tarayıcı erişimiyle şunları yapabilirim:

- AAB dosyasını yüklemek, Google’ın dosya/imza kontrollerini okumak ve teknik hataları çözmek.
- Hazır uygulama adı/açıklaması, ikon ve tanıtım görselini ilgili alanlara girmek.
- Gizlilik, destek ve hesap silme bağlantılarını eklemek.
- Gerçek özelliklere göre Data safety, reklam yok, hedef kitle, içerik derecelendirme ve finansal özellik cevaplarını taslak olarak hazırlamak; soruları sana anlaşılır biçimde açıklamak.
- İnceleyici için örnek hesap/ev ve erişim yönergesini hazırlamak; şifreyi herkese açık dosyalara koymamak.
- Testçi listesini ve test sürümünü düzenlemek; katılım bağlantısını hazırlamak.
- Gerçek test sonuçlarına dayanarak üretim erişimi başvurusu taslağını hazırlamak.

Hukuki onay, yeni güvenlik yetkisi veya kullanıcıya ait hassas belge aktarımı çıkarsa o somut adımda durup açıklayacağım. Kendi adına karar vermen gereken resmi beyanları, yapılmamış testleri ve Google’ın onayını ben senin yerine tamamlanmış sayamam.

## Hazır dosya ve bağlantılar

- AAB: `/Users/ahmetna/Downloads/roomly-production-20261024.aab` — 1.0.0 / versionCode 2.
- Rapor: `/Users/ahmetna/Downloads/roomly-production-20261024-rapor.txt`.
- Mağaza açıklamaları: `docs/play-store-listing-tr.md`.
- İkon: `docs/play-store-assets/icon-512.png`.
- Tanıtım görseli: `docs/play-store-assets/feature-graphic-1024x500.png`.
- Gizlilik: https://ahmetna.github.io/roomly/privacy/
- Hesap silme: https://ahmetna.github.io/roomly/delete-account/
- Destek: https://ahmetna.github.io/roomly/support/
- Koşullar: https://ahmetna.github.io/roomly/terms/

## Resmi kaynaklar

- Uygulama oluşturma ve beyanlar: https://support.google.com/googleplay/android-developer/answer/9859152
- Yeni kişisel hesaplarda kapalı test: https://support.google.com/googleplay/android-developer/answer/14151465
- Android cihaz doğrulaması: https://support.google.com/googleplay/android-developer/answer/14316361
- Kimlik ve iletişim doğrulaması: https://support.google.com/googleplay/android-developer/answer/10841920
- KVKK yurt dışına aktarım: https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim

## 25 Ekim son kontrol

- Bütün uygulama içerik beyanları kaydedildi; Console bekleyen beyan göstermiyor. Kaydetme, Google incelemesi veya hukuki uygunluk onayı değildir.
- Dahili test taslağı ve sürüm notları kaydedildi; AAB yükleme dosya iznine takılıyor. Tekrarlanan dosya yükleme denemesi izin henüz kapalıyken yine reddedildi.
- Görsel yükleme izni açıldığında ikon, özellik grafiği ve AAB'yi ben yükleyebilirim. En az iki gerçek Android ekran görüntüsü ayrıca gerekiyor. Bunları mevcut release'ten örnek ev kullanarak hazırlamalıyız; web ekranını Android ekranı gibi sunmayacağız.
- Sonrasında testçilerin Google hesap e-postaları özel testçi listesine eklenecek. Kapalı testin katılım bağlantısı henüz oluşmadı; sürüm dağıtılmadan 14 günlük süre başlamaz.

## En son durum — yükleme engeli kapandı

İkon, tanıtım görseli ve AAB yüklemeleri tamamlandı. Artık dosya izni açman veya dosyaları kendin yüklemen gerekmiyor. ChatGPT uzantısındaki geçici “Dosya URL'lerine erişime izin ver” seçeneğini kapatabilirsin; ayar sayfasına otomasyon erişimi engellendiği için kapatmayı kendin yapmalısın.

Kalan somut girdiler: en az iki gerçek Android ekran görüntüsü, özel testçi listesine eklenecek gerçek katılımcıların Google hesap adresleri, gerçek cihaz denemesi ve önceki hukuki aktarım/saklama düzenlemesi. Console hâlen 10/11: kalan adım mağaza ekran görüntüleridir. Bu maddelerin yapıldığı genel ifadeden varsayılmadı; görüntüler veya testçi adresleri henüz mevcut dosyalarda/Console'da görülmedi.

## Son kapsam kararı

Testçi listesi kullanıcı isteğiyle en sona bırakıldı. Şu an ekran görüntüleri için güncel APK hazırlanıyor. Hukuki metinleri kullanıcıdan yazması istenmiyor; paket hazırlanmış durumda: [hukuki hazırlık](legal/README.md). Yalnız gerçek sorumlu/imza bilgileri, sağlayıcı sözleşmesinin fiilen kurulması ve uygulanacak yeni saklama tercihleri operatör katılımı gerektirir.
