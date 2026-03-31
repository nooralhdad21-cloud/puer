const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let masterDB = {};

// دالة إصلاح نصوص نظام أصيل (دمج الحروف المقطعة)
const fixAsilText = (text) => {
    return text.replace(/ѧ/g, '').replace(/([ا-ي])\s(?=[ا-ي])/g, '$1').trim();
};

document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('loader').classList.remove('hidden');
    const buffer = await file.arrayBuffer();
    
    try {
        const pdf = await pdfjsLib.getDocument({data: buffer}).promise;
        masterDB = {};

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // دمج النصوص مع تنظيف المسافات الزائدة
            const rawText = content.items.map(s => s.str).join(' ').replace(/\s+/g, ' ');

            // البحث عن رقم الحساب والاسم
            let idMatch = rawText.match(/(?:رقم|الحساب|رق م)[:\-\s]*(\d{2,7})/);
            let nameMatch = rawText.match(/(?:الاسم|الاس م)[:\-\s]*(.*?)(?=رقم|رق م|الموبايل|العن)/);

            if (idMatch) {
                let id = idMatch[1];
                let name = nameMatch ? fixAsilText(nameMatch[1]) : "عميل رقم " + id;
                
                if (!masterDB[id]) masterDB[id] = { id, name, bills: [], total: 0 };

                // نمط استخراج الفواتير (رقم القائمة - التاريخ - المبلغ)
                const billPattern = /(\d{5,9})\s+(\d{4}\/\d{1,2}\/\d{1,2})\s+([\d,]+\.\d{2})/g;
                let match;
                while ((match = billPattern.exec(rawText)) !== null) {
                    masterDB[id].bills.push({ n: match[1], d: match[2], a: match[3] });
                    masterDB[id].total += parseFloat(match[3].replace(/,/g, ''));
                }
            }
        }

        if (Object.keys(masterDB).length === 0) {
            alert("تنبيه: تم قراءة الملف ولكن لم يتم العثور على بيانات مطابقة لنظام أصيل. تأكد من جودة ملف الـ PDF.");
        }
        
        renderGrid();
    } catch (err) {
        console.error("PDF Error:", err);
        alert("حدث خطأ أثناء معالجة الملف.");
    }
    document.getElementById('loader').classList.add('hidden');
});

function renderGrid() {
    const grid = document.getElementById('gridArea') || document.getElementById('mainGrid');
    grid.innerHTML = "";
    
    const entries = Object.values(masterDB);
    if (entries.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-slate-400 font-bold">لا توجد بيانات لعرضها. تأكد من رفع ملف الكشف الصحيح.</div>`;
        return;
    }

    entries.forEach(acc => {
        if(acc.total > 0) {
            grid.innerHTML += `
            <div class="pharmacy-card p-8 shadow-sm border border-slate-100 bg-white rounded-[2rem] hover:shadow-xl transition-all cursor-pointer" onclick="openDetails('${acc.id}')">
                <div class="text-[10px] font-bold text-indigo-500 mb-2 uppercase tracking-widest">ID: ${acc.id}</div>
                <h3 class="text-xl font-black text-slate-800 mb-6 h-14 overflow-hidden">${acc.name}</h3>
                <div class="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span class="text-slate-400 text-xs font-bold">إجمالي الدين:</span>
                    <span class="text-2xl font-black text-indigo-600">${acc.total.toLocaleString()} <small class="text-xs">د.ع</small></span>
                </div>
            </div>`;
        }
    });
}
