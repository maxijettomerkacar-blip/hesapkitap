# QA Görev Emri: Fonksiyonel ve Matematiksel Doğrulama Testi

## 1. Görev Hedefi
Developer'ın tamamladığı teknik altyapıyı ve hesaplama motorunu, `rules/core_calculations.md` kuralları çerçevesinde test ederek projenin hatasız çalıştığını garanti altına almak.

## 2. Beklenen İşlemler
- **Matematiksel Test:** `core_calculations.md` dosyasındaki formülleri (NP, DP, NF, DF, KDV, BK, POS, NAKIT) kullanarak en az 5 farklı senaryoda manuel hesaplama yap ve uygulamanın sonuçlarıyla karşılaştır.
- **Uç Durum (Edge Case) Testleri:** 
    - Tüm alanlar boş bırakıldığında hesaplama sonucu ne oluyor? (Beklenen: 0)
    - Çok büyük sayılar girildiğinde (`Infinity` veya taşma) sistem nasıl tepki veriyor?
    - `localStorage` temizlendiğinde veya bozulduğunda uygulama çöküyor mu?
- **Fonksiyonellik Testi:** İşletme ekleme, düzenleme, silme ve rapor kopyalama fonksiyonlarının sorunsuz çalıştığını doğrula.
- **Tarayıcı Uyumluluğu:** Uygulamanın en az iki farklı tarayıcıda (Chrome, Edge vb.) aynı şekilde çalıştığını kontrol et.

## 3. Kısıtlamalar
- Kod üzerinde düzeltme yapma, sadece bulguları raporla.
- Hata bulursan `communication/07_qa_report.md` dosyasında detaylandır (beklenen sonuç vs. gerçek sonuç).

## 4. Çıktı Beklentisi
- Bulunan hataların (varsa) listesi.
- Test senaryolarının özeti ve geçme/kalma durumları.
- İşlem tamamlandığında `communication/07_qa_report.md` dosyasını oluştur.
