// إعداد مكتبة PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let store = {};

// دالة تنظيف النص المقطع
function cleanText(txt) {
    return txt.replace(/ѧ/g, '').trim();
}

document.getElementById('pdfFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('loader').classList.remove('hidden');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    store = {};

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let pageText = content.items.map(s => s.str).join(' ');

        // البحث عن الرقم الفريد (ID) والاسم الخام
        let idMatch = pageText.match(/(?:رقم|رق م|الحساب)[:\-\s]*(\d{4,5})/);
        let nameMatch = pageText.match(/(?:الاسم|الاس م)[:\-\s]*(.*?)(?=رقم|رق م|الموبايل|الموباي)/);

        if (idMatch) {
            let id = idMatch[1];
            let rawName = nameMatch ? cleanText(nameMatch[1]) : "اسم غير واضح";

            if (!store[id]) {
                store[id] = { id: id, name: rawName, bills: [], total: 0, firstPage: i };
            }

            // استخراج الفواتير (رقم الفاتورة، التاريخ، المبلغ)
            let billLines = pageText.match(/(\d{6,8})\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+([\d,]+\.\d{2})/g);
            if (billLines) {
                billLines.forEach(line => {
                    let parts = line.split(/\s+/);
                    store[id].bills.push({ n: parts[0], d: parts[1], a: parts[2] });
                    store[id].total += parseFloat(parts[2].replace(/,/g, ''));
                });
            }
        }
    }
    renderGrid();
    document.getElementById('loader').classList.add('hidden');
});

function renderGrid() {
    const grid = document.getElementById('clientsGrid');
    grid.innerHTML = "";
    Object.values(store).forEach(c => {
        grid.innerHTML += `
            <div class="p-6 rounded-2xl shadow-sm client-card cursor-pointer" onclick="openDetails('${c.id}')">
                <div class="flex justify-between mb-4">
                    <span class="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">حساب: ${c.id}</span>
                    <span class="text-[10px] text-slate-300 font-bold uppercase">Page ${c.firstPage}</span>
                </div>
                <h3 class="text-lg font-black text-slate-800 text-right mb-4">(${c.name})</h3>
                <div class="flex justify-between items-end border-t border-slate-50 pt-4">
                    <span class="text-slate-400 text-[10px] font-bold">TOTAL BALANCE</span>
                    <span class="text-indigo-600 font-black text-xl leading-none">${c.total.toLocaleString()} د.ع</span>
                </div>
            </div>`;
    });
}

function openDetails(id) {
    const c = store[id];
    document.getElementById('detailsModal').classList.remove('hidden');
    
    // إعداد زر الواتساب
    document.getElementById('waBtn').onclick = () => {
        let msg = `*كشف حساب مكتب بيور*%0A*العميل:* ${c.name}%0A*الحساب:* ${c.id}%0A*الإجمالي:* ${c.total.toLocaleString()} د.ع`;
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    document.getElementById('modalContent').innerHTML = `
        <div class="text-right mb-8">
            <h2 class="text-3xl font-black text-slate-900 leading-tight">${c.name}</h2>
            <p class="text-slate-400 font-bold mt-2 italic">كشف حساب فريد - رقم: ${c.id}</p>
        </div>
        <table class="w-full text-right border-collapse">
            <thead>
                <tr class="bg-slate-50 text-slate-500 border-b">
                    <th class="p-4 font-black text-xs">مطابقة</th>
                    <th class="p-4 font-black text-xs text-center">رقم الفاتورة</th>
                    <th class="p-4 font-black text-xs text-left">المبلغ المتبقي</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                ${c.bills.map((b, idx) => `
                    <tr id="r-${idx}" class="transition">
                        <td class="p-4"><input type="checkbox" onchange="document.getElementById('r-${idx}').classList.toggle('checked-row', this.checked)" class="w-6 h-6 accent-indigo-600 cursor-pointer"></td>
                        <td class="p-4 font-mono font-bold text-slate-700 text-center">${b.n}</td>
                        <td class="p-4 font-black text-indigo-900 text-left text-lg">${b.a} د.ع</td>
                    </tr>`).join('')}
            </tbody>
        </table>
        <div class="mt-10 bg-slate-900 text-white p-8 rounded-3xl flex justify-between items-center shadow-2xl shadow-slate-900/20">
            <span class="text-slate-400 font-bold tracking-widest text-xs uppercase">Grand Total Balance</span>
            <span class="text-3xl font-black text-indigo-400">${c.total.toLocaleString()} د.ع</span>
        </div>`;
}

function closeModal() {
    document.getElementById('detailsModal').classList.add('hidden');
}
