# Özellikler

## 1. Ortak Harcamalar (Expense Splitting)

- Kullanıcı bir harcama ekler: ne alındı, ne kadar ödendi, kim ödedi.
- Bir harcamanın altına **kalem kalem liste** eklenebilir (örn. harcama "Market", altında: süt, ekmek, deterjan — her kalemin kendi tutarı olabilir, toplamı harcama tutarını oluşturur). Zorunlu değil; tek kalemlik basit harcama da girilebilir.
- Harcamaya **fiş/fatura fotoğrafı** eklenebilir (kamera veya galeriden).
- Harcama, ev arkadaşları arasında bölüştürülür:
  - Eşit bölüşüm (varsayılan)
  - **Hisse bazlı bölüşüm**: her kişiye pay (share) sayısı verilir, tutar bu paylara göre bölünür — örn. biri 4 pay, biri 3 pay, biri 2 pay alırsa harcama 9 paya bölünüp herkese payı kadar dağıtılır. Yüzdelik (%) girişi yok, hesaplama pay sayısı üzerinden yapılır.
  - Sabit tutarlarla bölüşüm (örn. "sen 50 TL, ben 100 TL öde" gibi kişi başı manuel tutar)
  - Sadece belirli kişiler arasında bölüşüm (herkes değil, seçilenler) — eşit ve hisse bazlı bölüşümle birlikte kullanılabilir
- Harcamaya kategori atanabilir (bkz. "Kategoriler" — ihtiyaç listesiyle aynı dinamik kategori sistemi kullanılır).
- Her kullanıcı için özet: "kime ne kadar borçlusun", "kimden ne kadar alacaklısın".
- **Kolay borç kapatma**: bir borcu tek dokunuşla "ödendi" işaretleme (gerçek para transferi yapılmaz, sadece kayıt — gerçek ödeme IBAN üzerinden kullanıcıların kendi arasında yapılır).
- Basitleştirilmiş borç kapatma önerisi (A, B'ye borçlu; B, C'ye borçlu ise sistem A→C şeklinde öneri sunabilir — Splitwise'daki "simplify debts" mantığı) — MVP sonrası.
- Harcama geçmişi listesi.

## 2. İstatistikler

- Toplam harcama: bu ay, bu yıl, tüm zamanlar (filtre olarak seçilebilir).
- Kişi bazlı toplam: kim ne kadar harcadı (ödedi) — bu ay / bu yıl / tüm zamanlar.
- Kategori bazlı kırılım: hangi kategoriye ne kadar gitmiş (örn. bu ay yemeğe X TL, temizliğe Y TL).
- Basit grafik/özet ekranı (çubuk grafik veya liste halinde, MVP'de basit tutulabilir).

## 3. İhtiyaç / Alışveriş Listesi

- Ortak liste: herkes ekleyebilir, görebilir, işaretleyebilir.
- Bir öğe eklenir (örn. "bulaşık deterjanı") → herkesin ekranında anlık görünür.
- Her öğeye **kategori** atanabilir (bkz. "Kategoriler").
- Biri alınca "alındı" olarak işaretler, listeden kalkar veya geçmişe düşer.
- Bir listeden alışveriş yapıldığında, doğrudan o öğeleri harcama olarak eklemeye dönüştürme (liste → harcama entegrasyonu, kalem kalem liste özelliğiyle uyumlu).
- Opsiyonel: kim eklemiş, ne zaman eklenmiş bilgisi.

## 4. Kategoriler (Dinamik)

- Kategoriler sabit/kod içine gömülü değil, **kullanıcı tanımlı**: ev, istediği kategoriyi ekleyip düzenleyip silebilir (örn. Yemek, Temizlik, E-sipariş, Fatura, vb. — örnekler, zorunlu liste değil).
- Kategoriler hem ihtiyaç listesi öğelerinde hem harcamalarda ortak kullanılır (tek kategori havuzu).
- Yeni bir ev için birkaç varsayılan kategori önerilebilir (Yemek, Temizlik, Fatura, Diğer gibi) ama bunlar da düzenlenebilir/silinebilir.

## 5. Kişiler ve IBAN

- Ev arkadaşlarının listelendiği bir ekran: her kişinin adı ve IBAN'ı (varsa) görünür.
- IBAN alanı **kopyalanabilir** (dokununca panoya kopyalanır).
- Her kullanıcı **kendi IBAN'ını** girip düzenleyebilir; başkasının IBAN'ını göremez/değiştiremez, sadece görüntüler.
- IBAN girilmemişse boş/"eklenmedi" olarak görünür.

## 6. Ev / Grup Yönetimi

- Tek bir ev yönetilir — çoklu ev desteği yok, kullanıcı birden fazla eve ait olamaz. Bu MVP'nin kalıcı kapsamı, ileride genişletme planlanmıyor.
- Kullanıcı bir "ev" oluşturur veya davet linkiyle/koduyla katılır.
- Ev arkadaşlarının listesi.

## 7. Bildirimler (MVP sonrası)

- Yeni harcama eklendiğinde push bildirim.
- Listeye yeni ihtiyaç eklendiğinde push bildirim.
- Borç hatırlatması **yok** — kapsam dışı.

## Kapsam Dışı (şimdilik)

- Gerçek para transferi / ödeme entegrasyonu (Papara, IBAN üzerinden otomatik transfer vb.) — uygulama sadece IBAN'ı gösterir ve kaydı tutar, gerçek ödeme kullanıcıların kendi bankacılık uygulaması üzerinden yapılır.
- Çoklu ev / çoklu kullanıcı-ev ilişkisi yönetimi.
- Borç hatırlatma bildirimleri.
- Çoklu para birimi desteği.
- Web arayüzü (öncelik mobil; web daha sonra değerlendirilebilir).

## MVP Sırası (öneri)

1. Ev oluşturma / katılma, kişiler ekranı (IBAN görüntüleme + kendi IBAN'ını düzenleme)
2. Dinamik kategoriler (ekleme/düzenleme/silme)
3. İhtiyaç listesi (ekle / kategori ata / işaretle / sil)
4. Harcama ekleme (kalem kalem liste, fiş fotoğrafı, kategori) + eşit bölüşüm + borç özeti + kolay borç kapatma
5. Liste öğesini harcamaya çevirme
6. Hisse bazlı / sabit tutarlı bölüşüm
7. İstatistikler (ay/yıl bazlı toplam ve kişi/kategori kırılımı)
8. Basitleştirilmiş borç kapatma önerisi, bildirimler
