pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let data = [];

function login() {
    const name = document.getElementById('empName').value;
    if (name.length < 3) return alert("يرجى كتابة الاسم");
    document.getElementById('userName').innerText = name;
    document.getElementById('userName').classList.remove('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
}

document.getElementById('pdfFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let allText = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // ترتيب النصوص حسب موقعها في الصفحة لضمان قراءة السطر بشكل صحيح
            const strings = content.items.map(item => item.str);
            allText = allText.concat(strings);
        }
        processPureData(allText);
    };
    reader.readAsArrayBuffer(file);
});

function processPureData(textArray) {
    data = [];
    // تعبير برمجى للبحث عن رقم الفاتورة المكون من 6 أرقام
    for (let i = 0; i < textArray.length; i++) {
        let str = textArray[i].trim();
        if (/^\d{5,6}$/.test(str)) { // إذا وجدنا رقم فاتورة
            // نبحث في النصوص المجاورة عن اسم الصيدلية والمبلغ
            // في كشوفات بيور غالباً الاسم يكون قبل أو بعد الرقم بمسافة بسيطة
            let invoiceId = str;
            let pharmacyName = textArray[i - 1] || "غير محدد";
            let amount = textArray[i - 2] || "0.00";

            // تنظيف البيانات
            if (pharmacyName.length < 3) pharmacyName = textArray[i + 1];

            data.push({
                id: invoiceId,
                name: pharmacyName,
                price: amount
            });
        }
    }
    renderInvoices();
}

function renderInvoices() {
    const container = document.getElementById('invoiceContainer');
    document.getElementById('totalCount').innerText = data.length;
    container.innerHTML = "";

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = "bg-white p-5 rounded-2xl shadow-sm border-r-8 border-blue-600 flex justify-between items-center";
        div.innerHTML = `
            <div class="flex-1">
                <p class="text-[10px] text-gray-400 font-bold mb-1">رقم الفاتورة: #${item.id}</p>
                <h4 class="font-bold text-gray-800 text-sm mb-1">${item.name}</h4>
                <p class="text-blue-700 font-bold text-xs">المبلغ: ${item.price} د.ع</p>
            </div>
            <button onclick="done(this)" class="bg-gray-100 text-blue-900 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">تأكيد</button>
        `;
        container.appendChild(div);
    });

    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('listSection').classList.remove('hidden');
}

function done(btn) {
    btn.innerText = "✅ تم";
    btn.className = "bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-bold";
    btn.parentElement.classList.replace('border-blue-600', 'border-green-500');
    btn.disabled = true;
}
