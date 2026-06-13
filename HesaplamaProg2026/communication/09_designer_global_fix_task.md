# Designer Görev Emri: Global Tablo Esnekliği ve Input Alanları Düzeltmesi

## 1. Görev Hedefi
Tablodaki butonların düzelmesine rağmen, diğer veri giriş alanlarının (0-5km P., Banka Kom., vb.) aşırı daralması ve yarım görünmesi sorununu gidermek. Tablonun tüm ekran boyutlarında profesyonel, modern ve kullanıcı dostu bir şekilde esnemesini sağlamak.

## 2. Beklenen İşlemler
- **Tablo Esnekliğini Geri Getir:** `style.css` içindeki `.data-table` için tanımlanan `table-layout: fixed` özelliğini kaldır. Bu özellik, genişliği sütunlar arasında zorla paylaştırdığı için veri giriş alanlarını eziyor.
- **Sütun Genişliklerini Optimize Et:** 
    - Giriş alanları (`input`) içeren sütunlar için sabit `width` yerine uygun `min-width` değerleri tanımla (Örn: `100px` - `120px`).
    - İşletme adı sütunu için daha geniş bir esneklik bırak (`min-width: 200px`).
    - İşlemler ve Rapor/Kayıt sütunları için belirlediğin dikey (column) yapıyı koru ancak bu sütunların tüm tabloyu daraltmadığından emin ol.
- **Responsive Kontrolü:** 
    - `.container` ve `.table-responsive` yapılarını gözden geçirerek, tablonun çok fazla sütun içermesi durumunda yatayda kaydırılabilir (scrollable) kalmasını sağla, ancak hücre içeriklerinin asla birbirinin üzerine binmesine veya yarım kalmasına izin verme.
- **Modern Görünüm:** Input alanlarının iç boşluklarını (padding) ve font boyutlarını, dar sütunlarda bile okunabilir kalacak şekilde optimize et.

## 3. Kısıtlamalar
- Kesinlikle dış kütüphane ekleme.
- `script.js` içindeki hesaplama mantığına dokunma.
- Sayfa genişliğini (`max-width: 1400px`) koru veya gerekirse (`1600px` gibi) profesyonelce genişlet.

## 4. Çıktı Beklentisi
- Yapılan esneklik ayarlarının özeti.
- İşlem tamamlandığında `communication/10_designer_final_fix_report.md` dosyasını oluştur.
