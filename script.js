const pdfjs = window['pdfjs-dist/build/pdf'];
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let accountingDB = {};

// دالة تصحيح الحروف المقطعة لملفات أصيل
function fixText(str) {
    return str.replace(/ѧ/g, '').replace(/([ا-ي])\s(?=[ا-ي])/g, '$1').trim();
}

document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('status').classList.remove('hidden');
    const buffer = await file.arrayBuffer();
    
    try {
        const pdf = await pdfjs.getDocument({data: buffer}).promise;
        accountingDB = {};

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items.map(s => s.str).join(' ');

            let idM = text.match(/(?:رقم|الحساب|رق م)[:\-\s]*(\d{2,6})/);
            let nameM = text.match(/(?:الاسم|الاس م)[:\-\s]*(.*?)(?=رقم|رق م|الموبايل|العن)/);

            if (idM) {
                let id = idM[1];
                let name = nameM ? fixText(nameM[1]) : "حساب: " + id;
                if (!accountingDB[id]) accountingDB[id] = { id, name, bills: [], total: 0 };

                let regex = /(\d{5,8})\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+([\d,]+\.\d{2})/g;
                let m;
                while ((m = regex.exec(text)) !== null) {
                    accountingDB[id].bills.push({ n: m[1], d: m[2], a: m[3] });
                    accountingDB[id].total += parseFloat(m[3].replace(/,/g, ''));
                }
            }
        }
        buildUI();
    } catch (err) { console.error("PDF Error:", err); }
    document.getElementById('status').classList.add('hidden');
});

function buildUI() {
    const grid = document.getElementById('outputGrid');
    grid.innerHTML = "";
    Object.values(accountingDB).forEach(acc => {
        if(acc.total > 0) {
            grid.innerHTML += `
            <div class="acc-card" id="acc-${acc.id}" data-search="${acc.name} ${acc.id}">
                <button onclick="hideMe('acc-${acc.id}')" class="absolute left-4 top-4 text-slate-300 no-print">✕</button>
                <div class="text-[10px] font-black text-indigo-500 mb-2">UID: ${acc.id}</div>
                <h3 class="text-xl font-black text-slate-800 h-14 overflow-hidden mb-6" onclick="showAccDetails('${acc.id}')">${acc.name}</h3>
                <div class="border-t pt-4 flex justify-between items-center">
                    <span class="text-slate-400 font-bold text-xs uppercase italic">Collection</span>
                    <span class="text-2xl font-black text-indigo-600 tracking-tighter">${acc.total.toLocaleString()} د.ع</span>
                </div>
            </div>`;
        }
    });
}

function showAccDetails(id) {
    const acc = accountingDB[id];
    document.getElementById('detailsModal').classList.remove('hidden');
    document.getElementById('whatsappLink').onclick = () => {
        let msg = `*بيور العلمي*%0A*كشف حساب:* ${acc.name}%0A*المطالبة:* ${acc.total.toLocaleString()} د.ع`;
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    document.getElementById('modalBody').innerHTML = `
        <div class="text-right mb-10 border-r-8 border-indigo-600 pr-6">
            <h2 class="text-4xl font-black text-slate-900">${acc.name}</h2>
            <p class="text-indigo-500 font-bold text-sm tracking-widest uppercase">Account: ${acc.id}</p>
        </div>
        <table class="w-full text-right">
            <thead>
                <tr class="bg-slate-50 text-slate-400 font-black text-xs border-b">
                    <th class="p-4 no-print">إخفاء</th>
                    <th class="p-4">رقم الفاتورة</th>
                    <th class="p-4 text-center">التاريخ</th>
                    <th class="p-4 text-left">المبلغ</th>
                </tr>
            </thead>
            <tbody>
                ${acc.bills.map((b, i) => `
                <tr id="row-${id}-${i}" class="border-b hover:bg-slate-50">
                    <td class="p-4 no-print"><button onclick="hideMe('row-${id}-${i}')" class="text-slate-300">✕</button></td>
                    <td class="p-4 font-mono font-black text-lg">${b.n}</td>
                    <td class="p-4 text-slate-400 text-center">${b.d}</td>
                    <td class="p-4 font-black text-indigo-900 text-left text-xl">${b.a}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        <div class="mt-10 bg-indigo-600 text-white p-10 rounded-[2.5rem] flex justify-between items-center shadow-xl">
            <span class="text-sm font-bold opacity-70 italic uppercase tracking-widest">Total Due</span>
            <span class="text-4xl font-black italic tracking-tighter">${acc.total.toLocaleString()} د.ع</span>
        </div>
    `;
}

function hideMe(id) { document.getElementById(id).classList.add('hidden-node'); }
function revealAll() { document.querySelectorAll('.hidden-node').forEach(el => el.classList.remove('hidden-node')); }
function closeModal() { document.getElementById('detailsModal').classList.add('hidden'); }

function filterData() {
    let q = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('.acc-card').forEach(card => {
        card.style.display = card.getAttribute('data-search').toLowerCase().includes(q) ? "block" : "none";
    });
}
