pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let employee = "";
let extractedData = [];

function saveEmployee() {
    const name = document.getElementById('employeeName').value;
    if (name.length < 5) return alert("يرجى إدخال اسمك الكامل");
    employee = name;
    document.getElementById('userBadge').innerText = "الموظف: " + name;
    document.getElementById('userBadge').classList.remove('hidden');
    document.getElementById('loginStep').classList.add('hidden');
    document.getElementById('uploadStep').classList.remove('hidden');
}

document.getElementById('pdfFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(s => s.str).join(' ');
        }
        
        parsePureData(fullText);
    };
    reader.readAsArrayBuffer(file);
});

function parsePureData(text) {
    extractedData = [];
    // تعبير برمجى متطور للبحث عن: رقم الفاتورة (6 أرقام) والمبالغ
    const invoicePattern = /(\d{5,6})\s+([\u0600-\u06FF\s\/]+)\s+([\d,]+\.\d{2})/g;
    let match;

    while ((match = invoicePattern.exec(text)) !== null) {
        extractedData.push({
            id: match[1],
            client: match[2].trim().substring(0, 30), // اسم الصيدلية
            amount: match[3] // المبلغ
        });
    }

    if (extractedData.length === 0) {
        // محاولة بديلة إذا كان التنسيق مختلف
        const backupPattern = /(\d{5,6})/g;
        const simpleMatches = text.match(backupPattern);
        if(simpleMatches) {
            simpleMatches.forEach(id => {
                extractedData.push({ id: id, client: "غير محدد", amount: "---" });
            });
        }
    }

    renderList();
}

function renderList() {
    const list = document.getElementById('invoiceList');
    document.getElementById('invoiceCount').innerText = extractedData.length;
    list.innerHTML = "";

    extractedData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-2xl shadow-sm border invoice-card flex justify-between items-center";
        card.innerHTML = `
            <div>
                <p class="text-xs text-blue-600 font-bold mb-1">فاتورة #${item.id}</p>
                <h4 class="font-bold text-gray-800">${item.client}</h4>
                <p class="text-sm text-gray-500">المبلغ: ${item.amount} د.ع</p>
            </div>
            <button onclick="markDone(this)" class="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all">تأكيد</button>
        `;
        list.appendChild(card);
    });

    document.getElementById('uploadStep').classList.add('hidden');
    document.getElementById('matchStep').classList.remove('hidden');
}

function markDone(btn) {
    const card = btn.parentElement;
    card.classList.add('matched');
    btn.innerText = "✅ تم";
    btn.disabled = true;
    btn.className = "bg-green-100 text-green-700 px-5 py-2 rounded-xl text-sm font-bold";
}
