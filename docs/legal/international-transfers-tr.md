# Roomly yurt dışı aktarım matrisi

25 Ekim 2026. Gerçek hizmet akışları esas alındı. “Hazır” bir imza veya yeterlilik kararı varsayılmadı. Alıcıların tam ticari unvanı, temsilcileri ve adresleri ilgili hesap/sözleşme üzerinden teyit edilmeden imza metnine kesin bilgi olarak geçirilmemeli.

| Akış / alıcı                            | Veri ve amaç                                                                       | Rol değerlendirmesi                                                                           | Kanıt / açık işlem                                                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase, eu-central-1 uygulama projesi | Auth, üye/finans/liste/görev/rapor, fiş, token; barındırma/eşitleme                | Roomly kullanıcı verisinde işleyen; kendi hesap/kurumsal verisi ayrı                          | DPA ve güncel alt işleyen listesi mevcut. Türkiye standart sözleşme kabulü, taraf/ülke ve fiili log/yedek süreleri ayrıca doğrulanacak                                                 |
| Expo / EAS Update ve Push               | Rastgele kurulum kimliği, sürüm, güncelleme/hata verisi; token ve teslimat içeriği | Son kullanıcı hizmet verisinde işleyen değerlendirmesi; geliştirici hesabı ayrı               | Expo'nun resmi açıklaması son kullanıcı adına işlemeyi anlatır. Türk sözleşme/alt işleyen/ülke ve saklama teyidi istenecek                                                             |
| Google OAuth                            | Kullanıcının seçtiği Google giriş işlemi; uygulamaya dönen hesap/profil            | Google'ın bağımsız hesap hizmeti ile Roomly'nin aldığı veri ayrılmalı                         | Genel Google gizlilik metni incelendi; tüm hizmetler için tek rol veya tek Türk sözleşmesi varsayılmadı                                                                                |
| Firebase / FCM                          | Firebase kurulum kimliği ve bildirim teslimi; uygulama sürümü                      | İlgili Firebase hizmet şartlarına göre işleyen/ayrı işleme ayrımı                             | Gerçek hesapta geçerli hizmet eki ve Türk aktarım hükümleri teyit edilecek; BigQuery/Analytics kullanımı otomatik varsayılmaz                                                          |
| Gmail SMTP ve destek kutusu             | Görev uyarısının adres/içeriği; destek ve silme talepleri                          | Tüketici Gmail hesabı için kurumsal Workspace işleyen şartları kendiliğinden geçerli sayılmaz | Bu en önemli sözleşme kapsamı kontrolüdür. Gerekirse kişisel Gmail yerine uygulanabilir işleyen şartı sağlayan e-posta hizmeti seçilecek; henüz taşıma/ücretli servis işlemi yapılmadı |
| GitHub Pages                            | Kamuya açık bilgi HTML'leri ve ziyaretçinin bağlantı kayıtları                     | İçerik barındırma ile GitHub'ın ziyaretçi işlemesi ayrılmalı                                  | Uygulama DB/fiş veya şifre Pages'e yüklenmez. Pages'e ait güncel gizlilik/hesap şartları ayrıca rol bazında değerlendirilir                                                            |
| Ev üyeleri                              | Kullanıcının ortak evde bilerek paylaştığı kayıt/fiş/IBAN                          | Hizmet içi alıcı                                                                              | Üyelerin erişimi, davet ve görünür kişisel liste davranışı açıklanır; yurt dışı sağlayıcı güvencesinin yerine geçmez                                                                   |

## Önerilen yol

Sürekli bulut/veri eşitlemesi için çalışma seçeneği **uygun rolün Türk standart sözleşmesi**: veri sorumlusu → veri işleyen akışında Standart Sözleşme 2; gerçekten bağımsız sorumluya aktarım varsa Standart Sözleşme 1 ayrıca değerlendirilir. Tek belge bütün farklı alıcılara otomatik uygulanmaz.

Resmi standart metin değiştirilmeksizin seçimlik kısımlar ve ekler doldurulmalıdır. Tarafların yetkili imzaları ve gereken ek kanıtlar toplanır. Standart sözleşme tercih edilirse imza sonrası beş iş günlük bildirim süreci işletilir. Bu belgeler henüz imzalanmadı/bildirilmedi.

Sürekli hizmet akışını “arızi aktarım” gibi göstermeyin. Kullanıcıdan genel rıza almak, GDPR uyumlu olduğunun yazılması veya AB SCC bağlantısı Türk aktarım yükümlülüğünün otomatik tamamlandığı sonucu değildir. Alternatif mekanizma somut kanıtla değerlendirilir; ülke için yeterlilik kararı olduğu varsayılmadı.

## Birincil kaynaklar

- [KVKK aktarım çerçevesi](https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim)
- [Resmi standart sözleşmeler](https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler)
- [Sözleşme doldurma/bildirim uyarıları](https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu)
- [Supabase DPA](https://supabase.com/legal/customer-resources/data-processing-addendum) ve [alt işleyen listesi](https://supabase.com/legal/customer-resources/subprocessor-list)
- [Expo veri işleme açıklaması](https://expo.dev/privacy-explained)
- [Google gizlilik](https://policies.google.com/privacy) ve [Google Cloud eki — yalnız kapsamındaki hizmetler için](https://cloud.google.com/terms/data-processing-addendum)
