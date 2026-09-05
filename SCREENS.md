# Ekranlar

Bu dosya, uygulamadaki her ekranı ve o ekranda bulunması gereken özellikleri listeler. Özelliklerin detaylı açıklaması için [FEATURES.md](FEATURES.md).

## Navigasyon (taslak)

Alt tab bar: **Ana Sayfa | Harcamalar | Liste | Kişiler | Profil**

```
Onboarding
  ├─ Giriş / Kayıt
  └─ Ev Oluştur / Ev'e Katıl (davet kodu)

Ana Sayfa (Tab)
  └─ Özet + kısayollar

Harcamalar (Tab)
  ├─ Harcama Listesi
  ├─ Harcama Detayı
  ├─ Harcama Ekle / Düzenle
  ├─ Borç Özeti
  └─ İstatistikler

Liste (Tab)
  ├─ İhtiyaç Listesi
  └─ Kategori Yönetimi (ortak, hem listede hem harcamada erişilebilir)

Kişiler (Tab)
  └─ Kişiler ve IBAN

Profil (Tab)
  ├─ Profil / Kendi IBAN'ım
  └─ Ev Ayarları (davet kodu, ev adı)
```

---

## 1. Giriş / Kayıt

- Email veya telefon ile kayıt/giriş (yöntem henüz netleşmedi, bkz. AGENTS.md).
- Şifremi unuttum akışı.

## 2. Ev Oluştur / Ev'e Katıl

- Yeni kullanıcı: "Ev oluştur" veya "Davet koduyla katıl" seçimi.
- Ev oluşturma: ev adı girme, otomatik davet kodu üretme.
- Ev'e katılma: davet kodu girme.
- Kullanıcı zaten bir eve bağlıysa bu ekrana bir daha düşmez (tek ev kuralı).

## 3. Ana Sayfa

- Genel özet: bu ay toplam ev harcaması, kendi borç/alacak durumu (kısa özet).
- Son eklenen 3-5 harcama.
- İhtiyaç listesinde bekleyen öğe sayısı.
- Hızlı erişim butonları: "Harcama Ekle", "Listeye Ekle".

## 4. Harcama Listesi

- Tüm harcamaların kronolojik listesi (en yeni üstte).
- Her satırda: açıklama, tutar, kim ödedi, kategori ikonu/etiketi, tarih.
- Filtreleme: kategoriye göre, tarihe göre (bu ay / bu yıl / tüm zamanlar).
- "+" butonu ile yeni harcama ekleme.

## 5. Harcama Detayı

- Harcama bilgileri: açıklama, toplam tutar, kim ödedi, tarih, kategori.
- Varsa kalem kalem liste (örn. Market → süt, ekmek, deterjan).
- Varsa fiş fotoğrafı (büyütülebilir görüntüleme).
- Bölüşüm detayı: kim ne kadar borçlu/alacaklı bu harcamadan.
- Düzenle / Sil aksiyonları (yetki: ekleyen kişi veya herkes — karar bekliyor).

## 6. Harcama Ekle / Düzenle

- Açıklama, toplam tutar, kim ödedi (varsayılan: ben), tarih, kategori seçimi.
- Kalem kalem liste ekleme (opsiyonel, satır satır ürün + tutar).
- Fiş fotoğrafı ekleme (kamera / galeri).
- Bölüşüm tipi seçimi: Eşit / Hisse bazlı / Sabit tutar.
  - Hisse bazlı: her kişi için pay sayısı girme (örn. 4, 3, 2).
  - Sabit tutar: her kişi için manuel tutar girme.
  - Katılımcı seçimi: bölüşüme kimlerin dahil olacağı (varsayılan: herkes).
- Kaydet.

## 7. Borç Özeti

- "Kime ne kadar borçlusun" / "kimden ne kadar alacaklısın" listesi (kişi bazlı, net tutar).
- Her satırda tek dokunuşla "Ödendi olarak işaretle" (kolay borç kapatma).
- (MVP sonrası) Basitleştirilmiş borç önerisi: A→C gibi dolaylı borç sadeleştirme.

## 8. İstatistikler

- Zaman filtresi: Bu Ay / Bu Yıl / Tüm Zamanlar.
- Toplam ev harcaması (seçili dönem için).
- Kişi bazlı toplam harcama (kim ne kadar ödedi) — liste veya basit çubuk grafik.
- Kategori bazlı kırılım (hangi kategoriye ne kadar gitti) — liste veya basit grafik.

## 9. İhtiyaç Listesi

- Aktif öğelerin listesi: isim, kategori, ekleyen kişi.
- Kategoriye göre gruplama veya filtreleme.
- Öğe ekleme (isim + kategori seçimi, hızlı ekleme için kategori zorunlu değil).
- Öğeyi "alındı" olarak işaretleme → listeden kalkar, geçmişe düşer.
- Alınan öğe(ler)i seçip "Harcama olarak ekle" aksiyonu (Harcama Ekle ekranına kalem kalem liste önceden dolu şekilde geçiş).
- Geçmiş (alınmış öğeler) görünümü — opsiyonel sekme.

## 10. Kategori Yönetimi

- Mevcut kategorilerin listesi (hem harcama hem liste öğeleri için ortak).
- Yeni kategori ekleme (isim, opsiyonel ikon/renk).
- Kategori düzenleme / silme (silinen kategoriye bağlı kayıtlar "Diğer"e düşer veya kategori boş kalır — karar bekliyor).
- Bu ekrana hem Harcama Ekle hem İhtiyaç Listesi ekranından "Kategori Yönet" kısayoluyla da girilebilir.

## 11. Kişiler ve IBAN

- Ev arkadaşlarının listesi: isim, IBAN (varsa).
- IBAN alanına dokununca panoya kopyalama.
- Kendi satırında "Düzenle" — sadece kendi IBAN'ını değiştirebilir.
- IBAN girilmemiş kişilerde "IBAN eklenmedi" etiketi.

## 12. Profil / Kendi IBAN'ım

- Kullanıcı adı, email/telefon (salt okunur veya sınırlı düzenleme).
- Kendi IBAN'ını girme/düzenleme (Kişiler ekranındaki düzenleme ile aynı veri, buradan da erişilebilir).
- Çıkış yap.

## 13. Ev Ayarları

- Ev adı görüntüleme/düzenleme.
- Davet kodunu görüntüleme/kopyalama/paylaşma (yeni ev arkadaşı eklemek için).
- Ev arkadaşları listesi (Kişiler ekranıyla ortak veri, buradan yönetim amaçlı).

---

## Henüz Netleşmemiş Ekran Kararları

- Harcama silme/düzenleme yetkisi: sadece ekleyen kişi mi, yoksa herkes mi?
- Kategori silindiğinde bağlı kayıtlara ne olacak (varsayılan kategoriye taşınsın mı)?
- Onboarding'de kimlik doğrulama yöntemi netleşince bu ekranın akışı kesinleşecek (bkz. AGENTS.md).
