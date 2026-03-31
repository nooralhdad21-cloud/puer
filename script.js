const pdfLib = window['pdfjs-dist/build/pdf'];
pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let appData = {};

function clean(s) {
    return s.replace(/ѧ/g, '').replace(/([ا-ي])\s(?=[ا-ي])/g, '$1').trim();
}

document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('loader').classList.remove('hidden');
    const arrayBuffer = await file.arrayBuffer();
    
    try {
        const pdf = await pdfLib.getDocument({data: arrayBuffer}).promise;
        appData = {};

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items.map(s => s.str).join(' ');

            let idMatch = text.match(/(?:رقم|الحساب|رق م)[:\-\s]*(\d{2,6})/);
            let nameMatch = text.match(/(?:الاسم|الاس م)[:\-\s]*(.*?)(?=رقم|رق م|الموبايل|العن)/);

            if (idMatch) {
                let id = idMatch[1];
                let name = nameMatch ? clean(nameMatch[1]) : "جهة: " + id;
                if (!appData[id]) appData[id] = { id, name, bills: [], total: 0 };

                let regex = /(\d{5,8})\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+([\d,]+\.\d{2})/g;
                let m;
                while ((m = regex.exec(text)) !== null) {
                    appData[id].bills.push({ n: m[1], d: m[2], a: m[3] });
                    appData[id].total += parseFloat(m[3].replace(/,/g, ''));
                }
            }
        }
        render();
    } catch (err) { console.error(err); }
    document.getElementById('loader').classList.add('hidden');
});

function render() {
    const grid = document.getElementById('mainGrid');
    grid.innerHTML = "";
    Object.values(appData).forEach(c => {
        if(c.total > 0) {
            grid.innerHTML += `
            <div class="card-pharmacy" id="card-${c.id}" data-search="${c.name} ${c.id}">
                <button onclick="hideCard('${c.id}')" class="absolute left-4 top-4 text-slate-300 hover:text-red-400 no-print">👁️</button>
                <div class="text-[10px] font-black text-indigo-500 mb-2 uppercase italic tracking-widest">ID: ${c.id}</div>
                <h3 class="text-xl font-black text-slate-800 h-14 overflow-hidden mb-6" onclick="openModal('${c.id}')" style="cursor:pointer">${c.name}</h3>
                <div class="border-t pt-4 flex justify-between items-center">
                    <span class="text-slate-400 font-bold text-xs">إجمالي الدين</span>
                    <span class="text-2xl font-black text-indigo-600 tracking-tighter">${c.total.toLocaleString()} د.ع</span>
                </div>
            </div>`;
        }
    });
}

function openModal(id) {
    const c = appData[id];
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('waBtn').onclick = () => {
        window.open(`https://wa.me/?text=*بيور العلمي - كشف حساب*%0A*العميل:* ${c.name}%0A*المبلغ:* ${c.total.toLocaleString()} د.ع`, '_blank');
    };

    document.getElementById('modalBody').innerHTML = `
        <div class="text-right mb-10 border-r-8 border-indigo-600 pr-6">
            <h2 class="text-4xl font-black text-slate-900">${c.name}</h2>
            <p class="text-indigo-500 font-bold text-sm mt-1 uppercase italic tracking-widest">Account UID: ${c.id}</p>
        </div>
        <table class="w-full text-right border-collapse">
            <thead>
                <tr class="bg-slate-100 text-slate-500 font-black text-xs uppercase border-b">
                    <th class="p-4 no-print">إخفاء</th>
                    <th class="p-4">رقم الفاتورة</th>
                    <th class="p-4 text-center">التاريخ</th>
                    <th class="p-4 text-left">المبلغ المتبقي</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                ${c.bills.map((b, i) => `
                <tr id="row-${id}-${i}" class="hover:bg-slate-50 transition">
                    <td class="p-4 no-print"><button onclick="hideRow('${id}-${i}')" class="text-slate-300 hover:text-red-500">✕</button></td>
                    <td class="p-4 font-black font-mono text-lg">${b.n}</td>
                    <td class="p-4 text-slate-400 font-bold text-center">${b.d}</td>
                    <td class="p-4 font-black text-indigo-900 text-left text-xl">${b.a}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        <div class="mt-10 bg-indigo-900 text-white p-10 rounded-[3rem] flex justify-between items-center">
            <span class="text-lg font-bold opacity-70 italic uppercase tracking-widest">Grand Total</span>
            <span class="text-4xl font-black italic tracking-tighter">${c.total.toLocaleString()} د.ع</span>
        </div>
    `;
}

function hideCard(id) { document.getElementById(`card-${id}`).classList.add('hidden-item'); }
function hideRow(id) { document.getElementById(`row-${id}`).classList.add('hidden-item'); }
function resetAll() { document.querySelectorAll('.hidden-item').forEach(el => el.classList.remove('hidden-item')); }

function filterUI() {
    let q = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('.card-pharmacy').forEach(card => {
        card.style.display = card.getAttribute('data-search').toLowerCase().includes(q) ? "block" : "none";
    });
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
