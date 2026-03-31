const pdfEngine = window['pdfjs-dist/build/pdf'];
pdfEngine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let appData = {};

// معالج نصوص "أصيل" الاحترافي
const fixOCR = (str) => str.replace(/ѧ/g, '').replace(/([ا-ي])\s(?=[ا-ي])/g, '$1').trim();

document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    
    try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfEngine.getDocument({data: buffer}).promise;
        appData = {};

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const rawText = content.items.map(s => s.str).join(' ');

            const idM = rawText.match(/(?:رقم|الحساب|رق م)[:\-\s]*(\d{2,6})/);
            const nameM = rawText.match(/(?:الاسم|الاس م)[:\-\s]*(.*?)(?=رقم|رق م|الموبايل|العن)/);

            if (idM) {
                let id = idM[1];
                let name = nameM ? fixOCR(nameM[1]) : `حساب رقم ${id}`;
                
                if (!appData[id]) appData[id] = { id, name, items: [], grandTotal: 0 };

                // استخراج الفواتير (رقم، تاريخ، مبلغ)
                const billRegex = /(\d{5,8})\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+([\d,]+\.\d{2})/g;
                let match;
                while ((match = billRegex.exec(rawText)) !== null) {
                    appData[id].items.push({ ref: match[1], date: match[2], val: match[3] });
                    appData[id].grandTotal += parseFloat(match[3].replace(/,/g, ''));
                }
            }
        }
        renderDashboard();
    } catch (error) {
        alert("حدث خطأ في قراءة الملف، تأكد أنه ملف PDF صحيح.");
    }
    loader.classList.add('hidden');
});

function renderDashboard() {
    const grid = document.getElementById('mainGrid');
    const countAcc = document.getElementById('countAcc');
    const sumTotal = document.getElementById('sumTotal');
    
    grid.innerHTML = "";
    let totalAll = 0;
    let count = 0;

    Object.values(appData).forEach(acc => {
        if(acc.grandTotal > 0) {
            count++;
            totalAll += acc.grandTotal;
            grid.innerHTML += `
            <div class="pharmacy-card group" id="card-${acc.id}" data-search="${acc.name} ${acc.id}">
                <button onclick="hideNode('card-${acc.id}')" class="absolute left-6 top-6 text-slate-200 hover:text-red-500 no-print transition-colors">✕</button>
                <span class="text-[10px] font-black text-indigo-500 tracking-[3px] uppercase">Client ID: ${acc.id}</span>
                <h3 class="text-2xl font-black text-slate-800 mt-2 mb-8 h-16 overflow-hidden leading-tight group-hover:text-indigo-600 transition-colors" onclick="showAccount('${acc.id}')">${acc.name}</h3>
                <div class="flex justify-between items-end border-t border-slate-50 pt-6">
                    <div>
                        <p class="text-[10px] text-slate-400 font-bold uppercase italic">Balance Due</p>
                        <p class="text-2xl font-black text-slate-900 tracking-tighter">${acc.grandTotal.toLocaleString()} <span class="text-xs">IQD</span></p>
                    </div>
                    <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                </div>
            </div>`;
        }
    });
    countAcc.innerText = count;
    sumTotal.innerText = totalAll.toLocaleString() + " د.ع";
}

function showAccount(id) {
    const acc = appData[id];
    const modal = document.getElementById('modalOverlay');
    modal.classList.remove('hidden');
    
    document.getElementById('waBtn').onclick = () => {
        const text = `*بيور العلمي - Pure Pharma*%0A*العميل:* ${acc.name}%0A*المبلغ الكلي:* ${acc.grandTotal.toLocaleString()} د.ع%0A_يرجى مراجعة الحسابات أعلاه_`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    document.getElementById('modalBody').innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div class="border-r-[14px] border-indigo-600 pr-8">
                <h2 class="text-5xl font-black text-slate-900 leading-none">${acc.name}</h2>
                <p class="text-indigo-500 font-bold mt-3 tracking-widest uppercase text-sm italic">Verified Account: ${acc.id}</p>
            </div>
            <div class="text-left bg-slate-100 px-8 py-4 rounded-2xl">
                <p class="text-[10px] text-slate-400 font-black uppercase">التاريخ الحالي</p>
                <p class="font-bold text-slate-700">${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
        </div>

        <table class="w-full text-right">
            <thead>
                <tr class="text-slate-400 text-[10px] font-black uppercase border-b-2">
                    <th class="p-5 no-print text-center w-20">الحالة</th>
                    <th class="p-5">رقم الفاتورة</th>
                    <th class="p-5 text-center">التاريخ</th>
                    <th class="p-5 text-left">المبلغ الصافي</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                ${acc.items.map((item, idx) => `
                <tr id="row-${id}-${idx}" class="group hover:bg-slate-50 transition-colors">
                    <td class="p-5 no-print text-center">
                        <input type="checkbox" onchange="document.getElementById('row-${id}-${idx}').classList.toggle('row-paid', this.checked)" class="w-6 h-6 rounded-lg accent-indigo-600 cursor-pointer">
                    </td>
                    <td class="p-5 font-black text-slate-700 text-lg italic">${item.ref}</td>
                    <td class="p-5 text-slate-400 font-bold text-center text-xs tracking-widest">${item.date}</td>
                    <td class="p-5 font-black text-indigo-900 text-left text-2xl tracking-tighter">${item.val}</td>
                </tr>`).join('')}
            </tbody>
        </table>

        <div class="mt-12 bg-slate-900 text-white p-12 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center shadow-2xl total-box relative overflow-hidden">
            <div class="absolute left-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full -ml-32 -mt-32"></div>
            <div class="relative z-10 text-center md:text-right mb-6 md:mb-0">
                <span class="text-xs font-black uppercase tracking-[0.5em] text-indigo-400 block mb-2">Total Outstanding</span>
                <h4 class="text-xl font-bold">المجموع النهائي المطلوب استحصاله</h4>
            </div>
            <div class="relative z-10 text-5xl md:text-7xl font-black tracking-tighter text-indigo-300 italic">
                ${acc.grandTotal.toLocaleString()} <span class="text-lg">د.ع</span>
            </div>
        </div>
        <div class="mt-10 pt-10 border-t border-dashed text-center text-slate-300 font-bold italic no-print">
            نهاية الكشف الرسمي - Pure Pharma PRO Edition
        </div>
    `;
}

function hideNode(id) { document.getElementById(id).classList.add('hidden-item'); }
function showAll() { document.querySelectorAll('.hidden-item').forEach(el => el.classList.remove('hidden-item')); }
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }
function filterData() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('[data-search]').forEach(card => {
        card.style.display = card.getAttribute('data-search').toLowerCase().includes(q) ? "block" : "none";
    });
}
