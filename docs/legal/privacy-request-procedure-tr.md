# Roomly kişisel veri başvurusu işletim prosedürü

25 Ekim 2026. Operatör: Ahmet Aydemir. Kanal: caludebabaq@gmail.com ve uygulamadaki silme akışı. Operatörün destek kutusunu ve içerik raporu kuyruğunu takip etmesi gerekir; bu belge otomatik yönetici bildirimi kurmaz.

## Kabul ve doğrulama

Başvuruya kişisel veri içermeyen bir takip numarası ver; alınma, talep türü, kapsam, doğrulama, işlem ve yanıt tarihini erişimi kısıtlı kayıtta tut. Hesaba erişebilen kişiyi uygulama oturumuyla veya kayıtlı e-posta üzerinden uygun yöntemle doğrula. Başka ev üyesinin hesabını silme/dökümünü isteme talebini sırf aynı evde diye kabul etme.

Varsayılan olarak kimlik fotokopisi, tam IBAN, kart, şifre veya OTP isteme. Somut risk ek doğrulama gerektirirse yalnız gerekli kapsamı belirle; alınan ek bilgiyi işi bitince gereksiz yere tutma. Kimlik/adres numaralarını kamuya açık issue/commit'e yazma.

## İşleme ve yanıt

1. Talebin erişim, düzeltme, silme, alıcı bildirimi veya itiraz olup olmadığını ayır. Başkalarına ait ev kayıtlarını toplu dışa aktararak ifşa etme.
2. Hesap silmede mevcut güvenli servisi kullan; doğrudan Auth veya Storage metadata DELETE ile akışı atlama. Pending/hata durumunda tamamlanmayı takip et.
3. Ortak finansal bakiye değişmeden ad/IBAN/serbest metin temizliği yapılabilecek alanları ayır. Başka üyelerin hakları için korunması gereken satır varsa somut sebep ve kapsamı belirt; bütün veriler silindi diye cevap verme.
4. Hizmet sağlayıcıların bağımsız tuttuğu log/yedek veya teslim edilmiş e-postalar için fiilen yapabildiğin işlem ve kalan sınırı açıkla. Silinen veri geri yüklemede yeniden görünür hale getirilmemeli.
5. Usulüne uygun başvuruyu en kısa sürede ve en geç 30 gün içinde cevapla. Reddedilen kısmın gerekçesini ve kanuni başvuru/şikâyet yolunu belirt. Sonuçta asgari veri ve işlem kanıtını tut.

## Kısa alındı örneği

“Roomly başvurunuzu aldık. Takip numarası: [özel kayıttaki numara]. Talebinizi kimliğinizi ve başkalarının verilerini koruyarak inceleyeceğiz. Gerekirse yalnız talebe uygun ek bilgi isteyeceğiz. Başvurunuzu mevzuattaki süre içinde sonuçlandıracağız. Şifrenizi veya doğrulama kodunuzu paylaşmayın.”

## Kısa silme sonucu örneği

“Hesabınıza ilişkilendirebildiğimiz kişisel alanlar ve dosyalar silme akışında kaldırıldı. Diğer ev üyelerinin bakiyelerini bozmamak için [somut kayıt kapsamı] sınırlı finansal kayıtları silinen hesap etiketiyle korunmaktadır. [Somut gerekçe/inceleme tarihi]. Sağlayıcı log/yedekleri ve daha önce teslim edilen kopyalar için [doğrulanan sınır]. Bu yanıt tam anonimleştirme iddiası değildir.”

Köşeli alanlar gerçek işlem kaydından doldurulmadan mesaj gönderilmez. Bu taslaklar kullanıcı adına kimseye gönderilmedi.

[KVKK başvuru cevaplama açıklaması](https://www.kvkk.gov.tr/Icerik/2046/Ilgili-Kisiler-Tarafindan-Yapilan-Basvurularin-Cevaplanmasi-Yukumlulugu)
