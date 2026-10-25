# Türk standart sözleşmesi ekleri için Roomly hazırlığı

25 Ekim 2026. **Resmi sözleşmenin yerine geçmez; imzalanmış belge değildir.** Ana metin yeniden yazılmadı. [Kurumun resmi şablonu](https://www.kvkk.gov.tr/Icerik/7929/Standart-Sozlesmeler) uygun taraf rolüyle seçilip aşağıdaki uygulama bilgileri ek alanlara aktarılabilir. Seçimlik olmayan maddeler değiştirilmemeli.

## Ek I — aktarım kapsamı için hazır bilgiler

- Aktaranın uygulama sorumlusu gösterimi: Ahmet Aydemir, Roomly. Hukuki kimlik, adres ve imza yetkisi özel kayıtta teyit edilecek.
- İletişim: caludebabaq@gmail.com. Sözleşme bildirim adresi olup olamayacağı taraflarla teyit edilecek.
- Alıcı: her sağlayıcı için ayrı gerçek sözleşme tarafı/unvan/adres/temsilci yazılacak. Supabase/Expo/Google marka adını tek başına imza tarafı saymayın.
- İlgili kişiler: hesap açan yetişkin kullanıcılar; ev üyelerince kaydedilen, hesabı olmayan ev arkadaşları; destek başvurusu yapan kişiler.
- İşlem amaçları: hesap erişimi, ortak ev kayıtlarını tutma/hesaplama/eşitleme, özel fiş depolama, bildirim, güvenlik, destek ve silme.
- Veri türleri: alıcının fiilen işlediği alt küme; hesap/e-posta/üye kimliği; ortak finans/liste/görev/yorum; isteğe bağlı IBAN ve fiş; token/dil; rapor/engelleme/koşul kaydı; bağlantı/kurulum/sürüm/hata verisi.
- Özel nitelikli veri: uygulama amacı kapsamında talep edilmez. Serbest metin/fiş yoluyla yanlışlıkla girilme riski vardır; yasak/minimizasyon ve kaldırma süreciyle ele alınır. “Teknik olarak asla giremez” denmez.
- Sıklık: hesap ve işlem oldukça devamlı; gerçek bulut akışı arızi diye işaretlenmez.
- Faaliyet: toplama, kimlik doğrulama, depolama, düzenleme, hesaplama, kullanıcı erişimi, bildirim/eşitleme ve silme. Sağlayıcıya göre gereksiz amaç çıkarılmalı.
- Saklama: aktif hizmet süresi; kullanıcıya atfedilen kişisel verinin hesap silme akışında temizlenmesi; sınırlı finans/uyuşmazlık ve sağlayıcı log/yedekleri için somut gerekçeli alt kapsam. Henüz onaylanmamış 90 gün/12 ay önerileri kesin hüküm yapılmaz.
- Yeniden aktarım: yalnız sağlayıcının doğrulanmış alt işleyen/ülke listesi ve hukuken geçerli güvence kapsamı. Bölge seçimi tek başına yeniden aktarımı dışlamaz.

## Ek II — mevcut teknik tedbirler

- Kullanıcı erişimi Supabase Auth ile; SQL tablolarında household/hesap kapsamlı RLS.
- Özel receipts bucket; yetkili erişim ve süreli okuma URL'si; dosya boyut/format sınırlamaları.
- Uygulama API/Storage ve teslimat bağlantılarında HTTPS.
- Servis rolü ve FCM özel anahtarları istemciye veya kamuya açık GitHub'a eklenmez.
- Silme servisi kullanıcıyı sunucuda doğrular; istemcinin başka kullanıcı ID'siyle hedef seçmesine izin vermez. Dosya temizliği öncesi başarı bildirmez.
- Silinen hesap üyeleri tekrar sahiplenilemez; finansal hesaplama geçmişi korunur.
- Şikâyet ve engelleme tercihleri diğer kullanıcılara açılmaz; yorum ve aktör bildirimleri için engelleme uygulanır.
- Migration ve belirli silme/güvenlik testleri repoda; kaynak CI kontrolleri çalışır.

Bunlar bütün eski endpointlerin bağımsız pentestten geçtiği, sertifikasyon alındığı, tüm yedeklerden restore denendiği veya her cihazda fiziksel test yapıldığı iddiası değildir. Operatör erişim/MFA, ihlal yanıtı, alt işleyen silmesi ve backup/restore kanıtları ayrıca tamamlanmalıdır.

## Ek III / imza-bildirim paketi kontrolü

Alıcının gerçek alt işleyenleri, ülkeleri, amaçları ve saklama aralıkları; taraf adres/temsilcileri; imza tarihi ve yetkisi; bildirim sorumlusu ve beş iş günü takibi; gereken yetki/tercüme belgeleri ve bildirim alındısı özel dosyada saklanır. Özel bilgileri bu kamuya açık depoya koymayın.
