# Android sürüm ve hata müdahale adımları

## Sürüm adayı

1. Kaynak kontrolleri: `npm ci` ve `npm run check`. CI aynı kontrolleri Node 22 üzerinde çalıştırır.
2. `docs/android-launch-status.md` içindeki açık yayın engellerini kapat; özellikle hesap silme, gizlilik, parola kurtarma ve gerçek cihaz sonuçları.
3. Paket `com.anonymous.roomly` olarak kalır. Firebase Android kaydının bu paketle eşleştiğini kontrol et.
4. Native bağımlılık, izin veya plugin değiştiğinde `expo.version` değerini artır ve yeni AAB üret. Mevcut `runtimeVersion: appVersion` politikası bunun uygulanmasına bağlıdır; aynı sürümde native değişiklik yapıp yalnız OTA gönderme.
5. Production: `npx eas-cli build --platform android --profile production`. Bu adım bulut kotasını kullanır; mevcut çalışmada çalıştırılmadı. Production profili AAB, `production` ortamı/kanalı ve remote autoIncrement kullanır.
6. AAB sertifikasını upload key ile karşılaştır; debug sertifikalı yerel release’i mağazaya gönderme. Anahtar yedeğini ve parolalarını repoya koyma.
7. Final AAB’de versionCode, target SDK, izinler, ABI ve 16 KB desteğini doğrula; bu bilgileri kaynak ayarlarından hareketle tamamlandı sayma.
8. Play internal test’e yükle, Play’den kur ve planın asgari cihaz paketini uygula. Kullanıcı test bilgileri ve inceleme parolaları yalnız Console’da tutulur.
9. Console kişisel hesap için kapalı test istiyorsa gerekli katılımcı/süreyi oradan doğrula. Dışarıdan APK paylaşımını bu koşulla karıştırma.

## OTA

- Preview profili `preview`, production profili `production` kanalındadır.
- Preview denemeleri: `npx eas-cli update --channel preview --environment preview`.
- Production OTA ancak aynı native runtime’a uyumlu JS/asset değişiklikleri ve doğrulanmış aday için yapılır.
- Yayın öncesinde EAS kanalının doğru dala bağlı olduğunu ayrıca kontrol et; profil adı tek başına yönlendirme kanıtı değildir.
- Son başarılı update grubunun kimliğini özel sürüm kaydında tut. Geri dönüşü preview üzerinde deneyip gerçek desteklenen EAS CLI işlemiyle uygula; denenmemiş geri dönüşe hazır deme.

## Hatalı sürüm

1. Yeni dağıtımı ve OTA yayınını durdur; etkilenen sürüm, Android sürümü ve akışı kaydet.
2. Play Android vitals / pre-launch ve gerekiyorsa kişisel veriden arındırılmış logcat ile crash/ANR nedenini bul. Bu repo otomatik crash raporlama servisi eklendiği anlamına gelmez.
3. OTA kaynaklı ve native uyumluysa son başarılı JS sürümüne geri dön; native hata için daha yüksek versionCode ile düzeltme AAB’si çıkar.
4. Veritabanı değişikliklerini eski istemcilerle uyumlu tut. Üretim veritabanını resetleme.
5. Destek taleplerini `caludebabaq@gmail.com` üzerinden izle; hesap/veri olaylarında erişimi sınırla, kapsamı belirle ve ilgili prosedürü işlet.

## Henüz kanıtlanmayanlar

- Play upload key / App Signing ve final AAB kabulü.
- Kanal eşlemeleri ve OTA geri dönüş denemesi.
- Cihazlarda release açılışı, OAuth, push, kamera ve izin reddi.
- Şifreli DB + Storage yedeğinden izole geri yükleme.
