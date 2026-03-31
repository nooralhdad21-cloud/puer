const pdfLib = window['pdfjs-dist/build/pdf'];
pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let masterData = {};

// دالة تصليح النصوص المعطوبة في الـ PDF
const fixText = (s) => s ? s.replace(/ѧ/g, '').replace(/([ا-ي])\s(?=[ا-ي])/g, '$1').trim() : "غير معروف";

document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // تشغيل تأثير التحميل
    const loader = document.getElementById('loader');
    if(loader) loader.classList.remove('hidden');
    
    try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfLib.getDocument({data: buffer}).promise;
        masterData = {};

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // تجميع النص وتنظيف المسافات الزائدة
            const rawText = content.items.map(s => s.str).join(' ').replace(/\s+/g, ' ');

            // فلاتر مرنة جداً لالتقاط كلمة (رقم، حساب، الحساب)
            const idMatch = rawText.match(/(?:رقم|الحساب|حساب|رق م)[:\-\s]*(\d+)/);
            // فلتر مرن لالتقاط الاسم
            const nameMatch = rawText.match(/(?:الاسم|الاس م|اسم)[:\-\s]*(.*?)(?=رقم|الموبايل|تاريخ|الرصيد|العن)/);

            if (idMatch) {
                let id = idMatch[1];
                let name = nameMatch ? fixText(nameMatch[1]) : "عميل مسجل بـ ID: " + id;
                
                if (!masterData[id]) masterData[id] = { id, name, bills: [], total: 0 };

                // فلتر الفواتير: يبحث عن (تاريخ) متبوع بـ (مبلغ)
                const regex = /(\d+)?\s*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+([\d,]+\.\d{2}|[\d,]+)/g;
                let m;
                while ((m = regex.exec(rawText)) !== null) {
                    masterData[id].bills.push({ 
                        n: m[1] || "بدون رقم", 
                        d: m[2], 
                        a: m[3] 
                    });
                    // جمع المبالغ وتجاهل الفواصل
                    masterData[id].total += parseFloat(m[3].replace(/,/g, ''));
                }
            }
        }
        
        alert("تم رفع وتحليل " + pdf.numPages + " صفحات بنجاح!");
        renderUI();
        
    } catch (err) { 
        console.error("مشكلة في القراءة:", err); 
        alert("حدث خطأ في قراءة ملف الـ PDF. تأكد أنه ليس صورة (Scanned)."); 
    }
    
    if(loader) loader.classList.add('hidden');
    e.target.value = ''; // تصفير زر الرفع لكي تتمكن من رفع الملف مرة أخرى
});

function renderUI() {
    // محاولة اصطياد العنصر سواء كان اسمه gridArea أو mainGrid
    const grid = document.getElementById('gridArea') || document.getElementById('mainGrid');
    grid.innerHTML = "";
    
    const accounts = Object.values(masterData);
    
    // إذا لم يجد أي حساب نهائياً
    if (accounts.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-rose-500 font-bold border-2 border-dashed border-rose-300 rounded-[2rem] bg-rose-50">لم يتمكن النظام من العثور على أرقام الحسابات. يبدو أن الكشف ليس من نظام محاسبي مباشر أو أنه عبارة عن صور.</div>`;
        return;
    }

    accounts.forEach(acc => {
        // قمنا بإلغاء الإخفاء، ستظهر كل الحسابات الآن لغرض التجربة
        grid.innerHTML += `
        <div class="pharmacy-card shadow-sm p-6 bg-white border border-slate-200 rounded-[2rem] cursor-pointer hover:shadow-xl hover:border-indigo-500 transition-all" onclick="openDetails('${acc.id}')">
            <div class="text-[10px] font-bold text-indigo-500 mb-2 uppercase tracking-tighter">Account ID: ${acc.id}</div>
            <h3 class="text-xl font-black text-slate-800 mb-6 h-14 overflow-hidden">${acc.name}</h3>
            <div class="flex justify-between items-center border-t border-slate-100 pt-4">
                <span class="text-slate-400 text-xs font-bold italic">إجمالي الدين</span>
                <span class="text-2xl font-black ${acc.total > 0 ? 'text-indigo-600' : 'text-rose-500'} tracking-tighter">${acc.total.toLocaleString()} <small class="text-xs">د.ع</small></span>
            </div>
        </div>`;
    });
}

function openDetails(id) {
    const acc = masterData[id];
    const modal = document.getElementById('modalOverlay');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('modal-active'); // تفعيل الأنيميشن
    }
    
    const waBtn = document.getElementById('waBtn');
    if(waBtn) waBtn.onclick = () => {
        window.open(`https://wa.me/?text=*بيور العلمي*%0A*العميل:* ${acc.name}%0A*الدين:* ${acc.total.toLocaleString()} د.ع`, '_blank');
    };

    const modalBody = document.getElementById('modalBody');
    if(modalBody) {
        modalBody.innerHTML = `
            <div class="border-r-8 border-indigo-600 pr-6 mb-10">
                <h2 class="text-4xl font-black text-slate-900">${acc.name}</h2>
                <p class="text-slate-400 font-bold uppercase text-xs">Verified Account: ${acc.id}</p>
            </div>
            <div class="overflow-x-auto">
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
                        <tr id="r-${id}-${i}" class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td class="p-4 no-print text-center"><input type="checkbox" onchange="document.getElementById('r-${id}-${i}').classList.toggle('row-checked', this.checked)" class="w-5 h-5 accent-indigo-600 cursor-pointer"></td>
                            <td class="p-4 font-bold text-slate-700">${b.n}</td>
                            <td class="p-4 text-slate-400 text-center text-xs tracking-widest">${b.d}</td>
                            <td class="p-4 font-black text-indigo-900 text-left text-xl">${b.a}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div class="total-box mt-4 bg-slate-900 text-white p-10 rounded-[3rem] flex flex-col md:flex-row justify-between items-center shadow-xl">
                <span class="font-bold mb-4 md:mb-0">المجموع الكلي المطلوب</span>
                <span class="text-4xl font-black italic text-indigo-400">${acc.total.toLocaleString()} <small class="text-sm text-white">د.ع</small></span>
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

// دالة البحث المباشر
document.getElementById('searchInput').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.pharmacy-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(term) ? "block" : "none";
    });
});
