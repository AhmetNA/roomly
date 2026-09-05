# Özellikler

## 1. Ortak Harcamalar (Expense Splitting)

- Kullanıcı bir harcama ekler: ne alındı, ne kadar ödendi, kim ödedi.
- Harcama, ev arkadaşları arasında bölüştürülür:
  - Eşit bölüşüm (varsayılan)
  - Özel oranlarla / tutarlarla bölüşüm (örn. biri daha az kullandıysa)
  - Sadece belirli kişiler arasında bölüşüm (herkes değil, seçilenler)
- Her kullanıcı için özet: "kime ne kadar borçlusun", "kimden ne kadar alacaklısın".
- Basitleştirilmiş borç kapatma (A, B'ye borçlu; B, C'ye borçlu ise sistem A→C şeklinde öneri sunabilir — Splitwise'daki "simplify debts" mantığı).
- "Borcu kapat / ödendi" işaretleme (gerçek para transferi yapılmaz, sadece kayıt).
- Harcama geçmişi ve ev bazlı toplam harcama görünümü.
- Kategori (market, fatura, temizlik malzemesi, vb.) — opsiyonel, MVP sonrası.

## 2. İhtiyaç / Alışveriş Listesi

- Ortak liste: herkes ekleyebilir, görebilir, işaretleyebilir.
- Bir öğe eklenir (örn. "bulaşık deterjanı") → herkesin ekranında anlık görünür.
- Biri alınca "alındı" olarak işaretler, listeden kalkar veya geçmişe düşer.
- Bir listeden alışveriş yapıldığında, doğrudan o öğeleri harcama olarak eklemeye dönüştürme (liste → harcama entegrasyonu). Bu iki modülü birbirine bağlayan asıl değer burada.
- Opsiyonel: kim eklemiş, ne zaman eklenmiş bilgisi.

## 3. Ev / Grup Yönetimi

- Kullanıcı bir "ev" (household/grup) oluşturur veya davet linkiyle/koduyla katılır.
- Ev arkadaşlarının listesi, biri çıktığında/yeni biri geldiğinde geçmiş harcamaların tutarlılığı.
- Tek kullanıcı birden fazla eve ait olabilir mi? (MVP'de hayır, tek ev yeterli — ileride genişletilebilir.)

## 4. Bildirimler (MVP sonrası)

- Yeni harcama eklendiğinde push bildirim.
- Listeye yeni ihtiyaç eklendiğinde push bildirim.
- Borç hatırlatması.

## Kapsam Dışı (şimdilik)

- Gerçek para transferi / ödeme entegrasyonu (Papara, IBAN vb.) — sadece kayıt tutulur, gerçek ödeme kullanıcıların kendi arasında.
- Çoklu para birimi desteği.
- Web arayüzü (öncelik mobil; web daha sonra değerlendirilebilir).

## MVP Sırası (öneri)

1. Ev oluşturma / katılma
2. Harcama ekleme + eşit bölüşüm + borç özeti
3. İhtiyaç listesi (ekle / işaretle / sil)
4. Liste öğesini harcamaya çevirme
5. Özel bölüşüm oranları, basitleştirilmiş borç kapatma
6. Bildirimler
