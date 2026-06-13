document.addEventListener('DOMContentLoaded', () => {
    console.log("reports.js yüklendi - Detay Modalı ve Ek Bilgiler Eklendi.");

    const savedReportsTableBody = document.getElementById('savedReportsTableBody');
    const noReportsMessage = document.getElementById('noReportsMessage');
    const filterBusinessNameInput = document.getElementById('filterBusinessName');
    const filterHesapTarihiInput = document.getElementById('filterHesapTarihi');
    const filterPaymentStatusSelect = document.getElementById('filterPaymentStatus');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Modal Elementleri
    const reportDetailModalOverlay = document.getElementById('reportDetailModalOverlay');
    const reportModalTitle = document.getElementById('reportModalTitle');
    const reportDetailModalBody = document.getElementById('reportDetailModalBody');
    const closeReportDetailModalBtn = document.getElementById('closeReportDetailModalBtn');
    const cancelReportDetailModalBtn = document.getElementById('cancelReportDetailModalBtn');


    const SAVED_REPORTS_KEY = 'hakedisApp_savedReports_v1';
    let allSavedReports = [];
    let displayedReports = [];

    let currentSort = {
        column: 'savedAt',
        direction: 'desc'
    };

    function loadSavedReports() {
        try {
            const storedReports = localStorage.getItem(SAVED_REPORTS_KEY);
            allSavedReports = storedReports ? JSON.parse(storedReports) : [];
            displayedReports = [...allSavedReports]; 
            console.log("Kaydedilmiş raporlar yüklendi:", allSavedReports.length);
        } catch (e) {
            console.error("Kaydedilmiş raporları yükleme hatası:", e);
            allSavedReports = [];
            displayedReports = [];
        }
    }

    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) { return '0.00'; }
        return amount.toFixed(2);
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) { return dateString; }
    }
     function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '-';
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return dateTimeString; }
    }

    // Modal Fonksiyonları
    function openReportDetailModal() {
        if(reportDetailModalOverlay) {
            reportDetailModalOverlay.style.display = 'flex';
            requestAnimationFrame(() => {
                reportDetailModalOverlay.classList.add('active');
            });
        }
    }

    function closeReportDetailModal() {
        if(reportDetailModalOverlay) {
            reportDetailModalOverlay.classList.remove('active');
            const handleTransitionEnd = () => {
                if (!reportDetailModalOverlay.classList.contains('active')) {
                    reportDetailModalOverlay.style.display = 'none';
                }
                reportDetailModalOverlay.removeEventListener('transitionend', handleTransitionEnd);
            };
            reportDetailModalOverlay.addEventListener('transitionend', handleTransitionEnd);
        }
    }

    if(closeReportDetailModalBtn) closeReportDetailModalBtn.addEventListener('click', closeReportDetailModal);
    if(cancelReportDetailModalBtn) cancelReportDetailModalBtn.addEventListener('click', closeReportDetailModal);
    if(reportDetailModalOverlay) {
        reportDetailModalOverlay.addEventListener('click', (event) => {
            if (event.target === reportDetailModalOverlay) {
                closeReportDetailModal();
            }
        });
    }

    function showReportDetails(reportId) {
        const report = allSavedReports.find(r => r.reportId === reportId);
        if (!report) {
            alert("Rapor detayı bulunamadı.");
            return;
        }

        reportModalTitle.textContent = `${report.businessName} - Rapor Detayları (${formatDate(report.hesapTarihi)})`;
        
        let detailHTML = `<div class="report-detail-grid">`; // CSS'te grid tanımı yapabiliriz

        const detailMapping = {
            "Kayıt ID": report.reportId,
            "İşletme ID": report.businessId,
            "Kayıt Zamanı": formatDateTime(report.savedAt),
            "Hesap Tarihi (Rapor)": formatDate(report.hesapTarihi),
            "İşletme Adı": report.businessName,
            "<hr><b>Paket Bilgileri (Kayıt Anı)</b>": "",
            "Normal Paket Ücreti (0-5km)": `${formatCurrency(report.normalPackageFeeAtSave)} ₺`,
            "Uzak Paket Ücreti (5+km)": `${formatCurrency(report.distantPackageFeeAtSave)} ₺`,
            "Sistem Paketi Paket Sayısı": report.normalPackages,
            "Uzak ve İlave Paket Sayısı": report.distantPackages,
            "Toplam Paket Sayısı": report.totalPackages,
            "<hr><b>Hakediş Detayları (Kayıt Anı)</b>": "",
            "Hakediş (KDV Hariç)": `${formatCurrency(report.hakedis)} ₺`,
            "KDV Oranı (%)": report.vatRateAtSave,
            "KDV Tutarı": `${formatCurrency(report.vatAmount)} ₺`,
            "KDV Dahil Toplam": `${formatCurrency(report.totalWithVat)} ₺`,
            "<hr><b>Ek İşlemler & Mahsuplaşma (Kayıt Anı)</b>": "",
            "Banka Komisyonu": `${formatCurrency(report.bankCommission)} ₺`,
            "POS Bakiye": `${formatCurrency(report.posBalance)} ₺`,
            "Nakit Bakiye": `${formatCurrency(report.cashBalance)} ₺`,
            "Net Alacak/Verecek": `${formatCurrency(report.netTotal)} ₺`,
            "<hr><b>Diğer Bilgiler (Kayıt Anı)</b>": "",
            "Ödeme Durumu": report.paymentStatus,
            "Kota Durumu": report.hasQuota,
            "Açıklama": report.notes || "-"
        };

        for (const key in detailMapping) {
            if (key.startsWith("<hr>")) { // Ayraçlar için
                 detailHTML += `<div class="detail-separator" colspan="2">${key}</div>`;
            } else {
                detailHTML += `
                    <div class="detail-label">${key}:</div>
                    <div class="detail-value">${detailMapping[key]}</div>
                `;
            }
        }
        detailHTML += `</div>`;
        reportDetailModalBody.innerHTML = detailHTML;
        openReportDetailModal();
    }


    async function copySavedReportToClipboard(reportId) {
        const report = allSavedReports.find(r => r.reportId === reportId);
        if (!report) {
            alert("Rapor detayı bulunamadı.");
            return;
        }

        const businessName = report.businessName;
        const hesapTarihi = report.hesapTarihi;
        const normalPackages = report.normalPackages;
        const distantPackages = report.distantPackages;
        const totalPackages = report.totalPackages;
        const hakedis = report.hakedis;
        const vatAmount = report.vatAmount;
        const totalWithVat = report.totalWithVat;
        const bankCommission = report.bankCommission;
        const posBalance = report.posBalance;
        const cashBalance = report.cashBalance;
        const netTotal = report.netTotal;
        const paymentStatus = report.paymentStatus; // Bu zaten alınıyordu
        const notes = report.notes || '-';
        const vatPercent = report.vatRateAtSave; 
        const cancelledPackages = 0; 

        const reportDateFormatted = hesapTarihi ? new Date(hesapTarihi).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Belirtilmedi';

        let reportString = `📊 *${businessName} - Hakediş Raporu (Kayıt)* 📊\n`;
        reportString += `-----------------------------------\n`;
        reportString += `🗓️ *Hesap Tarihi:* ${reportDateFormatted}\n`;
        reportString += `💾 *Kayıt Tarihi:* ${formatDateTime(report.savedAt)}\n`;
        reportString += `📦 *Paket Bilgileri:*\n`;
        reportString += `   ▫️ Sistem Paketi: ${normalPackages} adet\n`;
        reportString += `   ▫️ Uzak ve İlave Paket: ${distantPackages} adet\n`;
        reportString += `   ▪️ *Toplam Teslim Edilen:* ${totalPackages} adet\n`;
        if (cancelledPackages > 0) {
            reportString += `   🚫 *İptal Edilen Paket:* ${cancelledPackages} adet\n`;
        }
        reportString += `-----------------------------------\n`;
        reportString += `💰 *Hakediş Detayları:*\n`;
        reportString += `   ▫️ Paketlerden Hakediş (KDV Hariç): ${formatCurrency(hakedis)} ₺\n`;
        reportString += `   ▫️ KDV Tutarı (%${vatPercent}): ${formatCurrency(vatAmount)} ₺\n`;
        reportString += `   ▪️ *KDV Dahil Toplam Hakediş:* ${formatCurrency(totalWithVat)} ₺\n`;
        reportString += `-----------------------------------\n`;
        reportString += `⚙️ *Ek İşlemler & Mahsuplaşma:*\n`;
        reportString += `   ➕ Banka Pos Komisyonu: ${formatCurrency(bankCommission)} ₺\n`;
        reportString += `   ➖ İşletmenin Bizdeki POS Bakiyesi: ${formatCurrency(posBalance)} ₺\n`;
        reportString += `   ➖ İşletmenin Bizdeki Nakit Bakiyesi: ${formatCurrency(cashBalance)} ₺\n`;
        reportString += `-----------------------------------\n`;
        if (netTotal < 0) {
            reportString += `✅ *SİZE ÖDEYECEĞİMİZ Tutar:* ${formatCurrency(Math.abs(netTotal))} ₺\n`;
        } else {
            reportString += `⚠️ *TARAFIMIZA ÖDEYECEĞİNİZ Tutar:* ${formatCurrency(netTotal)} ₺\n`;
        }
        reportString += `-----------------------------------\n`;
        reportString += `💳 *Ödeme Durumu:* ${paymentStatus}\n`; // Bu satır önemli
        if (notes && notes !== '-') {
            reportString += `📝 *Açıklamalar:* ${notes}\n`;
        }
        reportString += `\nİyi çalışmalar dileriz! ✨`;

        try {
            await navigator.clipboard.writeText(reportString);
            alert(`"${businessName}" (${reportDateFormatted}) için kaydedilmiş rapor panoya kopyalandı!`);
        } catch (err) {
            console.error('Kaydedilmiş rapor kopyalanamadı: ', err);
            alert('Hata: Rapor panoya kopyalanamadı. Lütfen konsolu kontrol edin veya HTTPS üzerinden çalıştığınızdan emin olun.');
        }
    }


    function renderSavedReports() {
        if (!savedReportsTableBody || !noReportsMessage) {
            console.error("Tablo body veya mesaj elementi bulunamadı.");
            return;
        }
        savedReportsTableBody.innerHTML = '';

        applyFiltersAndSort();

        if (displayedReports.length === 0) {
            noReportsMessage.style.display = 'block';
            savedReportsTableBody.style.display = 'none';
        } else {
            noReportsMessage.style.display = 'none';
            savedReportsTableBody.style.display = '';
            displayedReports.forEach((report, index) => {
                const row = savedReportsTableBody.insertRow();
                row.insertCell().textContent = formatDateTime(report.savedAt);
                row.insertCell().textContent = formatDate(report.hesapTarihi);
                row.insertCell().textContent = report.businessName;
                row.insertCell().textContent = report.totalPackages;
                const totalWithVatCell = row.insertCell();
                totalWithVatCell.textContent = formatCurrency(report.totalWithVat) + ' ₺';
                totalWithVatCell.style.textAlign = 'right';
                
                const netTotalCell = row.insertCell();
                netTotalCell.textContent = formatCurrency(report.netTotal) + ' ₺';
                netTotalCell.style.textAlign = 'right';
                if (report.netTotal < 0) {
                    netTotalCell.style.color = 'var(--success-color-dark)';
                } else if (report.netTotal > 0) {
                    netTotalCell.style.color = 'var(--danger-color-dark)';
                }

                row.insertCell().textContent = report.paymentStatus; // ÖDEME DURUMU GÖSTERİLİYOR
                row.insertCell().textContent = report.hasQuota;      // KOTA DURUMU GÖSTERİLİYOR
                
                const notesCell = row.insertCell();
                notesCell.textContent = report.notes && report.notes.length > 30 ? report.notes.substring(0, 27) + '...' : (report.notes || '-');
                if (report.notes) notesCell.title = report.notes;

                const actionsCell = row.insertCell();
                actionsCell.classList.add('action-cell-reports');

                // DETAYLAR BUTONU
                const detailBtn = document.createElement('button');
                detailBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg> Detay`;
                detailBtn.classList.add('btn', 'btn-sm', 'btn-secondary');
                detailBtn.title = "Bu kaydın tüm detaylarını gör";
                detailBtn.addEventListener('click', () => showReportDetails(report.reportId));
                actionsCell.appendChild(detailBtn);

                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-clipboard-check-fill" viewBox="0 0 16 16">...</svg> Kopyala`; // SVG içeriği
                copyBtn.classList.add('btn', 'btn-sm', 'btn-info');
                copyBtn.title = "Bu kaydın raporunu panoya kopyala";
                copyBtn.addEventListener('click', () => copySavedReportToClipboard(report.reportId));
                actionsCell.appendChild(copyBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">...</svg> Sil`; // SVG içeriği
                deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
                deleteBtn.title = "Bu kaydı sil";
                deleteBtn.addEventListener('click', () => deleteReport(report.reportId));
                actionsCell.appendChild(deleteBtn);
            });
        }
        updateSortIcons();
    }

    function deleteReport(reportIdToDelete) {
        const report = allSavedReports.find(r => r.reportId === reportIdToDelete);
        if (report && confirm(`"${report.businessName}" (${formatDate(report.hesapTarihi)}) için olan bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            allSavedReports = allSavedReports.filter(r => r.reportId !== reportIdToDelete);
            try {
                localStorage.setItem(SAVED_REPORTS_KEY, JSON.stringify(allSavedReports));
                console.log("Rapor silindi:", reportIdToDelete);
                renderSavedReports();
            } catch (e) {
                console.error("Rapor silinirken localStorage hatası:", e);
                alert("Rapor silinirken bir hata oluştu.");
                loadSavedReports(); 
                renderSavedReports();
            }
        }
    }
    
    function applyFiltersAndSort() {
        let filtered = [...allSavedReports];

        const nameFilter = filterBusinessNameInput.value.toLowerCase();
        if (nameFilter) {
            filtered = filtered.filter(report => report.businessName.toLowerCase().includes(nameFilter));
        }

        const dateFilter = filterHesapTarihiInput.value;
        if (dateFilter) {
            filtered = filtered.filter(report => report.hesapTarihi === dateFilter);
        }

        const paymentStatusFilter = filterPaymentStatusSelect.value;
        if (paymentStatusFilter) {
            filtered = filtered.filter(report => report.paymentStatus === paymentStatusFilter);
        }
        
        filtered.sort((a, b) => {
            let valA = a[currentSort.column];
            let valB = b[currentSort.column];

            if (['totalPackages', 'totalWithVat', 'netTotal'].includes(currentSort.column)) {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            } else if (['savedAt', 'hesapTarihi'].includes(currentSort.column)) {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) {
                return currentSort.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return currentSort.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        displayedReports = filtered;
    }

    function handleSort(columnName) {
        if (currentSort.column === columnName) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = columnName;
            currentSort.direction = (columnName === 'savedAt' || columnName === 'hesapTarihi' || columnName === 'totalPackages' || columnName === 'totalWithVat' || columnName === 'netTotal') ? 'desc' : 'asc';
        }
        renderSavedReports();
    }

    function updateSortIcons() {
        document.querySelectorAll('#savedReportsTable th.sortable').forEach(th => {
            th.classList.remove('asc', 'desc');
            if (th.dataset.sort === currentSort.column) {
                th.classList.add(currentSort.direction);
            }
        });
    }

    if (filterBusinessNameInput) filterBusinessNameInput.addEventListener('input', renderSavedReports);
    if (filterHesapTarihiInput) filterHesapTarihiInput.addEventListener('change', renderSavedReports);
    if (filterPaymentStatusSelect) filterPaymentStatusSelect.addEventListener('change', renderSavedReports);
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            filterBusinessNameInput.value = '';
            filterHesapTarihiInput.value = '';
            filterPaymentStatusSelect.value = '';
            renderSavedReports();
        });
    }

    document.querySelectorAll('#savedReportsTable th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            handleSort(th.dataset.sort);
        });
    });

    loadSavedReports();
    renderSavedReports();
});