document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const hesapTarihiInput = document.getElementById('hesapTarihi');
    const openAddBusinessModalBtn = document.getElementById('openAddBusinessModalBtn');
    const showSavedReportsBtn = document.getElementById('showSavedReportsBtn');
    const calculationTableBody = document.getElementById('calculationTableBody');
    const addBusinessModalOverlay = document.getElementById('addBusinessModalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const saveBusinessBtn = document.getElementById('saveBusinessBtn');
    const editBusinessIdInput = document.getElementById('editBusinessId');
    const businessNameInput = document.getElementById('businessName');
    const normalPackageFeeInput = document.getElementById('normalPackageFee');
    const distantPackageFeeInput = document.getElementById('distantPackageFee');
    const vatRateInput = document.getElementById('vatRate');
    const businessRegionSelect = document.getElementById('businessRegion');
    const regionButtonsContainer = document.getElementById('regionButtonsContainer');
    const addRegionBtn = document.getElementById('addRegionBtn');
    const dataManagementBtn = document.getElementById('dataManagementBtn');

    // State
    let businesses = [];
    let tableData = {};
    let savedReports = [];
    let regions = ["İskele", "Barbaros"];
    let activeRegionFilter = "Tümü";

    // Storage Keys
    const BUSINESS_STORAGE_KEY = 'hakedisApp_businesses_v6'; 
    const TABLE_DATA_STORAGE_KEY = 'hakedisApp_tableData_v6'; 
    const HESAP_TARIHI_KEY = 'hakedisApp_hesapTarihi_v6';
    const SAVED_REPORTS_KEY = 'hakedisApp_savedReports_v1';
    const REGIONS_STORAGE_KEY = 'hakedisApp_regions_v1';

    // New Business Data from PM/Designer
    const barbarosList = [
        "Acıktım Tantuni", "Asil Balık", "Baba Pizza", "Bahar Fastfood", "Gaziantep Güneşi", 
        "Kuytu Fastfood", "NFC BURGER", "No42 Papağan", "North Bear Burger", "Osmanoğlu Izgara", 
        "Paketçim", "Papağan Pastanesi", "Pisa Pizza", "PUFİ PANCO", "Sevgi Sokak Lezzetleri", 
        "Taşra Kumpir", "Urfa Kebap", "WaffleDore"
    ];

    const iskeleList = [
        "232 Macaroni", "Adıyaman Çiğköfte", "Ateş Döner", "Ateş Döner 2", "Ayvalık Tostçusu", 
        "Behnar Ev Yemekleri", "Bombacı", "Bozcaada Büfe", "Bunbi", "Bülent Börekçilik", 
        "Crespo Burger", "Doğan Pastanesi İskele", "Elliza Makarna", "Eqo Döner", "Hanımzade", 
        "HS Hotdog", "I Love Fish", "Lahmacun Time 2", "Loresima", "Maya Gözleme Evi", 
        "MiniPan", "Papağan Döner", "Tado Döner", "Tencere Kazan Köfte", "Vira Balık", "Walpurga"
    ];

    // Helper functions
    function generateId() { return '_' + Math.random().toString(36).substr(2, 9); }
    function formatCurrency(amount) { if (typeof amount !== 'number' || isNaN(amount)) { return '0.00'; } return amount.toFixed(2); }

    // Storage Functions
    function saveToStorage(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error(`Storage save error (${key}):`, e); } }
    function loadFromStorage(key, defaultValue) { try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : defaultValue; } catch (e) { console.error(`Storage load error (${key}):`, e); return defaultValue; } }

    function migrateOldData() {
        try {
            const currentV6Data = localStorage.getItem(BUSINESS_STORAGE_KEY);
            if (!currentV6Data || JSON.parse(currentV6Data).length === 0) {
                // Check v1 to v5
                for (let i = 5; i >= 1; i--) {
                    const oldKey = `hakedisApp_businesses_v${i}`;
                    const oldData = localStorage.getItem(oldKey);
                    if (oldData) {
                        localStorage.setItem(BUSINESS_STORAGE_KEY, oldData);
                        console.info(`Veri başarıyla v${i} versiyonundan v6'ya taşındı.`);
                        break;
                    }
                }
            }
        } catch (e) {
            console.error("Migrasyon hatası:", e);
        }
    }

    function exportAppData() {
        try {
            const backup = {
                app: "MaxiHesaplama",
                version: "v6",
                date: new Date().toISOString(),
                data: {
                    businesses: loadFromStorage(BUSINESS_STORAGE_KEY, []),
                    tableData: loadFromStorage(TABLE_DATA_STORAGE_KEY, {}),
                    savedReports: loadFromStorage(SAVED_REPORTS_KEY, []),
                    regions: loadFromStorage(REGIONS_STORAGE_KEY, ["İskele", "Barbaros"])
                }
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const tarih = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `maxi_yedek_${tarih}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Dışa aktarma hatası:", e);
            alert("Veriler dışa aktarılırken bir hata oluştu.");
        }
    }

    function importAppData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                if (backup.app === "MaxiHesaplama") {
                    if (confirm("Mevcut veriler silinecek ve yedekteki veriler yüklenecek. Onaylıyor musunuz?")) {
                        saveToStorage(BUSINESS_STORAGE_KEY, backup.data.businesses);
                        saveToStorage(TABLE_DATA_STORAGE_KEY, backup.data.tableData);
                        saveToStorage(SAVED_REPORTS_KEY, backup.data.savedReports);
                        saveToStorage(REGIONS_STORAGE_KEY, backup.data.regions);
                        location.reload();
                    }
                } else {
                    alert("Geçersiz yedek dosyası!");
                }
            } catch (err) {
                console.error("İçe aktarma hatası:", err);
                alert("Dosya okunurken veya işlenirken bir hata oluştu.");
            }
        };
        reader.readAsText(file);
    }

    function loadInitialData() {
        migrateOldData();
        const storedBusinesses = loadFromStorage(BUSINESS_STORAGE_KEY, []);
        regions = loadFromStorage(REGIONS_STORAGE_KEY, ["İskele", "Barbaros"]);
        
        if (storedBusinesses.length === 0 || storedBusinesses.length !== (barbarosList.length + iskeleList.length)) {
            migrateData(storedBusinesses);
        } else {
            businesses = storedBusinesses;
        }

        tableData = loadFromStorage(TABLE_DATA_STORAGE_KEY, {});
        savedReports = loadFromStorage(SAVED_REPORTS_KEY, []);
        
        const savedTarih = localStorage.getItem(HESAP_TARIHI_KEY);
        hesapTarihiInput.value = savedTarih || new Date().toISOString().split('T')[0];
    }

    function migrateData(oldBusinesses) {
        const newBusinesses = [];
        const findOldData = (name) => {
            return oldBusinesses.find(b => b.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(b.name.toLowerCase()));
        };

        barbarosList.forEach(name => {
            const old = findOldData(name);
            newBusinesses.push({ id: generateId(), name: name, normalFee: old ? old.normalFee : 0, distantFee: old ? old.distantFee : 0, vat: old ? old.vat : 0, region: "Barbaros" });
        });

        iskeleList.forEach(name => {
            const old = findOldData(name);
            newBusinesses.push({ id: generateId(), name: name, normalFee: old ? old.normalFee : 0, distantFee: old ? old.distantFee : 0, vat: old ? old.vat : 0, region: "İskele" });
        });

        businesses = newBusinesses;
        saveToStorage(BUSINESS_STORAGE_KEY, businesses);
    }

    // Modal & UI Functions
    function openModal() { 
        if(addBusinessModalOverlay) { 
            populateRegionSelect();
            addBusinessModalOverlay.style.display = 'flex'; 
            requestAnimationFrame(() => { addBusinessModalOverlay.classList.add('active'); }); 
        } 
    }

    function closeModal() { 
        if(addBusinessModalOverlay) { 
            addBusinessModalOverlay.classList.remove('active'); 
            const handleTransitionEnd = () => { 
                if (!addBusinessModalOverlay.classList.contains('active')) { addBusinessModalOverlay.style.display = 'none'; } 
                addBusinessModalOverlay.removeEventListener('transitionend', handleTransitionEnd); 
            }; 
            addBusinessModalOverlay.addEventListener('transitionend', handleTransitionEnd); 
            clearModalForm(); 
        } 
    }

    function clearModalForm() {
        businessNameInput.value = '';
        normalPackageFeeInput.value = '';
        distantPackageFeeInput.value = '';
        vatRateInput.value = '';
        editBusinessIdInput.value = '';
        businessRegionSelect.value = regions[0];
    }

    function populateRegionSelect() {
        businessRegionSelect.innerHTML = '';
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            businessRegionSelect.appendChild(option);
        });
    }

    function renderRegionButtons() {
        regionButtonsContainer.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = `region-btn ${activeRegionFilter === "Tümü" ? 'active' : ''}`;
        allBtn.textContent = "Tümü";
        allBtn.addEventListener('click', () => { activeRegionFilter = "Tümü"; renderRegionButtons(); renderTable(); });
        regionButtonsContainer.appendChild(allBtn);

        regions.forEach(region => {
            const btn = document.createElement('button');
            btn.className = `region-btn ${activeRegionFilter === region ? 'active' : ''}`;
            btn.textContent = region;
            btn.addEventListener('click', () => { activeRegionFilter = region; renderRegionButtons(); renderTable(); });
            regionButtonsContainer.appendChild(btn);
        });
    }

    // Table Rendering
    function renderTable() { 
        if(!calculationTableBody) return;
        calculationTableBody.innerHTML = ''; 
        
        let filteredBusinesses = activeRegionFilter === "Tümü" 
            ? businesses 
            : businesses.filter(b => b.region === activeRegionFilter);

        filteredBusinesses.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));

        if (filteredBusinesses.length === 0) {
            const row = calculationTableBody.insertRow(); const cell = row.insertCell(); cell.colSpan = 17; 
            cell.textContent = "Bu bölgede işletme bulunmamaktadır."; cell.style.textAlign = "center"; cell.style.padding = "20px";
            return;
        }

        filteredBusinesses.forEach((business, index) => {
            const row = calculationTableBody.insertRow();
            row.dataset.businessId = business.id; 
            const businessRowData = tableData[business.id] || { normalPackages: 0, distantPackages: 0, bankCommission: 0, posBalance: 0, cashBalance: 0, paymentStatus: 'Odenmedi', hasQuota: 'Yok', notes: '' };
            
            row.insertCell().textContent = index + 1;
            const nameCell = row.insertCell();
            nameCell.innerHTML = `${business.name} <br><small style="color:var(--text-muted)">(${business.region})</small>`;
            
            const createInputElement = (type, value, fieldName, step = null, min = null) => { 
                const input = document.createElement('input'); 
                input.type = type; 
                input.value = value; 
                input.dataset.field = fieldName; 
                input.classList.add('form-control', 'form-control-sm'); 
                if (step) input.step = step; 
                if (min !== null) input.min = min; 
                return input; 
            };

            const createSelectElement = (value, fieldName, optionsArray) => { 
                const select = document.createElement('select'); 
                select.dataset.field = fieldName; 
                select.classList.add('form-control', 'form-control-sm'); 
                optionsArray.forEach(optText => { 
                    const option = document.createElement('option'); 
                    option.value = optText; 
                    option.textContent = optText; 
                    if (optText === value) option.selected = true; 
                    select.appendChild(option); 
                }); 
                return select; 
            };

            row.insertCell().appendChild(createInputElement('number', businessRowData.normalPackages, 'normalPackages', null, 0));
            row.insertCell().appendChild(createInputElement('number', businessRowData.distantPackages, 'distantPackages', null, 0));
            
            const totalPackagesCell = row.insertCell(); 
            totalPackagesCell.className = 'calculated-field'; 
            totalPackagesCell.dataset.field = 'totalPackages';
            totalPackagesCell.textContent = '0';

            const hakedisCell = row.insertCell(); 
            hakedisCell.className = 'calculated-field'; 
            hakedisCell.dataset.field = 'hakedis';
            hakedisCell.textContent = '0.00';

            const vatAmountCell = row.insertCell(); 
            vatAmountCell.className = 'calculated-field'; 
            vatAmountCell.dataset.field = 'vatAmount';
            vatAmountCell.textContent = '0.00';

            const totalWithVatCell = row.insertCell(); 
            totalWithVatCell.className = 'calculated-field'; 
            totalWithVatCell.dataset.field = 'totalWithVat';
            totalWithVatCell.textContent = '0.00';
            
            row.insertCell().appendChild(createInputElement('number', businessRowData.bankCommission, 'bankCommission', '0.01'));
            row.insertCell().appendChild(createInputElement('number', businessRowData.posBalance, 'posBalance', '0.01'));
            row.insertCell().appendChild(createInputElement('number', businessRowData.cashBalance, 'cashBalance', '0.01'));
            
            const netTotalCell = row.insertCell(); 
            netTotalCell.className = 'calculated-field'; 
            netTotalCell.dataset.field = 'netTotal';
            netTotalCell.textContent = '0.00';

            row.insertCell().appendChild(createSelectElement(businessRowData.paymentStatus, 'paymentStatus', ['Odenmedi', 'Odendi', 'Kismi Odeme']));
            row.insertCell().appendChild(createSelectElement(businessRowData.hasQuota, 'hasQuota', ['Yok', 'Var']));
            row.insertCell().appendChild(createInputElement('text', businessRowData.notes, 'notes'));
            
            const actionsCell = row.insertCell(); actionsCell.classList.add('action-buttons');
            const editBtn = document.createElement('button'); 
            editBtn.innerHTML = `Düzenle`; editBtn.classList.add('btn', 'btn-sm', 'btn-warning'); 
            editBtn.addEventListener('click', () => editBusiness(business.id));
            actionsCell.appendChild(editBtn);
            
            const deleteBtn = document.createElement('button'); 
            deleteBtn.innerHTML = `Sil`; deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger'); 
            deleteBtn.addEventListener('click', () => deleteBusiness(business.id));
            actionsCell.appendChild(deleteBtn);
            
            const reportAndSaveCell = row.insertCell(); 
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = `Kopyala`; copyBtn.classList.add('btn', 'btn-sm', 'btn-info'); 
            copyBtn.addEventListener('click', () => copyBusinessReport(business.id));
            reportAndSaveCell.appendChild(copyBtn);

            const saveBtn = document.createElement('button');
            saveBtn.innerHTML = `Kaydet`; saveBtn.classList.add('btn', 'btn-sm', 'btn-success');
            saveBtn.addEventListener('click', function() { saveCurrentReportToStorage(business.id, this); });
            reportAndSaveCell.appendChild(saveBtn);

            const inputElements = row.querySelectorAll('input[data-field], select[data-field]');
            inputElements.forEach(inputEl => { 
                inputEl.addEventListener('change', (e) => updateRowDataAndRecalculate(row, business.id, e.target.dataset.field, e.target.value)); 
                if (inputEl.type === 'number') { inputEl.addEventListener('input', (e) => updateRowDataAndRecalculate(row, business.id, e.target.dataset.field, e.target.value)); } 
            });
            
            calculateAndDisplayRow(row, business);
        });
    }

    function updateRowDataAndRecalculate(rowElement, businessId, field, value) { 
        if (!tableData[businessId]) { tableData[businessId] = {}; } 
        if (['normalPackages', 'distantPackages', 'bankCommission', 'posBalance', 'cashBalance'].includes(field)) { value = parseFloat(value) || 0; } 
        tableData[businessId][field] = value; 
        saveToStorage(TABLE_DATA_STORAGE_KEY, tableData); 
        const business = businesses.find(b => b.id === businessId); 
        if (business) { calculateAndDisplayRow(rowElement, business); } 
    }
    
    function calculateAndDisplayRow(rowElement, business) {  
        const rowData = tableData[business.id] || {};  
        const np = parseFloat(rowData.normalPackages) || 0;  
        const dp = parseFloat(rowData.distantPackages) || 0;  
        const bk = parseFloat(rowData.bankCommission) || 0; 
        const pos = parseFloat(rowData.posBalance) || 0;  
        const nakit = parseFloat(rowData.cashBalance) || 0;  
        
        const hakedis = (np * business.normalFee) + (dp * business.distantFee);  
        const kdv = hakedis * (business.vat / 100);  
        const toplam = hakedis + kdv;
        const net = toplam + bk - pos - nakit;
        
        const setVal = (field, val) => {
            const el = rowElement.querySelector(`[data-field="${field}"]`);
            if (el) el.textContent = val;
        };

        setVal('totalPackages', np + dp);
        setVal('hakedis', formatCurrency(hakedis));
        setVal('vatAmount', formatCurrency(kdv));
        setVal('totalWithVat', formatCurrency(toplam));
        setVal('netTotal', formatCurrency(net));
    }

    // Business Logic
    function editBusiness(id) { 
        const b = businesses.find(x => x.id === id); 
        if (b) { 
            editBusinessIdInput.value = b.id; 
            businessNameInput.value = b.name; 
            normalPackageFeeInput.value = b.normalFee; 
            distantPackageFeeInput.value = b.distantFee; 
            vatRateInput.value = b.vat; 
            businessRegionSelect.value = b.region;
            modalTitle.textContent = 'İşletmeyi Düzenle'; 
            openModal(); 
        } 
    }

    function deleteBusiness(id) { 
        const b = businesses.find(x => x.id === id); 
        if (b && confirm(`"${b.name}" silinsin mi?`)) { 
            businesses = businesses.filter(x => x.id !== id); 
            delete tableData[id]; 
            saveToStorage(BUSINESS_STORAGE_KEY, businesses); 
            saveToStorage(TABLE_DATA_STORAGE_KEY, tableData); 
            renderTable(); 
        } 
    }

    if(saveBusinessBtn) saveBusinessBtn.addEventListener('click', () => {
        const id = editBusinessIdInput.value || generateId();
        const name = businessNameInput.value.trim();
        const nf = parseFloat(normalPackageFeeInput.value) || 0;
        const df = parseFloat(distantPackageFeeInput.value) || 0;
        const v = parseFloat(vatRateInput.value) || 0;
        const reg = businessRegionSelect.value;
        if (!name) { alert('İsim gerekli.'); return; }
        const data = { id, name, normalFee: nf, distantFee: df, vat: v, region: reg };
        const idx = businesses.findIndex(x => x.id === id);
        if (idx > -1) businesses[idx] = data; else businesses.push(data);
        saveToStorage(BUSINESS_STORAGE_KEY, businesses);
        renderTable(); closeModal();
    });

    if(addRegionBtn) addRegionBtn.addEventListener('click', () => {
        const newReg = prompt("Yeni Bölge Adı:");
        if (newReg && !regions.includes(newReg)) {
            regions.push(newReg);
            saveToStorage(REGIONS_STORAGE_KEY, regions);
            renderRegionButtons();
            populateRegionSelect();
        }
    });

    if(dataManagementBtn) dataManagementBtn.addEventListener('click', () => {
        const action = prompt("Veri Yönetimi:\n1: Dışa Aktar (Yedek Al)\n2: İçe Aktar (Yedekten Dön)");
        if (action === "1") {
            exportAppData();
        } else if (action === "2") {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = (e) => importAppData(e.target.files[0]);
            input.click();
        }
    });

    async function copyBusinessReport(businessId) {
        const business = businesses.find(b => b.id === businessId);
        const rowData = tableData[business.id] || {};
        if (!business) { alert("İşletme bilgileri bulunamadı."); return; }

        let cancelledPackagesInput = prompt(`"${business.name}" için iptal edilen paket sayısını girin (isteğe bağlı, boş bırakabilirsiniz):`, "0");
        const cancelledPackages = parseInt(cancelledPackagesInput) || 0;

        const normalPackages = parseFloat(rowData.normalPackages) || 0;
        const distantPackages = parseFloat(rowData.distantPackages) || 0;
        const bankCommission = parseFloat(rowData.bankCommission) || 0; 
        const posBalance = parseFloat(rowData.posBalance) || 0;
        const cashBalance = parseFloat(rowData.cashBalance) || 0;
        const paymentStatus = rowData.paymentStatus || 'Belirtilmedi';
        const notes = rowData.notes || '-';
        const normalFee = parseFloat(business.normalFee) || 0;
        const distantFee = parseFloat(business.distantFee) || 0;
        const vatPercent = parseFloat(business.vat) || 0;
        
        const hakedis = (normalPackages * normalFee) + (distantPackages * distantFee);
        const vatAmount = hakedis * (vatPercent / 100);
        const totalWithVat = hakedis + vatAmount;
        const netTotal = totalWithVat + bankCommission - posBalance - cashBalance;
        const totalPackages = normalPackages + distantPackages;
        const reportDate = hesapTarihiInput.value ? new Date(hesapTarihiInput.value).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Belirtilmedi';

        let reportString = `📊 *${business.name} - Hakediş Raporu* 📊\n`;
        reportString += `-----------------------------------\n`;
        reportString += `🗓️ *Hesap Tarihi:* ${reportDate}\n`;
        reportString += `📍 *Bölge:* ${business.region}\n`;
        reportString += `📦 *Paket Bilgileri:*\n`;
        reportString += `   ▫️ Sistem Paketi: ${normalPackages} adet\n`;
        reportString += `   ▫️ Uzak ve İlave Paketler: ${distantPackages} adet\n`;
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
        reportString += `   ➕ Banka Pos Komisyonu (İşletmeye Yansıtılan): ${formatCurrency(bankCommission)} ₺\n`;
        reportString += `   ➖ İşletmenin Bizdeki POS Bakiyesi: ${formatCurrency(posBalance)} ₺\n`;
        reportString += `   ➖ İşletmenin Bizdeki Nakit Bakiyesi: ${formatCurrency(cashBalance)} ₺\n`;
        reportString += `-----------------------------------\n`;
        if (netTotal < 0) {
            reportString += `✅ *SİZE ÖDEYECEĞİMİZ Tutar:* ${formatCurrency(Math.abs(netTotal))} ₺\n`;
        } else {
            reportString += `⚠️ *TARAFIMIZA ÖDEYECEĞİZ Tutar:* ${formatCurrency(netTotal)} ₺\n`;
        }
        reportString += `-----------------------------------\n`;
        reportString += `💳 *Ödeme Durumu:* ${paymentStatus}\n`;
        if (notes && notes !== '-') {
            reportString += `📝 *Açıklamalar:* ${notes}\n`;
        }
        reportString += `\nİyi çalışmalar dileriz! ✨`;

        try {
            await navigator.clipboard.writeText(reportString);
            alert(`"${business.name}" için rapor panoya kopyalandı!\n\nWhatsApp veya başka bir uygulamaya yapıştırabilirsiniz.`);
        } catch (err) {
            console.error('Rapor kopyalanamadı: ', err);
            alert('Hata: Rapor panoya kopyalanamadı.');
        }
    }

    async function saveCurrentReportToStorage(businessId, buttonElement) {
        if (!businessId || !buttonElement) {
            console.error("Business ID veya button elementi eksik.");
            return;
        }

        const originalButtonHTML = buttonElement.innerHTML;
        const originalButtonTitle = buttonElement.title;
        buttonElement.innerHTML = `Kaydediliyor...`;
        buttonElement.disabled = true;

        const business = businesses.find(b => b.id === businessId);
        const rowData = tableData[businessId] || {};
        if (!business) {
            alert("İşletme bilgileri bulunamadı. Kayıt yapılamadı.");
            buttonElement.innerHTML = originalButtonHTML;
            buttonElement.disabled = false;
            return;
        }

        const normalPackages = parseFloat(rowData.normalPackages) || 0;
        const distantPackages = parseFloat(rowData.distantPackages) || 0;
        const bankCommission = parseFloat(rowData.bankCommission) || 0; 
        const posBalance = parseFloat(rowData.posBalance) || 0;
        const cashBalance = parseFloat(rowData.cashBalance) || 0;
        const paymentStatus = rowData.paymentStatus || 'Belirtilmedi';
        const hasQuota = rowData.hasQuota || 'Yok';
        const notes = rowData.notes || '';

        const normalFee = parseFloat(business.normalFee) || 0;
        const distantFee = parseFloat(business.distantFee) || 0;
        const vatPercent = parseFloat(business.vat) || 0;

        const hakedis = (normalPackages * normalFee) + (distantPackages * distantFee);
        const vatAmount = hakedis * (vatPercent / 100);
        const totalWithVat = hakedis + vatAmount;
        const netTotal = totalWithVat + bankCommission - posBalance - cashBalance;
        const totalPackages = normalPackages + distantPackages;
        const currentHesapTarihi = hesapTarihiInput.value;

        const reportRecord = {
            reportId: generateId(),
            businessId: business.id,
            businessName: business.name,
            businessRegion: business.region,
            hesapTarihi: currentHesapTarihi,
            normalPackages,
            distantPackages,
            totalPackages,
            hakedis: parseFloat(hakedis.toFixed(2)),
            vatAmount: parseFloat(vatAmount.toFixed(2)),
            totalWithVat: parseFloat(totalWithVat.toFixed(2)),
            bankCommission,
            posBalance,
            cashBalance,
            netTotal: parseFloat(netTotal.toFixed(2)),
            paymentStatus,
            hasQuota,
            notes,
            savedAt: new Date().toISOString()
        };

        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            savedReports.push(reportRecord);
            saveToStorage(SAVED_REPORTS_KEY, savedReports);
            
            buttonElement.innerHTML = `Kaydedildi`;
            buttonElement.classList.remove('btn-success');
            buttonElement.classList.add('btn-outline-success');
            setTimeout(() => {
                buttonElement.innerHTML = `Kaydet`;
                buttonElement.classList.remove('btn-outline-success');
                buttonElement.classList.add('btn-success');
                buttonElement.disabled = false;
            }, 2000);
        } catch (e) {
            console.error("Rapor kaydetme hatası:", e);
            alert("Rapor kaydedilirken bir hata oluştu.");
            buttonElement.innerHTML = originalButtonHTML;
            buttonElement.disabled = false;
        }
    }

    function init() {
        loadInitialData();
        renderRegionButtons();
        renderTable();
        
        // Tablo başlıklarını span içine al (CSS rotate için)
        const tableHeaders = document.querySelectorAll('#calculationTable thead th');
        tableHeaders.forEach((th, idx) => {
            if (idx > 0) { 
                const originalText = th.innerText;
                const originalTitle = th.title;
                th.innerHTML = `<span>${originalText}</span>`;
                th.title = originalTitle;
            }
        });

        if(openAddBusinessModalBtn) openAddBusinessModalBtn.addEventListener('click', () => { 
            editBusinessIdInput.value = ''; modalTitle.textContent = 'Yeni İşletme Ekle'; 
            clearModalForm(); openModal(); 
        });
        
        if (showSavedReportsBtn) {
            showSavedReportsBtn.addEventListener('click', () => {
                window.open('reports.html', '_blank');
            });
        }

        if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if(cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
        if(hesapTarihiInput) hesapTarihiInput.addEventListener('change', () => localStorage.setItem(HESAP_TARIHI_KEY, hesapTarihiInput.value));
    }

    init();
});