# Google Play — hazır girdiler ve kalan adımlar

25 Ekim 2026. Kurulum formlarının 10/11 adımı Console’da kaydedildi; mağaza görselleri eksik. Google incelemesine veya üretime gönderim yapılmadı. Sahte testçi, yapılmamış cihaz testi veya tamamlanmamış hukuki uyum beyan edilmez.

## Hazır girdiler

- Uygulama: Roomly; paket: com.anonymous.roomly.
- Geliştirici gösterimi: Ahmet Aydemir; destek: caludebabaq@gmail.com.
- Ücretsiz, reklamsız, Türkiye; hedef kitle 18 yaş üzeri. IARC derecelendirmesi ayrıca gerçek içerik ve etkileşimlere göre doldurulmalı.
- Ad/kısa/tam açıklama: `play-store-listing-tr.md` (6/80/1092 karakter).
- 512×512 ikon: `play-store-assets/icon-512.png`.
- 1024×500 tanıtım görseli: `play-store-assets/feature-graphic-1024x500.png`.
- Görseller özgün SVG kaynaklarından üretildi; üçüncü taraf stok görsel veya dağıtılan yeni font yok.
- Silme talebi: https://ahmetna.github.io/roomly/delete-account/
- Destek: https://ahmetna.github.io/roomly/support/
- Koşullar: https://ahmetna.github.io/roomly/terms/
- Veri bilgileri: https://ahmetna.github.io/roomly/privacy/ — mevcut test sürümünü açıklar; üretim için hukuki sebepler/aktarım/saklama konusu henüz tamamlanmış sayılmaz.

## Data safety hazırlığı

| Veri                             | Gerçek davranış                                           | Formda değerlendirilecek tür                                             |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| E-posta, isim, hesap kimliği     | Auth ve ev üyeliği; zorunlu hesap, profil/ev içi paylaşım | Personal info: name, email, user IDs                                     |
| IBAN                             | İsteğe bağlı, ev üyelerine görünür                        | Financial info / payment info                                            |
| Harcama, ödeme ve borç           | Sunucuda işlenir; ev üyeleri görür                        | Financial info / purchase history / other financial info                 |
| Fiş                              | İsteğe bağlı özel Storage; ev üyeleri görür               | Photos                                                                   |
| Liste/görev/yorum                | Ev içi kullanıcı içeriği                                  | Other user-generated content; mesaj sınıfını kullanımına göre kontrol et |
| Token ve bağlantı kayıtları      | Expo/FCM ve altyapı teslimatı                             | Device or other IDs; sağlayıcı IP/log kapsamı ayrıca                     |
| Şikâyet, engelleme, koşul kabulü | Kullanıcı tercihleri ve güvenlik                          | Other app activity / user-generated content bağlamına göre               |

Veri toplama “evet”; “veri satılmıyor” ile “hiç paylaşım yok” eşit değildir. Hizmet sağlayıcı ve kullanıcının başlattığı ev içi paylaşım istisnalarını Google’ın form açıklamasıyla eşleştir. Aktarım şifrelemesi HTTPS; final AAB’de tekrar kontrol et. Hassas veriler için “opsiyonel” işaretini yalnız fiilen opsiyonel alanlarda kullan.

## Benim tamamlayabildiklerim

- Kaynak değişiklikleri, URL’ler ve Pages dağıtımı; metin ve görsel dosyaları.
- Şema/izin ve uygulama testleri; örnek hesap/evle sunucu akışlarını doğrulama.
- İmzalı AAB 24 Ekim’de mevcut EAS anahtarıyla üretildi; imza/manifest/16 KB yapısal kontrolleri geçti. Cihaz testi ve Google Play kabulü henüz yapılmadı. Tarayıcıdan yükleme için servis hesabı gerekmez.
- Console’a erişim sağlandığında taslak form doldurma ve yüklemeye yardım; son beyanlar gerçek bilgilerle doğrulanır.

## Ahmet’in katılımını gerektirenler

1. Kişisel Play hesabındaki kimlik/iletişim ve gerçek cihaz doğrulaması.
2. Mevcut uygulama kaydı ve Play App Signing/upload-key durumunu Console’dan teyit.
3. Gerçek Android release ekran görüntüleri ve cihaz kullanımı (kullanıcı kararıyla ertelendi).
4. Hesaba uygulanıyorsa en az 12 testçinin 14 gün kesintisiz kapalı test katılımı. Testçiler ve gerçek kullanım yerine geçecek otomatik işlem yapılamaz.
5. Başvuru, Data safety, finansal özellik ve IARC cevaplarının gerçek durumla son kontrolü. Harcama/borç takibi için “finansal özellik yok” otomatik seçilmez.
6. Hukuki sebep/sağlayıcı aktarım sözleşmesi ve korunan finans kayıtları için saklama dayanağı. “Kişisel verileri hemen sil” kararı geçmiş aktarımı veya sağlayıcı loglarını ortadan kaldırmaz.

## Kapsam kararı

Şifre sıfırlama için incelenen Play politikalarında genel açık zorunluluk bulunmadı; kullanıcı isteğiyle bu sürüme eklenmedi. UGC politikasında kapalı gruplar için içerik/kullanıcı bildirimi, kişiye özel etkileşim için engelleme ve içerik üretmeden önce koşul kabulü açıkça istendiğinden bu akışlar eklendi.

Kaynaklar: [UGC](https://support.google.com/googleplay/android-developer/answer/9876937), [hesap silme](https://support.google.com/googleplay/android-developer/answer/13327111), [kişisel hesap testi](https://support.google.com/googleplay/android-developer/answer/14151465), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469).

25 Ekim: Roomly kaydı mevcut. IARC ve veri güvenliği dahil on kurulum adımı tamamlandı. İnceleme hesabı hazır; giriş bilgileri kamuya açık repoda tutulmaz. [Veri güvenliği incelemesi](data-safety-audit.md), [kullanıcı adımları](ahmet-yapilacaklar.md).
