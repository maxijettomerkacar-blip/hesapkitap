# Designer Görev Emri: Tablo Alan Kazanımı ve Dikey Başlık Uygulaması

## 1. Görev Hedefi
Tablonun tüm sütunlarının (toplam 17 sütun) ekrana sığmasını sağlamak, yatay kaydırma çubuğunu (scroll) ortadan kaldırmak ve profesyonel bir veri matrisi görünümü elde etmek.

## 2. Beklenen İşlemler
- **Sütun Başlıklarını Döndür (Rotate):** 
    - Tablo başlıklarındaki (`thead th`) metinleri 45 derece dikey (veya eğik) hale getir. Bu, sütun genişliğini metin uzunluğuna göre değil, içeriğe (input/sayı) göre ayarlamanı sağlayacak.
    - `transform: rotate(-45deg)` kullanarak başlık hücrelerinin yüksekliğini artır ve genişliğini daralt.
- **İşletme Sütunu Optimizasyonu:** 
    - "İşletme" sütununu mümkün olan en dar seviyeye çek (`min-width: 150px` gibi), ancak isimlerin okunabilir kalması için `white-space: nowrap` ve `overflow: hidden; text-overflow: ellipsis;` stratejilerini değerlendir.
- **Veri Giriş Alanlarını Daralt:** 
    - Paket sayıları (0-5km P., 5+km P.) ve tutar alanları (`input[type="number"]`) için `padding` değerlerini minimize et (`padding: 0.25rem`).
    - Bu sütunların `min-width` değerlerini 60px-80px arasına çekerek alan kazan.
- **Global Konteyner:** 
    - Sayfayı 1600px genişlikte tut veya 1400px'e geri çekerek tüm tablonun bu alana "fit" (tam sığması) olmasını sağla.
    - Yatay kaydırma (horizontal scroll) sadece çok küçük ekranlarda çıkmalı, standart masaüstü çözünürlüklerinde her şey tek bakışta görülmeli.

## 3. Kısıtlamalar
- Sadece `style.css` üzerinde çalış.
- JS iş mantığına (hesaplamalara) dokunma.
- Mevcut renk paletini ve modern tasarım dilini koru.

## 4. Çıktı Beklentisi
- Yapılan alan kazanımı tekniklerinin özeti.
- İşlem tamamlandığında `communication/11_designer_compact_ui_report.md` dosyasını oluştur.
