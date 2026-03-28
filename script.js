pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let invoices = [];

function login() {
    const name = document.getElementById('empName').value;
    if (name.length < 3) return alert("يرجى كتابة الاسم الثلاثي");
    document.getElementById('userName').innerText = "المندوب: " + name;
    document.getElementById('userName').classList.remove('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
}

document.getElementById('pdfFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // دمج النص مع الحفاظ على المسافات لتمييز الأعمدة
            extractedText += content.items.map(item => item.str).join('  ');
        }
        parseData(extractedText);
    };
    reader.readAsArrayBuffer(file);
});

function parseData(text) {
    invoices = [];
    // تعبير برمجي للبحث عن (رقم الفاتورة 5-6 أرقام) متبوع بنصوص وأرقام المبالغ
    const lines = text.split(/(\d{5,6})/); 
    
    for (let i = 1; i < lines.length; i += 2) {
        let id = lines[i]; // رقم الفاتورة
        let details = lines[i + 1] || ""; // النص الذي يتبع الرقم
        
        // استخراج المبلغ (رقم يحتوي على فاصلة ونقطة)
        let amountMatch = details.match(/[\d,]+\.\d{2}/);
        let amount = amountMatch ? amountMatch[0] : "راجع الكشف";
        
        // استخراج الاسم (أول كلمات عربية تظهر)
        let nameMatch = details.match(/[\u0600-\u06FF\s\/]+/);
        let name = nameMatch ? nameMatch[0].trim().substring(0, 40) : "صيدلية غير محددة";

        invoices.push({ id, name, amount });
    }
    renderUI();
}

function renderUI() {
    const container = document.getElementById('invoiceContainer');
    document.getElementById('totalCount').innerText = invoices.length;
    container.innerHTML = "";

    invoices.forEach(inv => {
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-2xl shadow-sm border-r-8 border-blue-600 flex justify-between items-center transition-all";
        card.innerHTML = `
            <div class="flex-1 px-2">
                <p class="text-[10px] text-blue-500 font-bold mb-1">تذكرة # ${inv.id}</p>
                <h4 class="font-bold text-gray-800 text-sm leading-relaxed mb-2">${inv.name}</h4>
                <div class="flex items-center gap-2">
                    <span class="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold">المتبقي: ${inv.amount}</span>
                </div>
            </div>
            <button onclick="markDone(this)" class="bg-gray-50 text-blue-600 border border-blue-100 px-5 py-3 rounded-xl text-xs font-bold shadow-sm active:scale-90 transition-all">تأكيد</button>
        `;
        container.appendChild(card);
    });

    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('listSection').classList.remove('hidden');
}

function markDone(btn) {
    btn.innerText = "✅ تم الاستلام";
    btn.className = "bg-green-100 text-green-700 px-4 py-3 rounded-xl text-xs font-bold border border-green-200 shadow-inner";
    btn.parentElement.classList.replace('border-blue-600', 'border-green-500');
    btn.parentElement.style.opacity = "0.7";
    btn.disabled = true;
}
