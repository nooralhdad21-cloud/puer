pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

function handleLogin() {
    const name = document.getElementById('nameInput').value;
    if (name.trim().length < 3) return alert("يرجى إدخال اسمك الكامل");
    document.getElementById('badge').innerText = "المندوب: " + name;
    document.getElementById('badge').classList.remove('hidden');
    document.getElementById('loginStep').classList.add('hidden');
    document.getElementById('uploadStep').classList.remove('hidden');
}

document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let allLines = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            allLines = allLines.concat(content.items.map(item => item.str));
        }
        processKashf(allLines);
    };
    reader.readAsArrayBuffer(file);
});

function processKashf(lines) {
    const container = document.getElementById('results');
    container.innerHTML = '<h3 class="font-bold mb-4 px-2 text-gray-700">الفواتير المستخرجة:</h3>';
    
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
        let text = lines[i].trim();
        // البحث عن رقم الفاتورة (6 أرقام)
        if (/^\d{5,6}$/.test(text)) {
            count++;
            let id = text;
            let pharmacy = "صيدلية غير محددة";
            let amount = "0.00";

            // فحص النصوص المجاورة لاستخراج الاسم والسعر
            for(let j=1; j<=12; j++) {
                let p = lines[i-j] || "";
                let n = lines[i+j] || "";
                if(/[\u0600-\u06FF]/.test(p) && pharmacy === "صيدلية غير محددة" && p.length > 5) pharmacy = p;
                if(/[\d,]+\.\d{2}/.test(p) && amount === "0.00") amount = p;
                if(/[\u0600-\u06FF]/.test(n) && pharmacy === "صيدلية غير محددة" && n.length > 5) pharmacy = n;
                if(/[\d,]+\.\d{2}/.test(n) && amount === "0.00") amount = n;
            }

            const card = document.createElement('div');
            card.className = "bg-white p-5 rounded-[1.5rem] shadow-sm border-r-[10px] border-blue-600 flex justify-between items-center mb-4 animate-in";
            card.innerHTML = `
                <div class="flex-1 px-2">
                    <p class="text-[10px] text-blue-500 font-bold tracking-widest uppercase">رقم #${id}</p>
                    <h4 class="font-bold text-gray-800 text-sm my-1">${pharmacy}</h4>
                    <p class="text-blue-700 font-bold text-xs bg-blue-50 px-2 py-1 rounded-lg inline-block mt-1">المبلغ: ${amount} د.ع</p>
                </div>
                <button onclick="confirmItem(this)" class="bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">تأكيد</button>
            `;
            container.appendChild(card);
        }
    }
    
    if(count === 0) alert("لم يتم العثور على فواتير، تأكد من جودة الملف");
    document.getElementById('uploadStep').classList.add('hidden');
    document.getElementById('listStep').classList.remove('hidden');
}

function confirmItem(btn) {
    btn.innerText = "✅ تم";
    btn.className = "bg-green-100 text-green-700 px-6 py-3 rounded-xl text-xs font-bold border border-green-200";
    btn.parentElement.classList.replace('border-blue-600', 'border-green-500');
    btn.disabled = true;
}
