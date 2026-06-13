# Designer Görev Emri: Tablo Buton Yerleşimi ve Taşma Sorunu Düzeltme

## 1. Görev Hedefi
Ana hesaplama tablosundaki "İşlemler" ve "Rapor / Kayıt" sütunlarında bulunan butonların çerçeve dışına taşması ve yarım görünmesi sorununu düzeltmek.

## 2. Beklenen İşlemler
- **Sütun Genişliklerini Ayarla:** `style.css` dosyasında `.data-table` için `table-layout: fixed` kullanıldığı için her sütunun genişliği kritik önemdedir. 
    - 16. sütun ("İşlemler") için yeterli sabit genişliği tanımla (Örn: `120px` veya `8rem`).
    - 17. sütun ("Rapor / Kayıt") için yeterli sabit genişliği tanımla (Örn: `140px` veya `9rem`).
- **Buton Yerleşimi:** 
    - `.data-table .action-buttons` (veya ilgili sütun hücreleri) içindeki butonların yan yana sığmadığı durumlarda alt alta (vertical) dizilmesini veya daha kompakt görünmesini sağla.
    - `flex-direction: column` veya `flex-wrap: wrap` kullanarak butonların hücre sınırları içinde kalmasını garantile.
- **Hizalama:** Butonların hücre içinde ortalı ve düzgün bir boşlukla (gap) durduğundan emin ol.

## 3. Kısıtlamalar
- Sadece `style.css` üzerinde çalış.
- JS iş mantığına dokunma.
- Mevcut modern tasarımı ve renk paletini bozma.

## 4. Çıktı Beklentisi
- Yapılan CSS değişikliklerinin özeti.
- İşlem tamamlandığında `communication/09_designer_report_v2.md` dosyasını oluştur.
