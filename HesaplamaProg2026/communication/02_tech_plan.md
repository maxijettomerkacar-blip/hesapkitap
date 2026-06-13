# Teknik Plan: Proje Mimarisi ve Ekip Onboarding (v1.0)

## 1. Proje Özeti ve Amacı
Bu proje, işletmelerin paket başı hakedişlerini, KDV ve diğer finansal parametreleri (banka komisyonu, POS bakiyesi, nakit bakiye) kullanarak hesaplayan ve raporlayan bir web uygulamasıdır. Temel amaç, hatasız hesaplama ve kullanıcı dostu bir raporlama arayüzü sunmaktır.

## 2. Mevcut Mimari Yapı
Uygulama, tamamen **Client-Side** (istemci tarafı) çalışan bir yapıya sahiptir:
- **Veri Katmanı:** `localStorage` (Tarayıcı yerel depolama) üzerinde JSON formatında tutulur.
- **Mantık Katmanı (Logic):** `script.js` ve `reports.js` dosyalarında Vanilla JS ile yönetilir.
- **Sunum Katmanı (UI):** Semantic HTML5 ve CSS3 (Variables destekli) kullanılarak oluşturulmuştur.
- **Dosya Organizasyonu:**
    - `/`: Uygulama dosyaları (`index.html`, `style.css`, `script.js` vb.).
    - `/rules/`: İş kuralları ve standartları (Markdown).
    - `/communication/`: Ekipler arası koordinasyon dosyaları.

## 3. Ajan Bazlı Kritik Teknik Detaylar

### **Architect (Mimar)**
- **Kritik Odak:** Projenin dosya yapısını korumak ve `rules/` klasöründeki kuralların (özellikle teknoloji kısıtlamalarının) dışına çıkılmamasını sağlamak.
- **Öğrenilecek Noktalar:** `script.js` içindeki `predefinedBusinessData` yapısını ve `localStorage` anahtar (key) yönetimini anlamak.
- **Mimari Sınır:** Yeni bir kütüphane eklenmesine izin vermez.

### **Developer (Geliştirici)**
- **Kritik Odak:** `rules/core_calculations.md` dosyasındaki matematiksel formülleri `script.js` içindeki `calculateAndDisplayRow` fonksiyonuna birebir uygulamak.
- **Öğrenilecek Noktalar:** `camelCase` isimlendirme standardı, `var` yerine `const/let` kullanımı ve `try-catch` blokları ile güvenli `localStorage` işlemleri.
- **Teknik Sınır:** Formül mantığını kendi başına değiştiremez, sadece implemente eder.

### **Designer (Tasarımcı)**
- **Kritik Odak:** `style.css` içindeki CSS değişkenlerini (`--primary-color`, `--border-radius` vb.) kullanarak tutarlı bir UI sunmak.
- **Öğrenilecek Noktalar:** Modal yapısı (`.modal-overlay`, `.modal-content-wrapper`) ve tablonun responsive (`.table-responsive`) davranışları.
- **Tasarım Sınırı:** JS dosyalarındaki business logic (hesaplama) kodlarına müdahale edemez.

### **QA (Kalite Güvence)**
- **Kritik Odak:** Hesaplama sonuçlarının `core_calculations.md` ile uyumunu doğrulamak.
- **Öğrenilecek Noktalar:** `formatCurrency` fonksiyonunun (`toFixed(2)`) çıktılarını ve boş (null/undefined) girdilerin "0" olarak kabul edilip edilmediğini test etmek.
- **Doğrulama Sınırı:** Kodda düzeltme yapmaz, sadece rapor hazırlar.

## 4. Kritik Teknik Kısıtlamalar (Hatırlatma)
1. **Dış Kütüphane Yasaktır:** Bootstrap, jQuery, React gibi araçlar kullanılmayacaktır.
2. **Vanilla JS/CSS:** Sadece saf JavaScript ve CSS kullanılacaktır.
3. **Formül Dokunulmazlığı:** `core_calculations.md` içindeki Net Hesap formülü (`KDV Dahil + BK - POS - NAKIT`) projenin kalbidir ve değiştirilemez.
4. **LocalStorage Güvenliği:** Veri kayıplarını önlemek için versiyonlama (`_v6` vb.) ve hata yakalama (`try-catch`) zorunludur.

## 5. İlk Eğitim Adımları
- **Adım 1:** Tüm ekip `rules/` altındaki 3 dokümanı okumalıdır.
- **Adım 2:** Developer, `script.js` içindeki `businesses` ve `tableData` objelerinin yapısını incelemelidir.
- **Adım 3:** Designer, `style.css` içindeki renk paletini (`:root`) analiz etmelidir.
- **Adım 4:** QA, `core_calculations.md` temelinde bir test senaryosu listesi hazırlamalıdır.
