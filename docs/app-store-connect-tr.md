# Roomly — App Store Connect form içerikleri

17 Kasım 2026. Apple Developer hesabı açılınca App Store Connect'e alan alan girilecek değerler. Kaynaklar: [play-store-listing-tr.md](play-store-listing-tr.md), [data-safety-audit.md](data-safety-audit.md), [ios-launch-plan.md](ios-launch-plan.md). Karakter sınırları bu dosyadaki metinler üzerinde kontrol edildi.

## 1. Yeni uygulama kaydı (My Apps → +)

| Alan              | Değer                                                           |
| ----------------- | --------------------------------------------------------------- |
| Platform          | iOS                                                             |
| Ad                | `Roomly` (alınmışsa yedek: `Roomly: Ev Arkadaşları`)            |
| Birincil dil      | Türkçe                                                          |
| Bundle ID         | `com.ahmetaydemir.roomly` (ilk EAS build'i App ID'yi oluşturur) |
| SKU               | `roomly-ios`                                                    |
| Kullanıcı erişimi | Full Access                                                     |

## 2. App Information

| Alan                    | Değer                                                   |
| ----------------------- | ------------------------------------------------------- |
| Alt başlık (≤30)        | `Ev arkadaşlarıyla ortak düzen`                         |
| Birincil kategori       | Productivity (Verimlilik) — Play ile aynı               |
| İkincil kategori        | Lifestyle (Yaşam Tarzı)                                 |
| Content Rights          | "Does not contain, show, or access third-party content" |
| Age Rating              | Bölüm 6'daki cevaplar                                   |
| Gizlilik politikası URL | https://ahmetna.github.io/roomly/privacy/               |

Finance kategorisi seçilmedi: Roomly para transferi yapmıyor, Finance seçmek finansal hizmet belgesi sorulmasına yol açabilir.

## 3. Fiyat ve erişilebilirlik

- Fiyat: **Ücretsiz** (Free). Uygulama içi satın alma yok.
- Ülke/bölge: **yalnız Türkiye**. AB ülkeleri seçilirse DSA "trader" beyanı istenir ve satıcı ise adres/telefon mağazada yayımlanır.
- Tax/Banking ve Paid Apps sözleşmesi gerekmez (ücretsiz uygulama için Free Apps sözleşmesi otomatik).

## 4. Sürüm sayfası (iOS App 1.0.1)

**Tanıtım metni (Promotional Text, ≤170):**

> Ortak harcamaları bölüş, kimin kime ne kadar borçlu olduğunu gör, ihtiyaç listesini ve ev işlerini ev arkadaşlarınla birlikte takip et.

**Açıklama (≤4000):**

> Roomly, ev arkadaşlarının ortak yaşamı düzenlemesine yardımcı olur. Ortak harcamalarınızı, ihtiyaçlarınızı ve ev işlerinizi tek yerde takip edin.
>
> ORTAK HARCAMALAR
> Harcamaları kaydedin; eşit, hisseye göre veya sabit tutarla paylaşın. Bir harcamayı birden fazla kişi ödeyebilir. Kimin ne kadar borcu veya alacağı olduğunu görün ve aranızda yaptığınız ödemeleri kaydedin.
>
> İHTİYAÇ LİSTESİ
> Ortak ihtiyaçları kategoriye göre düzenleyin. Alınan ürünleri işaretleyin ve ev arkadaşlarınızla güncel listeyi paylaşın. Kişilere ait listeler de aynı evdeki tüm üyeler tarafından görülebilir ve yönetilebilir.
>
> PAYLAŞILAN GÖREVLER
> Ev işlerini oluşturun, bir veya birden fazla kişiye atayın. Son tarih ve öncelik belirleyin; yorumlarla iletişim kurun ve tamamlanan işleri takip edin.
>
> EV ARKADAŞLARI
> Davet koduyla aynı eve katılın. Ortak kayıtlar ev üyeleri arasında paylaşılır. Evdeki üyeler ortak harcamaları, listeleri ve görevleri düzenleyebilir.
>
> Roomly bir kayıt ve hesaplama aracıdır. Para transferi yapmaz; banka hesabınıza bağlanmaz ve ödeme işlemi gerçekleştirmez.
>
> Destek: caludebabaq@gmail.com

**Anahtar kelimeler (≤100, virgülle, boşluksuz):**

> `ev arkadaşı,harcama,bölüşme,borç,masraf,kira,alışveriş listesi,ev işleri,görev,ortak ev,fatura`

| Alan          | Değer                                     |
| ------------- | ----------------------------------------- |
| Support URL   | https://ahmetna.github.io/roomly/support/ |
| Marketing URL | https://ahmetna.github.io/roomly/         |
| Copyright     | `2026 Ahmet Aydemir`                      |
| Sürüm         | 1.0.1 (app.json `version`)                |

**Ekran görüntüleri:** 6.9" iPhone (1320×2868, dikey) zorunlu; 3–10 adet. iPad yok (`supportsTablet: false`). iPhone 17 Pro Max simulator'ından ham PNG; Android'deki dört ekranla aynı sıra: Harcamalar, İhtiyaç Listesi, Görevler, İstatistikler. Demo evine girişi uygulama ekranında Ahmet yapar (canlı Supabase'e kimlik bilgisi Claude tarafından girilmez), çekimi Claude yapar.

## 5. App Privacy (Uygulama gizlilik etiketleri)

"Do you or your third-party partners collect data from this app?" → **Yes**. İzleme (tracking) **yok**: hiçbir veri başka şirketlerin uygulama/sitelerindeki verilerle birleştirilmiyor, reklam SDK'sı yok, ATT izni gerekmez.

| Apple veri türü                       | Roomly karşılığı                                   | Amaç              | Kullanıcıya bağlı | İzleme |
| ------------------------------------- | -------------------------------------------------- | ----------------- | ----------------- | ------ |
| Contact Info → Name                   | Üye adı, Apple'ın verdiği ad                       | App Functionality | Evet              | Hayır  |
| Contact Info → Email Address          | Giriş e-postası (Apple relay adresi dahil)         | App Functionality | Evet              | Hayır  |
| Financial Info → Payment Info         | İsteğe bağlı IBAN (yalnız ev üyelerine gösterilir) | App Functionality | Evet              | Hayır  |
| Financial Info → Other Financial Info | Harcama, bölüşüm, borç/ödeme kayıtları             | App Functionality | Evet              | Hayır  |
| User Content → Photos or Videos       | İsteğe bağlı fiş fotoğrafı                         | App Functionality | Evet              | Hayır  |
| User Content → Other User Content     | Liste, görev, yorum, şikâyet içeriği               | App Functionality | Evet              | Hayır  |
| Identifiers → User ID                 | Supabase hesap kimliği                             | App Functionality | Evet              | Hayır  |
| Identifiers → Device ID               | Expo push token, EAS kurulum kimliği               | App Functionality | Evet              | Hayır  |
| Diagnostics → Crash Data              | expo-updates açılış hatası (≤1024 karakter)        | App Functionality | Hayır             | Hayır  |

İşaretlenmeyenler: konum, sağlık, kişiler/rehber, tarama/arama geçmişi, satın almalar, kullanım verisi/analitik, hassas bilgi. Kod ve SDK'larda karşılığı yok ([data-safety-audit.md](data-safety-audit.md)). Yeni SDK veya amaç eklenirse bu tablo yeniden açılmalı.

## 6. Yaş derecelendirme anketi

| Soru grubu                                                                                        | Cevap                                                                                                          |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Şiddet, korku, cinsellik/çıplaklık, küfür, uyuşturucu/alkol/tütün, kumar, yarışmalar, tıbbi bilgi | **None / No** (hepsi)                                                                                          |
| Simüle kumar, kumar/ödüllü yarışma                                                                | No                                                                                                             |
| Sınırsız web erişimi (Unrestricted Web Access)                                                    | No (yalnız sabit gizlilik/destek sayfaları)                                                                    |
| Kullanıcı tarafından oluşturulan içerik (User-Generated Content)                                  | **Yes** — davet koduyla kapalı ev içinde yorum, görev, liste metni ve fiş fotoğrafı; bildirme ve engelleme var |
| Mesajlaşma ve sohbet (Messaging and Chat)                                                         | **Yes** — kayıtlara yorum yazma, yalnız aynı ev üyeleri arasında                                               |
| Reklam                                                                                            | No                                                                                                             |
| Ebeveyn denetimi / yaş doğrulama                                                                  | No                                                                                                             |

UGC ve mesajlaşma "Yes" olduğu için Apple daha yüksek bir yaş sınırı önerebilir; çıkan sonucu kabul et. Play'deki 18+ hedef kitle beyanı Apple'daki derecelendirmeyi değiştirmez.

## 7. App Review Information

| Alan                 | Değer                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Sign-in required     | Yes                                                                                                                                        |
| User name / Password | `.secrets/play-review-account.json` içindeki inceleme hesabı (repoya ve bu dosyaya yazılmaz; Claude form alanına girmez, Ahmet yapıştırır) |
| İletişim adı         | Ahmet Aydemir                                                                                                                              |
| E-posta              | caludebabaq@gmail.com                                                                                                                      |
| Telefon              | **Ahmet'in telefon numarası** (Apple zorunlu tutuyor)                                                                                      |

**Notes (İngilizce, inceleme ekibi için):**

> Roomly is a shared-household expense, shopping list and chore tracker for roommates.
>
> Demo account: the credentials above sign in to a sample household that already contains members, an expense, shopping items and a task, so every screen has data. Other households are not visible to it.
>
> No real money is moved. Roomly only records who paid what and calculates balances between roommates. It does not connect to banks, process payments or offer financial services. The optional IBAN field is shown to the user's own household members so they can pay each other manually outside the app; Roomly never initiates a transfer.
>
> Sign in: email/password, Sign in with Apple, and Google. Sign in with Apple is offered next to Google per guideline 4.8.
>
> Account deletion (5.1.1(v)): People tab → "Delete my account". For Sign in with Apple users, the app asks for Apple confirmation and revokes the Apple tokens before deletion. Web request form: https://ahmetna.github.io/roomly/delete-account/
>
> User-generated content (1.2): users accept the terms before using shared content. People tab → "Safety and support" lets users report content or users and block users; blocked users' comments are hidden and their notifications stop. Reports are reviewed by the developer.
>
> Push notifications are optional and are requested only after the user has joined a household; the app works fully without them.

## 8. Diğer beyanlar

- **Export Compliance:** `ITSAppUsesNonExemptEncryption = false` app.json'da tanımlı; yalnız HTTPS. Soru build'de sorulmaz.
- **Advertising Identifier (IDFA):** kullanılmıyor.
- **Sign in with Apple e-posta yönlendirme:** Apple Developer → Services → Sign in with Apple for Email Communication → gönderen Gmail adresi kayıt edilir; yoksa "E-postamı gizle" kullanıcılarına e-posta bildirimi ulaşmaz.
- **TestFlight:** dahili test anında açılır; Play'deki 12 test kullanıcısı / 14 gün şartı yok.

## 9. Ahmet'in kaçınılmaz adımları

Hepsini Claude'a devretmek mümkün olmayan, kimlik veya hesap sahipliği gerektiren adımlar:

1. Apple Developer Program ödemesi ve kimlik doğrulaması.
2. İlk `eas build -p ios` sırasında Apple ID şifresi ve iki adımlı doğrulama kodu (kendi terminalinde).
3. App Store Connect'e tarayıcıda bir kez giriş. Sonrasında formları Claude doldurur; App Store Connect API anahtarı (.p8) oluşturulup indirilirse build ve yükleme tamamen Claude'a geçer.
4. App Review iletişim telefonu.
5. Ekran görüntüleri için simulator'da demo hesabına bir kez giriş.
6. Son "Submit for Review" onayı.
