pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let appData = [];

// وظيفة الدخول
function handleLogin() {
    const name = document.getElementById('empNameInput').value;
    if (name.trim().length < 3) {
        alert("يرجى إدخال اسمك الكامل");
        return;
    }
    document.getElementById('badge').innerText = "المندوب: " + name;
    document.getElementById('badge').classList.remove('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
}

// قراءة ملف الـ PDF
document.getElementById('pdfFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let allLines = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // استخراج النصوص مع دمجها بشكل سطر سطر
            const strings = content.items.map(item => item.str);
            allLines = allLines.concat(strings);
        }
        processKashfData(allLines);
    };
    reader.readAsArrayBuffer(file);
});

// تحليل بيانات كشف بيور العلمي
function processKashfData(lines) {
    appData = [];
    
    for (let i = 0; i < lines.length; i++) {
        let text = lines[i].trim();
        
        // البحث عن رقم الفاتورة (6 أرقام غالباً)
        if (/^\d{5,6}$/.test(text)) {
            let id = text;
            let pharmacy = "غير محدد";
            let amount = "0.00";

            // البحث الذكي عن الاسم والسعر في العناصر المجاورة (قبل وبعد الرقم)
            for(let j = 1; j <= 8; j++) {
                let prev = lines[i-j] || "";
                let next = lines[i+j] || "";

                // البحث عن المبلغ (رقم بفاصلة عشرية)
                if(/[\d,]+\.\d{2}/.test(prev) && amount === "0.00") amount = prev;
                if(/[\d,]+\.\d{2}/.test(next) && amount === "0.00") amount = next;

                // البحث عن اسم الصيدلية (نص عربي طويل)
                if(/[\u0600-\u06FF]/.test(prev) && pharmacy === "غير محدد" && prev.length > 5) pharmacy = prev;
                if(/[\u0600-\u06FF]/.test(next) && pharmacy === "غير محدد" && next.length > 5) pharmacy = next;
            }

            appData.push({ id, pharmacy, amount });
        }
    }
    renderCards();
}

function renderCards() {
    const container = document.getElementById('invoiceContainer');
    document.getElementById('counter').innerText = appData.length;
    container.innerHTML = "";

    appData.forEach(item => {
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-3xl shadow-sm border-r-[10px] border-blue-600 flex justify-between items-center transition-all duration-300";
        card.innerHTML = `
            <div class="flex-1">
                <p class="text-[10px] text-blue-500 font-bold uppercase tracking-widest">رقم الفاتورة: #${item.id}</p>
                <h4 class="font-bold text-gray-800 text-sm my-1">${item.pharmacy}</h4>
                <p class="text-blue-700 font-bold text-xs bg-blue-50 inline-block px-2 py-1 rounded-lg">المبلغ: ${item.amount} د.ع</p>
            </div>
            <button onclick="confirmItem(this)" class="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md active:scale-90 transition-all">تأكيد</button>
        `;
        container.appendChild(card);
    });

    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('listSection').classList.remove('hidden');
}

function confirmItem(btn) {
    btn.innerText = "✅ تم المطابقة";
    btn.className = "bg-green-100 text-green-700 px-4 py-3 rounded-2xl text-xs font-bold border border-green-200";
    btn.parentElement.classList.replace('border-blue-600', 'border-green-500');
    btn.parentElement.classList.add('opacity-60');
    btn.disabled = true;
}
