# Roomly içerik güvenliği işletimi

Sorumlu: Ahmet Aydemir. Destek: caludebabaq@gmail.com.

## Bildirim ve engel

Kişiler → Güvenlik ve destek: evin son 100 kaydından kişi, harcama/fiş, alışveriş öğesi, görev, yorum, kategori veya ev adı seçilip gerekçe ile bildirilir. Daha eski kayıt/silinen içerik için destek e-postası yolu vardır. Kayıtlar content_reports tablosunda open durumunda açılır. Aynı hedef bildirimi aynı kullanıcı için tek satırdır; yenilendiğinde yeniden açılır. İlk saatte 20 yeni rapor sınırı vardır.

Bildirimler diğer ev üyelerine açık değildir. Kullanıcı engeli kişinin yorumlarını sunucuda gizler ve o kişinin başlattığı push/e-postayı keser. Ortak finans kayıtları, görevler ve sistem hatırlatmaları engellenmez. Uygulama bunu açıkça söyler.

## Operatörün yapacağı iş

- Destek kutusunu ve Supabase Table Editor → content_reports open kuyruğunu her gün incele. Şu an ayrı otomatik yönetici e-postası yoktur; kuyruk açılmadan incelenmiş sayılmaz.
- İlgili hedefi yalnız gereken bağlamla incele. Şikâyet nedenini veya başvuru sahibini diğer ev üyelerine ifşa etme.
- İncelemeye alınanı reviewing, tamamlananı resolved yap. Gerekirse yorum/liste/görev metnini kaldır, kategoriyi/ev adını düzelt veya uygunsuz fişi önce harcamadan ayırıp Storage API ile sil.
- Finansal harcamayı tümden silmek bakiyeleri değiştirir; uygunsuz metin/fiş incelemesinde öncelikle kişisel içeriği düzelt ve mali tutarları koru.
- Taciz/spam sürerse ilgili hesabın erişimini Auth admin üzerinden kısıtla. Kullanıcı adına keyfi kişisel veri/finans silme yapma.
- Başvuru sahibi geri dönüş isterse doğrulanmış destek kanalıyla sonuç ve itiraz yolunu bildir. Repoya kişisel veri veya yazışma kopyalama.

## Test ve sınırlar

supabase/tests/release_safety.sql rollback ile sürüm kabulü, rapor ev izolasyonu, rapor/engel gizliliği, yorum RLS’i ve bildirim filtresini doğrular. Gerçek push/e-posta teslimatı, moderatörün günlük takibi ve cihaz UI testi ayrı kanıttır.

Kaynak: https://support.google.com/googleplay/android-developer/answer/9876937
