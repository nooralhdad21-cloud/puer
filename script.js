// تهيئة مكتبة PDF.js
const pdfLib = window['pdfjs-dist/build/pdf'];
pdfLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let masterData = {};

// دالة إشعارات احترافية (Toasts)
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-rose-500' : (type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500');
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm transform transition-all translate-y-10 opacity-0 flex items-center gap-2`;
    toast.innerHTML = type === 'success' ? `<span>✓</span> ${message}` : `<span>!</span> ${message}`;
    
    container.appendChild(toast);
    
    // إظهار الأنيميشن
    setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
    // الإخفاء والحذف
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// دالة تنظيف وتصحيح نصوص PDF
const sanitizeText = (str) => {
    if (!str) return "";
    return str.replace(/ѧ/g, '').replace(/([ا-ي])\s(?=[ا-ي])/g, '$1').trim();
};

// مراقب حدث اختيار الملف
document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
        showToast("يرجى اختيار ملف بصيغة PDF فقط.", "error");
        return;
    }

    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    
    try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfLib.getDocument({data: buffer}).promise;
        masterData = {};
        let foundAnyData = false;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const rawText = content.items.map(s => s.str).join(' ').replace(/\s+/g, ' ');

            // استخراج رقم الحساب واسم العميل
            const idMatch = rawText.match(/(?:رقم|الحساب|رق م)[:\-\s]*(\d{2,8})/);
            const nameMatch = rawText.match(/(?:الاسم|الاس م)[:\-\s]*(.*?)(?=رقم|رق م|الموبايل|العن)/);

            if (idMatch) {
                foundAnyData = true;
                const id = idMatch[1];
                const name = nameMatch ? sanitizeText(nameMatch[1]) : `عميل - ${id}`;
                
                if (!masterData[id]) masterData[id] = { id, name, bills: [], total: 0 };

                // استخراج الفواتير (دعم للمبالغ ذات الفواصل)
                const billRegex = /(\d{5,10})\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+([\d,]+\.\d{2}|[\d,]+)/g;
                let match;
                while ((match = billRegex.exec(rawText)) !== null) {
                    masterData[id].bills.push({ ref: match[1], date: match[2], amount: match[3] });
                    // إزالة الفواصل والنصوص لجمع الأرقام بشكل صحيح
                    const cleanAmount = parseFloat(match[3].replace(/,/g, ''));
                    if (!isNaN(cleanAmount)) masterData[id].total += cleanAmount;
                }
            }
        }

        if (foundAnyData) {
            showToast(`تم تحليل ${pdf.numPages} صفحات بنجاح.`);
            renderUI();
        } else {
            showToast("تم قراءة الملف ولكن لم يتم العثور على بيانات الحسابات.", "warning");
            document.getElementById('gridArea').innerHTML = `<div class="col-span-full text-center py-20 text-rose-500 font-bold border border-rose-200 bg-rose-50 rounded-3xl">لم يتم العثور على بيانات قابلة للقراءة في هذا الملف.</div>`;
        }
    } catch (err) {
        console.error("PDF Parsing Error:", err);
        showToast("حدث خطأ غير متوقع أثناء معالجة الملف.", "error");
    } finally {
        loader.classList.add('hidden');
        // تفريغ المُدخل للسماح برفع نفس الملف مجدداً إذا لزم الأمر
        e.target.value = '';
    }
});

// دالة عرض البطاقات
function renderUI() {
    const grid = document.getElementById('gridArea');
    grid.innerHTML = "";
    
    const accounts = Object.values(masterData).filter(acc => acc.total > 0);
    
    if (accounts.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500 font-bold">لا توجد ديون مسجلة في هذا الكشف.</div>`;
        return;
    }

    accounts.forEach(acc => {
        grid.innerHTML += `
        <div class="pharmacy-card account-item" onclick="openDetails('${acc.id}')">
            <div class="flex justify-between items-start mb-4">
                <span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">ID: ${acc.id}</span>
            </div>
            <h3 class="text-lg font-black text-slate-800 mb-6 leading-tight line-clamp-2 h-12 account-name">${acc.name}</h3>
            <div class="border-t border-slate-100 pt-4 mt-auto">
                <p class="text-slate-400 text-xs font-bold mb-1">الرصيد المطلوب</p>
                <p class="text-2xl font-black text-indigo-700">${acc.total.toLocaleString('en-US')} <span class="text-sm font-bold text-slate-400">د.ع</span></p>
            </div>
        </div>`;
    });
}

// دالة فتح نافذة التفاصيل
function openDetails(id) {
    const acc = masterData[id];
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('hidden');
    // إضافة كلاس التفعيل للأنيميشن
    setTimeout(() => overlay.classList.add('modal-active'), 10);

    // إعداد زر الواتساب
    document.getElementById('waBtn').onclick = () => {
        const text = `*شركة بيور فارما*%0A*السادة / ${acc.name}*%0Aتحية طيبة،%0Aمجموع الديون المتراكمة هو: *${acc.total.toLocaleString('en-US')} د.ع*%0Aيرجى مراجعة الكشوفات أعلاه.`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const tbody = acc.bills.map((b, i) => `
        <tr id="r-${id}-${i}" class="transition-colors hover:bg-slate-50">
            <td class="p-4 no-print text-center w-16">
                <input type="checkbox" onchange="document.getElementById('r-${id}-${i}').classList.toggle('row-checked', this.checked)" class="w-5 h-5 accent-emerald-500 cursor-pointer rounded">
            </td>
            <td class="p-4 font-bold text-slate-700 font-mono text-lg">${b.ref}</td>
            <td class="p-4 text-slate-500 text-center font-medium">${b.date}</td>
            <td class="p-4 font-black text-indigo-900 text-left text-xl">${b.amount}</td>
        </tr>
    `).join('');

    document.getElementById('modalBody').innerHTML = `
        <div class="border-r-[6px] border-indigo-500 pr-5 mb-8">
            <h2 class="text-3xl font-black text-slate-900 leading-tight">${acc.name}</h2>
            <p class="text-slate-500 font-medium text-sm mt-1">معرف الحساب بالنظام: <span class="font-bold">${acc.id}</span></p>
        </div>
        
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8">
            <table class="w-full text-right">
                <thead>
                    <tr class="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                        <th class="p-4 no-print text-center">التسديد</th>
                        <th class="p-4">رقم القائمة</th>
                        <th class="p-4 text-center">تاريخ الإصدار</th>
                        <th class="p-4 text-left">مبلغ الفاتورة</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${tbody}
                </tbody>
            </table>
        </div>
        
        <div class="total-box bg-slate-800 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center shadow-xl border border-slate-700">
            <div class="text-center md:text-right mb-4 md:mb-0">
                <span class="text-indigo-300 text-sm font-bold block mb-1">الإجمالي الكلي للاستحصال</span>
                <span class="text-slate-300 text-xs">صافي المبلغ المطلوب دفعه</span>
            </div>
            <div class="text-4xl font-black tracking-tight text-emerald-400">
                ${acc.total.toLocaleString('en-US')} <span class="text-lg font-bold text-white ml-1">د.ع</span>
            </div>
        </div>
    `;
}

// إغلاق النافذة
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('modal-active');
    setTimeout(() => { overlay.classList.add('hidden'); }, 300); // الانتظار حتى انتهاء الأنيميشن
}

// محرك البحث الفوري
document.getElementById('searchInput').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.account-item');
    
    cards.forEach(card => {
        // البحث في اسم الحساب والمعرف (ID)
        const text = card.textContent.toLowerCase();
        if (text.includes(term)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});
