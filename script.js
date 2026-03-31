const pdfLib = window['pdfjs-dist/build/pdf'];
// استخدام رابط مباشر ومستقر للمكتبة
pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let masterData = {};

const fixText = (s) => s ? s.replace(/ѧ/g, '').replace(/([ا-ي])\s(?=[ا-ي])/g, '$1').trim() : "غير معروف";

document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('hidden');
    
    try {
        const buffer = await file.arrayBuffer();
        
        // محاولة فتح الملف مع خيار تخطي كلمة السر الفارغة
        const loadingTask = pdfLib.getDocument({
            data: buffer,
            stopAtErrors: false,
            password: "" // محاولة الدخول بكلمة سر فارغة
        });

        const pdf = await loadingTask.promise;
        masterData = {};

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const rawText = content.items.map(s => s.str).join(' ').replace(/\s+/g, ' ');

            // فلتر البحث عن رقم الحساب (دعم صيغ أصيل وبيور)
            const idMatch = rawText.match(/(?:رقم|الحساب|حساب|رق م)[:\-\s]*(\d+)/);
            const nameMatch = rawText.match(/(?:الاسم|الاس م|اسم)[:\-\s]*(.*?)(?=رقم|الموبايل|تاريخ|الرصيد|العن|صندوق)/);

            if (idMatch) {
                let id = idMatch[1];
                let name = nameMatch ? fixText(nameMatch[1]) : "حساب رقم: " + id;
                
                if (!masterData[id]) masterData[id] = { id, name, bills: [], total: 0 };

                // التقاط الفواتير والمبالغ
                const regex = /(\d+)?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+([\d,]+\.\d{2}|[\d,]+)/g;
                let m;
                while ((m = regex.exec(rawText)) !== null) {
                    masterData[id].bills.push({ n: m[1] || "قائمة", d: m[2], a: m[3] });
                    const val = parseFloat(m[3].replace(/,/g, ''));
                    if(!isNaN(val)) masterData[id].total += val;
                }
            }
        }
        
        if(Object.keys(masterData).length > 0) {
            renderUI();
        } else {
            alert("تم قراءة الملف ولكن لم نجد بيانات حسابات واضحة. تأكد أن الملف ليس 'صورة' (Scanner).");
        }
        
    } catch (err) { 
        console.error("Error Detail:", err);
        if (err.name === 'PasswordException') {
            alert("هذا الملف محمي بكلمة سر حقيقية. يرجى إزالة الحماية قبل الرفع.");
        } else {
            alert("فشل النظام في قراءة الملف. حاول تحديث الصفحة (Refresh) ثم الرفع مجدداً.");
        }
    }
    
    if(loader) loader.classList.add('hidden');
    e.target.value = ''; 
});

function renderUI() {
    const grid = document.getElementById('gridArea') || document.getElementById('mainGrid');
    if(!grid) return;
    grid.innerHTML = "";
    
    Object.values(masterData).forEach(acc => {
        grid.innerHTML += `
        <div class="pharmacy-card shadow-sm p-6 bg-white border border-slate-200 rounded-[2rem] cursor-pointer hover:shadow-xl hover:border-indigo-500 transition-all" onclick="openDetails('${acc.id}')">
            <div class="text-[10px] font-bold text-indigo-500 mb-2 uppercase">ID: ${acc.id}</div>
            <h3 class="text-xl font-black text-slate-800 mb-6 h-14 overflow-hidden">${acc.name}</h3>
            <div class="flex justify-between items-center border-t border-slate-100 pt-4">
                <span class="text-slate-400 text-xs font-bold italic">إجمالي الدين</span>
                <span class="text-2xl font-black text-indigo-600 tracking-tighter">${acc.total.toLocaleString()} <small class="text-xs">د.ع</small></span>
            </div>
        </div>`;
    });
}

function openDetails(id) {
    const acc = masterData[id];
    const modal = document.getElementById('modalOverlay');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('modal-active');
    }
    
    const modalBody = document.getElementById('modalBody');
    if(modalBody) {
        modalBody.innerHTML = `
            <div class="border-r-8 border-indigo-600 pr-6 mb-10">
                <h2 class="text-3xl font-black text-slate-900">${acc.name}</h2>
                <p class="text-slate-400 font-bold text-xs">رقم الحساب: ${acc.id}</p>
            </div>
            <table class="w-full text-right mb-10">
                <thead>
                    <tr class="text-slate-400 text-[10px] font-black uppercase border-b-2">
                        <th class="p-4 no-print text-center">سدد</th>
                        <th class="p-4">رقم القائمة</th>
                        <th class="p-4 text-center">التاريخ</th>
                        <th class="p-4 text-left">المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${acc.bills.map((b, i) => `
                    <tr id="r-${id}-${i}" class="border-b border-slate-50 hover:bg-slate-50">
                        <td class="p-4 no-print text-center"><input type="checkbox" onchange="document.getElementById('r-${id}-${i}').classList.toggle('row-checked', this.checked)" class="w-5 h-5 accent-indigo-600 cursor-pointer"></td>
                        <td class="p-4 font-bold text-slate-700">${b.n}</td>
                        <td class="p-4 text-slate-400 text-center text-xs font-mono">${b.d}</td>
                        <td class="p-4 font-black text-indigo-900 text-left text-xl">${b.a}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <div class="total-box bg-slate-900 text-white p-8 rounded-[2.5rem] flex justify-between items-center shadow-xl">
                <span class="font-bold">صافي المطلوب</span>
                <span class="text-3xl font-black text-indigo-400">${acc.total.toLocaleString()} د.ع</span>
            </div>
        `;
    }
}

function closeModal() {
    const modal = document.getElementById('modalOverlay');
    if(modal) {
        modal.classList.remove('modal-active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}
