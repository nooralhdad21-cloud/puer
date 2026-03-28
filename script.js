pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let allInvoices = [];
let unmatchedCount = 0;

function startSystem() {
    const user = document.getElementById('userName').value;
    if (user.trim().length < 3) return alert("يرجى إدخال اسمك");
    document.getElementById('userStatus').innerText = "المندوب: " + user;
    document.getElementById('userStatus').classList.remove('hidden');
    document.getElementById('stepLogin').classList.add('hidden');
    document.getElementById('stepUpload').classList.remove('hidden');
}

document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullContent = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            fullContent = fullContent.concat(text.items.map(s => s.str));
        }
        analyzeData(fullContent);
    };
    reader.readAsArrayBuffer(file);
});

function analyzeData(lines) {
    allInvoices = [];
    for (let i = 0; i < lines.length; i++) {
        let val = lines[i].trim();
        // الكشف عن رقم الفاتورة (5-6 أرقام)
        if (/^\d{5,6}$/.test(val)) {
            let inv = {
                id: val,
                name: "صيدلية/مذخر غير معروف",
                price: "0.00",
                date: "---",
                done: false
            };

            // مسح ذكي للمحيط لاستخراج التفاصيل (الاسم، السعر، التاريخ)
            for (let j = 1; j <= 15; j++) {
                let p = lines[i - j] || "";
                let n = lines[i + j] || "";
                
                if (/\d{2}\/\d{2}\/\d{4}/.test(p)) inv.date = p;
                if (/[\d,]+\.\d{2}/.test(p) && inv.price === "0.00") inv.price = p;
                if (/[\u0600-\u06FF]/.test(p) && inv.name.includes("غير معروف") && p.length > 5) inv.name = p;
                
                // البحث في الاتجاه الآخر أيضاً
                if (inv.price === "0.00" && /[\d,]+\.\d{2}/.test(n)) inv.price = n;
            }
            allInvoices.push(inv);
        }
    }
    unmatchedCount = allInvoices.length;
    refreshUI();
}

function refreshUI() {
    document.getElementById('statTotal').innerText = allInvoices.length;
    document.getElementById('statUnmatched').innerText = unmatchedCount;
    document.getElementById('liveDashboard').classList.remove('hidden');
    document.getElementById('stepUpload').classList.add('hidden');
    document.getElementById('stepList').classList.remove('hidden');

    const container = document.getElementById('stepList');
    container.innerHTML = "";

    allInvoices.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `bg-white p-6 rounded-[2.5rem] shadow-sm border-r-[12px] flex justify-between items-center transition-all duration-500 ${item.done ? 'border-green-500 opacity-50 scale-95' : 'border-blue-600'}`;
        card.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-black"># ${item.id}</span>
                    <span class="text-[10px] text-slate-400 font-bold">${item.date}</span>
                </div>
                <h4 class="font-black text-slate-800 text-sm mb-2 leading-tight">${item.name}</h4>
                <p class="text-blue-700 font-black text-xs italic">المبلغ: ${item.price} د.ع</p>
            </div>
            <div class="flex items-center ml-2">
                <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleMatch(${index})" class="w-10 h-10 border-4 border-slate-200 rounded-full checked:bg-green-500 checked:border-green-500 transition-all cursor-pointer appearance-none flex items-center justify-center after:content-['✓'] after:text-white after:hidden checked:after:block after:font-black">
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleMatch(index) {
    allInvoices[index].done = !allInvoices[index].done;
    unmatchedCount = allInvoices.filter(x => !x.done).length;
    document.getElementById('statUnmatched').innerText = unmatchedCount;
    
    // إعادة بناء القائمة بشكل بسيط لتحديث الشكل
    refreshUI();
}
