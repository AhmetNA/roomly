# Roomly saklama ve imha çalışma politikası

25 Ekim 2026. **Mevcut davranış** ile **önerilen yeni süre** ayrıdır. Bu dosya görev/cron veya veri silme talimatı çalıştırmaz; canlı kullanıcı verisi değiştirilmedi.

## Mevcut sözleşme

Kullanıcının kararı: hesap silmede kişisel veriler için ilave bekleme yok; ortak borç bakiyeleri korunur. Prepare → Storage temizliği → Auth silme sırası uygulanır. Tamamlanamayan işlem yeniden denenebilir. Ortak finans satırlarının tutulması otomatik tam anonimlik sayılmaz.

## Kategori tablosu

| Kategori                                          | Bugün                                                           | Hazırlanan politika önerisi / yapılacak teknik iş                                                                                                                                                                                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-posta, giriş, kullanıcıya bağlanabilen ad/IBAN  | Hesap aktifken tutulur; silme akışında kaldırılır               | Aynı kalsın; yalnız hata durumundaki pending temizliği takip edilsin                                                                                                                                                                                                                  |
| Yorumlar, kullanıcının listeleri, görev metinleri | İlişkilendirilebilen kayıtlar hesap silmede temizlenir          | Aynı kalsın; eski bağlantısız içerik ve ortak açıklamalar destek incelemesine alınsın                                                                                                                                                                                                 |
| Fişler                                            | Kullanıcıya atfedilen dosyalar Storage API ile silinir          | Aynı kalsın; silinemeyen dosya varsa işlem tamamlandı sayılmasın                                                                                                                                                                                                                      |
| Push tokenları                                    | Hesap silmede kaldırılır                                        | Aynı kalsın; geçersiz cihaz tokenı sağlayıcı cevabıyla ayrıca temizlensin                                                                                                                                                                                                             |
| Silme işlem durumu                                | Hesaba bağlı geçici kayıt; Auth silinince cascade               | Süresiz silme kuyruğu oluşturulmasın; başarısız işlem operatörce izlenip tamamlanmalı                                                                                                                                                                                                 |
| Ortak finansal kimlik/bölüşüm/borç/ödeme          | Kimlik bağı kaldırılarak korunur, yeniden sahiplenme engellenir | Bakiye veya somut uyuşmazlık varken asgari satır korunsun. Her 12 ayda gereklilik gözden geçirilsin. Tamamen kapanan ve hiçbir aktif hesabın hizmet almadığı ev için 90 günlük kapanış incelemesi önerilir; veri kaybı/başkasının hakkı değerlendirilmeden otomatik finans silinmesin |
| Koşul kabulü/şikâyet/engelleme                    | Hesaba bağlı bazı kayıtlar Auth silinmesiyle cascade olabilir   | Kanıtı gerekli somut olay varsa yalnız gereken sınırlı olay kaydı ayrı hukuki değerlendirmeyle tutulmalı; “tüm raporlar sonsuza dek saklanır” denmesin                                                                                                                                |
| Destek e-postası ve başvuru                       | Gmail'de operatör yönetir; otomatik süre uygulanmış değil       | Sonuçlandırmadan 90 gün sonra gereksiz ekler/kişisel içerik temizliği önerilir; devam eden uyuşmazlık veya kanuni zorunluluk ayrıca kayda bağlansın                                                                                                                                   |
| Uygulama dışı log/yedek                           | Sağlayıcı plan/ayar/sözleşmesine bağlı                          | Kesin gün sayısı sağlayıcıdan alınsın; mevcut plan doğrulanmadan 7/30/90 gün diye taahhüt verilmesin                                                                                                                                                                                  |

12 ay, 90 gün gibi sayılar genel kanuni saklama süresi olduğu iddiası değildir; önerilen işletim tercihidir. Finansal satırın daha uzun tutulması gerekiyorsa somut sebep, kapsam, erişim ve yeniden değerlendirme tarihi yazılmalıdır. Bakiye koruma kararı tüm metinlerin süresiz tutulmasını haklı kılmaz. Kişisel veri silmeyi bu öneri sürelerinin sonuna ertelemez.

## Uygulama sırası

1. Tamamen kapanan evin ve çözülmüş bakiyenin tanımını netleştir; çoklu para birimi ve karşılıklı settlement hesabını koru.
2. Onaylanan süre için önce etkilenecek kayıtları yalnız sayan kuru çalışma raporu hazırla. Finans satırlarını doğrudan DELETE ederek diğer üyelerin bakiyesini değiştirme.
3. Yalnız doğrulanmış kapsam için migration/temizlik görevi ve rollback testleri hazırlanır. Şu an yeni temizleme görevi kurulmadı.
4. Restore işlemi yapılırsa silinmiş kişisel verilerin yeniden hizmete dönmemesi için silme durumları/kanıtları kontrollü uygulanır. Restore testi henüz tamamlanmış sayılmaz.
5. İmha işleminin asgari kayıtları erişimi kısıtlı tutulur; içerik kopyası imha kaydı adı altında yeniden saklanmaz. Hukuken gerekli imha kayıtları için ilgili mevzuat ayrıca uygulanır.

## Dayanak ve sınır

İşleme amacı veya şartı kalmayan verinin silinmesi/yok edilmesi/anonimleştirilmesi gerekir. Bir kaydı “Silinen hesap” diye yeniden adlandırmak tek başına anonimleştirme değildir. Periyodik imha aralığı ve politika yükümlülüğü operatörün durumuna göre değerlendirilir; mevcut hızlı hesap silme akışı korunur.

[KVKK silme açıklaması](https://www.kvkk.gov.tr/Icerik/2038/kisisel-verilerin-silinmesi-yok-edilmesi-veya-anonim-hale-getirilmesi) · [İmha Yönetmeliği](https://www.kvkk.gov.tr/Icerik/5441/KISISEL-VERILERIN-SILINMESI-YOK-EDILMESI-VEYA-ANONIM-HALE-GETIRILMESI-HAKKINDA-YONETMELIK)
