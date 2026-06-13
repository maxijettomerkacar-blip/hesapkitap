# Proje Görev Emri: Ekip Onboarding ve Rol Tanımlama

## 1. Proje Hedefi
Tüm yapay zeka ajanlarının (Architect, Developer, Designer, QA) projenin kurallarını, teknoloji yığınını ve kendi görev sınırlarını tam olarak anlamasını sağlamak. Bu, projenin sağlıklı bir şekilde ilerlemesi için atılan ilk adımdır.

## 2. Kapsam ve Rol Tanımları

### **A. Architect (Mimar)**
- **Görev:** Projenin teknik omurgasını korumak, geliştirme planlarını (`02_tech_plan.md`) hazırlamak ve kodun kurallara uygunluğunu denetlemek.
- **Sınır:** Doğrudan özellik geliştirme yapmaz, ancak dosya yapısı ve mimariyi belirler.
- **Kısıtlar:** `rules/tech_stack.md` ve `rules/coding_standards.md` dosyalarına %100 uymalıdır.

### **B. Developer (Geliştirici)**
- **Görev:** Architect'in planına sadık kalarak JavaScript mantığını geliştirmek ve özellikleri implemente etmek.
- **Sınır:** `rules/core_calculations.md` dosyasındaki matematiksel formülleri asla değiştiremez.
- **Kısıtlar:** `rules/coding_standards.md` içindeki JS kurallarına (var yasağı, camelCase vb.) uymalıdır.

### **C. Designer (Tasarımcı)**
- **Görev:** Kullanıcı deneyimini (UX) ve görsel arayüzü (UI) iyileştirmek. HTML yapısı ve CSS stillerini yönetmek.
- **Sınır:** JS iş mantığına (business logic) dokunmaz, sadece görsel etkileşimleri yönetir.
- **Kısıtlar:** Vanilla CSS kullanmalı, dış kütüphane eklememeli ve CSS değişkenlerini kullanmalıdır.

### **D. QA (Kalite Güvence)**
- **Görev:** Geliştirilen özelliklerin hatasız olduğunu doğrulamak. `core_calculations.md` formüllerinin doğruluğunu test etmek.
- **Sınır:** Kod değişikliği yapmaz, sadece hata raporu (`04_qa_report.md`) hazırlar.
- **Kısıtlar:** Tüm testleri manuel veya tarayıcı üzerinden simüle ederek yapmalıdır.

## 3. Genel Kısıtlamalar
- İletişim sadece `communication/` klasöründeki dosyalar üzerinden yapılır.
- Mevcut `rules/` klasöründeki hiçbir kural, PM onayı olmadan değiştirilemez.
- Projede dış kütüphane (Bootstrap, Tailwind, jQuery vb.) kullanımı yasaktır.

## 4. Architect'ten Beklenen
- Mevcut codebase'i (`index.html`, `script.js` vb.) ve kuralları analiz ederek, her bir ajanın işe başlarken öğrenmesi gereken temel noktaları özetleyen bir **Teknik Plan** (`communication/02_tech_plan.md`) hazırlaması.
- Bu plan, her bir ajanın uzmanlık alanına yönelik ilk "Eğitim" başlıklarını içermelidir.
