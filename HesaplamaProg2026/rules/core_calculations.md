# Çekirdek Hesaplama Kuralları (DEĞİŞTİRİLEMEZ)

Bu doküman, projedeki finansal hesaplamaların temel mantığını içerir. Hiçbir refactoring veya geliştirme süreci, bu formülleri değiştirmemelidir.

## 1. Temel Değişkenler
- **NP (Normal Paket):** 0-5 km arası paket sayısı (Input).
- **DP (Uzak Paket):** 5+ km üzeri paket sayısı (Input).
- **NF (Normal Ücret):** İşletmeye özel 0-5 km paket başı ücret (TL).
- **DF (Uzak Ücret):** İşletmeye özel 5+ km paket başı ücret (TL).
- **KDV_R (KDV Oranı):** İşletmeye özel KDV yüzdesi (Örn: 20).
- **BK (Banka Komisyonu):** İşletmeye yansıtılan komisyon tutarı (TL).
- **POS (Pos Bakiye):** İşletmenin bizdeki POS alacağı (TL).
- **NAKIT (Nakit Bakiye):** İşletmenin bizdeki nakit alacağı (TL).

## 2. Formüller

### A. Hakediş (KDV Hariç)
Paket sayılarının birim fiyatlarla çarpımıdır.
`Hakediş = (NP * NF) + (DP * DF)`

### B. KDV Tutarı
Hakediş üzerinden hesaplanan vergi tutarıdır.
`KDV Tutarı = Hakediş * (KDV_R / 100)`

### C. KDV Dahil Toplam
Hakediş ve verginin toplamıdır.
`KDV Dahil = Hakediş + KDV Tutarı`

### D. Net Hesap (Alacak/Verecek)
KDV dahil tutara banka komisyonu eklenir, işletmenin içerideki bakiyeleri düşülür.
`Net Tutar = KDV Dahil + BK - POS - NAKIT`

## 3. Veri Tipi ve Yuvarlama Kuralları
- Tüm parasal girdiler `Float` (Ondalıklı Sayı) olarak işlenmelidir.
- Boş bırakılan (null/undefined) sayısal alanlar hesaplamada `0` olarak kabul edilmelidir.
- Gösterim (Display) aşamasında para birimleri `toFixed(2)` (virgülden sonra 2 hane) formatında olmalıdır.
- Veritabanı/LocalStorage kaydında `Number` tipi korunmalıdır, string olarak saklanmamalıdır.