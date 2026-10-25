# Roomly Android veri güvenliği incelemesi

25 Ekim 2026. Kaynak binary: 8e4b38a, 1.0.0 / versionCode 2. Bu kontrol kaynak ve sağlayıcı dokümantasyonuna dayanır; cihaz ağ trafiği testi veya hukuki uyum onayı değildir.

## Console'a kaydedilen sonuç

Veri toplama evet; HTTPS aktarım şifrelemesi evet; hesap yöntemleri e-posta/şifre ve OAuth. Hesap silme bağlantısı https://ahmetna.github.io/roomly/delete-account/ . Hesabı silmeden bütün veri sınıflarını ayrıca silme hizmeti beyan edilmedi.

| Veri                                     | Zorunluluk                                                        | Amaç                                  |
| ---------------------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| Ad                                       | Zorunlu                                                           | İşlevsellik, hesap yönetimi           |
| E-posta ve kullanıcı kimliği             | Zorunlu                                                           | İşlevsellik, hesap yönetimi, güvenlik |
| IBAN / kullanıcı ödeme bilgisi           | İsteğe bağlı                                                      | İşlevsellik                           |
| Harcama geçmişi ve ortak borç/bakiye     | Temel harcama işlevi için zorunlu                                 | İşlevsellik                           |
| Yorum / diğer uygulama içi mesaj         | İsteğe bağlı                                                      | İşlevsellik                           |
| Fiş fotoğrafı                            | İsteğe bağlı                                                      | İşlevsellik                           |
| Liste/görev metni, rapor/tercih içeriği  | Temel özellikler için zorunlu sınıf                               | İşlevsellik, güvenlik                 |
| Kurulum kimlikleri ve bildirim tokenları | Sınıf zorunlu; push token izne bağlı olsa da EAS kimliği otomatik | İşlevsellik                           |
| Kilitlenme günlüğü, tanı                 | Otomatik; hata oluşmasına bağlı                                   | İşlevsellik, analiz/hata teşhisi      |

Bellek içinde anlık işleme olarak işaretlenmedi. Analytics amaç etiketi, ayrı reklam/ürün analitiği SDK'sı bulunduğu anlamına gelmez; Expo hata teşhisini kapsar. Reklam/pazarlama veya kişiselleştirme amacı seçilmedi.

## Kaynak kanıtı

- `src/lib/api/notifications.ts`: yalnız izin verilince Expo token kaydı; bildirimler kullanıcının başlattığı ev işlemlerinden üretilir. İzin reddi uygulamayı kullanmayı engellemez.
- `src/lib/supabase.ts`, `src/lib/api/`: Supabase Auth, SQL/Realtime ve özel fiş Storage akışları; analytics, reklam, banka veya ödeme SDK'sı yok.
- Yüklü `expo-updates` 57.0.21: `android/src/main/java/expo/modules/updates/loader/FileDownloader.kt` içinde `EAS-Client-ID`, `Expo-Platform`, `Expo-Runtime-Version`, `Expo-Fatal-Error` ve başarısız güncelleme kimlikleri. Fatal hata üst sınırı 1024 karakter. Bu nedenle yalnız kullanıcı formlarını beyan etmek eksik olurdu.
- Firebase Messaging, Firebase installations bağımlılığı kullanır. FCM BigQuery teslimat dışa aktarımı veya Firebase Analytics uygulama kodunda etkinleştirilmemiştir.
- Konum izni/konum özelliği ve IP'den konum üretme uygulama kodunda yok. IP bağlantı/güvenlik bağlamında değerlendirilir; konum kendiliğinden beyan edilmez.

## Paylaşım değerlendirmesi

Google formundaki "paylaşılmadı", hiçbir verinin başka sisteme gitmediği iddiası değildir. Supabase barındırma, Expo güncelleme/push, Firebase teslimat ve Gmail SMTP bu uygulamaya hizmet sunar; kullanıcıların davet koduyla girdikleri evde başlattıkları ortak kayıt paylaşımları açık özellik kapsamındadır. Google'ın hizmet sağlayıcı ve kullanıcının başlattığı beklenen aktarım istisnaları bu akışlara uygulanarak Console'da üçüncü taraf paylaşımı işaretlenmedi. Kamuya açık gizlilik metni sağlayıcıları ve ev içi görünürlüğü ayrıca anlatır.

Bu form sınıflandırması KVKK yurt dışı aktarım mekanizmasını tamamlamaz. Yeni SDK, yeni alıcı/amaç, veri satışı, farklı sağlayıcı kullanımı veya belirlenen istisna kapsamı dışına çıkışta form yeniden açılmalı.

## Açık sınırlar

- Sağlayıcıların tüm log/yedek süreleri uygulama hesabının silinmesiyle aynı anda sıfırlanmaz.
- Ortak finans kayıtlarının saklanma dayanağı/süresi ve uygulanabilir yurt dışı aktarım mekanizması operatörce tamamlanmalı.
- Gerçek cihaz kullanımı, ağ kaydı ve Google inceleme sonucu henüz yok.

## Resmi kaynaklar

- [Google Data safety tanımları ve istisnaları](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Expo privacy explained](https://expo.dev/privacy-explained)
- [Expo security](https://expo.dev/security)
- [Expo SDK 57 updates](https://docs.expo.dev/versions/v57.0.0/sdk/updates/)
- [Firebase Android veri açıklaması](https://firebase.google.com/docs/android/play-data-disclosure)
