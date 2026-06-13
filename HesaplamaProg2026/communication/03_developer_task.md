# Developer Görev Emri: Altyapı Kontrolü ve İlk Fonksiyonel Doğrulama

## 1. Görev Hedefi
Mevcut `script.js` dosyasındaki hesaplama mantığının ve veri yapısının, `rules/core_calculations.md` ve `communication/02_tech_plan.md` belgelerine %100 uyumlu olduğunu doğrulamak ve gerekiyorsa düzeltmek.

## 2. Beklenen İşlemler
- **Kritik Kontrol:** `calculateAndDisplayRow` (veya benzeri hesaplama yapan fonksiyon) içindeki formüllerin, `core_calculations.md` dosyasındaki `Net Tutar = KDV Dahil + BK - POS - NAKIT` formülüyle eşleşip eşleşmediğini kontrol et.
- **Değişken Standartları:** `coding_standards.md` uyarınca `var` kullanımı varsa `let/const` ile değiştir. İsimlendirmelerin `camelCase` olduğunu doğrula.
- **Hata Yönetimi:** `localStorage` işlemlerinin `try-catch` blokları içinde yapıldığından emin ol.
- **Boş Veri Kontrolü:** Girdiler boş (`null/undefined`) olduğunda "0" olarak kabul edildiğini garantile.

## 3. Kısıtlamalar
- Kesinlikle dış kütüphane ekleme.
- `index.html` dosyasındaki HTML yapısını veya `style.css` dosyasındaki stilleri değiştirme (Bu Designer'ın görevidir).
- Sadece `script.js` üzerinde çalış.

## 4. Çıktı Beklentisi
- Yapılan değişikliklerin özeti.
- İşlem tamamlandığında Architect ve PM'e rapor sunmak üzere `communication/04_developer_report.md` dosyasını oluştur.
