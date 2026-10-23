# Bakiyeleri koruyan hesap silme — uygulama ve doğrulama

23 Ekim 2026. Kullanıcı kararı: ortak borç bakiyeleri korunacak; kişisel veriler kaldırılacak; silinen üye yeniden sahiplenilemeyecek.

## Uygulanan davranış

- Kişiler ekranında ve henüz eve katılmamış hesapların onboarding ekranında silme seçeneği ve geri alınamaz işlem onayı var.
- `delete-account` Edge Function yalnız POST, geçerli Auth kullanıcısı ve `confirmation: DELETE` kabul eder. Hedef kullanıcı kimliği gövdeden alınmaz; ek hedef alanları reddedilir. Gateway verify_jwt kapalıdır; gerçek kimlik doğrulaması her istekte `auth.getUser(bearer)` ile yapılır. Bu public/publishable anahtar uyumunu korur, anonim silmeye izin vermez.
- Yalnız servis rolünün çalıştırabildiği prepare işlemi silme durumunu açar; kullanıcıyı evlerden ayırır, kişisel adı/IBAN’ı kaldırır ve üyeyi kalıcı arşivler.
- Yeni `account_owner_id`, bundan sonraki evden ayrılmalarda kaybolmayan silme ilişkisini tutar. Hesap son silindiğinde bu bağ da Auth FK’sı üzerinden temizlenir.
- Yazdığı görev yorumları, kişisel listesi, eklediği alışveriş öğeleri, görev atamaları ve bildirim token’ları silinir. Oluşturduğu görevlerin başlık/açıklaması temizlenir. Finansal ID’ler, tutarlar, bölüşümler, ödemeler ve mutabakatlar değişmez.
- Hesaba ait fiş bağlantıları kaldırılır; gerçek dosyalar Storage API ile 100’lük gruplar halinde kaldırılır. Dosyalar varken final silme çalışmaz. Bir çağrıda en fazla 1.000 dosya işlenir; fazlası veya hata yeniden denemeyle sürer.
- Auth kullanıcısı ancak dosya temizliğinden sonra silinir. İlişkili oturumlar ve kimlikler FK ile kalkar. Eski access JWT henüz kriptografik olarak geçerli olsa bile canlı kullanıcı/üyelik kontrolü eve erişim vermez.
- Üye preview’de görünmez, yeniden sahiplenilemez; yeni harcama ve görev seçimlerinde sunulmaz. Üyenin doğrudan client DELETE’i finansal cascade kaybını önlemek için kapatıldı.
- Yarım kalan işlem yeniden giriş/uygulama açılışında tamamlama ekranında sürer. Aktif oturum veya çevrimiçi erişim olmadan dosya temizliği sürdürülemez; destek prosedürü gerekir.

## Canlı uygulama

- Migration: `20261023191155_account_deletion_preserve_balances.sql` (uzak migration timestamp’iyle eşleştirildi).
- `delete-account` ACTIVE, v1 olarak deploy edildi. Kaynak `supabase/functions/delete-account/` altında; service-role anahtarı yalnız sunucuda.
- Mevcut gerçek kullanıcılarda silme çağrılmadı. Migration mevcut üyelere bağlantı/alan ekledi; mevcut hesap veya fiş silmedi.

## Geçen doğrulamalar

1. `supabase/tests/account_deletion.sql`: rollback testinde finans tutarları, diğer ev/hesap koruması, kişisel veri temizliği, izinler, Storage bitirme kilidi, tekrarlama, ayrılmış üyenin temizlenmesi, eski JWT ve yeniden sahiplenme reddi geçti.
2. `deno test --allow-env supabase/functions/delete-account/handler.test.ts`: yöntem/auth/hedef enjeksiyonu; Storage hatası sonrası Auth’u silmeme ve yeniden deneme sırası (2 test) geçti.
3. Yayındaki servise uçtan uca test: bu test için e-posta göndermeden oluşturulan iki Auth hesabı, ortak ev, 100 TL harcama ve gerçek örnek fiş. Bir hesap servis üzerinden silindi. Fiş Storage’dan, Auth hesabı Auth’tan kaldırıldı; arşiv üyesi kaldı; borç satırları aynen korundu; diğer hesap etkilenmedi; eski JWT eve erişemedi. Sonunda tüm test hesapları ve evi temizlendi.
4. TypeScript, ESLint ve mevcut görev filtre testi geçti. Android JS/Hermes ve web export başarılı; oturumsuz silme HTML’i web çıktısında doğrulandı. Bunlar APK/cihaz testi değildir.
5. Güvenlik danışmanı taraması yeni silme RPC’lerini authenticated erişimine açık bulmadı. Mevcut, kasıtlı SECURITY DEFINER RPC uyarıları ve sızmış parola kontrolünün kapalı olması ayrıca duruyor; RLS’li üç servis tablosunda client policy olmaması beklenen durum.

## Açık sınırlar / yayın kapıları

- Cihaz UI’sı, açık/koyu tema, Android/iOS ve ağ kesintisinin fiziksel doğrulaması yapılmadı.
- `public/delete-account/index.html` e-posta talep sayfası yerel hazır. Henüz yayımlanmış URL yok. Saklanan finans verisinin gerekçeli süresi nihai metne eklenmeden yayın kapısı kapanmaz.
- Bu migration’dan önce evden ayrılarak kullanıcı bağı tamamen kaybolmuş eski üye satırları otomatik bir kişiye mal edilemez. Başvuru halinde kimlik ve ilgili kayıtlar operatörce doğrulanmalıdır.
- Harcama tablosunda ekleyen kişi bilgisi yok; başka üyelerin yazdığı ortak açıklamalar, ev/kategori adları ve üçüncü kişi içerikleri otomatik kişisel veri tespitiyle silinmez. Destek incelemesi gerekir. Bu işlem tam anonimleştirme iddiası değildir.
- Sağlayıcı logları/yedekleri ve silme öncesi alınmış ekran görüntüleri/indirilen dosyalar bu akış tarafından geriye dönük temizlenmez. Silinmeden önce üretilmiş süreli URL ve istemci önbellekleri ayrıca değerlendirilmelidir.
- Başlamış veya e-posta sağlayıcısına teslim edilmiş push/mail gönderimi geri çağrılamaz.
- E-posta başvurularında hesap sahipliği doğrulanmadan operatör silme başlatmaz. Şifre/servis anahtarı talep edilmez. Başvuru e-postalarının kendi saklama süresi de belirlenmelidir.

## Operatör talep işlemi

1. Başvurunun kayıtlı adresten geldiğini ve talep sahibini doğrula; ilişkili eski üyeleri ve ortak metinleri incele. Kimlik bilgilerini repoya yazma.
2. Tercihen kullanıcıyı uygulamadaki onaylı silme akışına yönlendir; uygulamayı kuramıyorsa doğrulanmış talep aynı servis sırasıyla sunucuda işlenir.
3. Servis rolüyle `prepare_account_deletion(target_user_id)`; `account_deletion_receipts(target_user_id)` sonuçlarını yalnız Storage API üzerinden sil; dosya kalmadıktan sonra `finish_account_deletion(target_user_id)` çağır. Doğrudan üye DELETE’i veya Storage metadata DELETE’i kullanma.
4. Sonucu, varsa kalan ortak metin/sağlayıcı kayıtları ve geçerli saklama gerekçesini talep sahibine açıkla. Başarısız temizliği tamamlandı diye kapatma.
