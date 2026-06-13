# Kodlama ve Geliştirme Standartları

## 1. Genel Prensipler
- **DRY (Don't Repeat Yourself):** Tekrarlayan kod blokları fonksiyon haline getirilmelidir.
- **KISS (Keep It Simple, Stupid):** Karmaşık çözümler yerine en basit ve okunabilir çözüm tercih edilmelidir.
- **Yorum Satırları:** Fonksiyonların ne yaptığı (özellikle karmaşık mantıklarda) açıklanmalıdır.

## 2. JavaScript Kuralları
- Değişken isimlendirmeleri `camelCase` formatında olmalıdır (Örn: `calculateTotal`, `businessId`).
- `var` kullanımı yasaktır. Sadece `const` ve `let` kullanılmalıdır.
- Tüm DOM element seçimleri (selectors) sayfa başında veya bir konfigürasyon objesi içinde tanımlanmalıdır. Kodun içine dağıtılmamalıdır.
- `console.log` ifadeleri sadece geliştirme (debug) aşamasında kullanılmalı, canlıya (production) alınırken temizlenmelidir (Hata yakalama hariç).

## 3. HTML/CSS Kuralları
- HTML içerisinde inline CSS (`style="..."`) kullanımından kaçınılmalıdır. Tüm stiller `style.css` dosyasında olmalıdır.
- CSS değişkenleri (Variables) renkler ve fontlar için kullanılmaya devam edilmelidir.
- Semantic HTML etiketleri (`<header>`, `<main>`, `<footer>`, `<section>`) kullanılmalıdır.

## 4. Güvenlik ve Veri
- `localStorage` işlemleri her zaman `try-catch` blokları içinde yapılmalıdır.
- Kullanıcı girdileri (Inputs) işlenmeden önce sanitize edilmeli veya tip kontrolünden geçirilmelidir (Örn: Sayı alanına harf girilmemesi).