pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let empName = "";
let dataList = [];

// 1. تسجيل الدخول
function startApp() {
    const name = document.getElementById('empName').value;
    if (name.length < 3) return alert("يرجى إدخال اسمك");
    empName = name;
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    document.getElementById('status').innerText = "الموظف: " + name;
    document.getElementById('status').classList.remove('hidden');
}

// 2. قراءة ملف PDF
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = "";

        // قراءة كافة الصفحات
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(s => s.str).join(' ');
        }
        
        extractInvoices(text);
    };
    reader.readAsArrayBuffer(file);
});

// 3. استخراج البيانات (رقم الفاتورة واسم المذخر)
function extractInvoices(text) {
    dataList = [];
    // البحث عن أرقام الفواتير المكونة من 5 أو 6 أرقام
    const regex = /(\d{5,6})/g;
    const matches = text.match(regex);

    if (matches) {
        // تنظيف المكرر وتحويلها لقائمة
        const uniqueInvoices = [...new Set(matches)];
        uniqueInvoices.forEach(id => {
            dataList.push({ id: id, status: 'انتظار' });
        });
        showResults();
    } else {
        alert("لم يتم العثور على فواتير في الملف، تأكد أنه ملف كشف صحيح.");
    }
}

// 4. عرض النتائج
function showResults() {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.remove('hidden');
    const listDiv = document.getElementById('resultsList');
    document.getElementById('counter').innerText = dataList.length;
    
    listDiv.innerHTML = "";
    dataList.forEach(item => {
        const div = document.createElement('div');
        div.className = "invoice-card";
        div.innerHTML = `
            <div>
                <p class="text-xs text-gray-400">رقم الفاتورة</p>
                <p class="font-bold text-lg">#${item.id}</p>
            </div>
            <button onclick="confirmInv(this)" class="btn-check">تأكيد الاستلام</button>
        `;
        listDiv.appendChild(div);
    });
}

function confirmInv(btn) {
    btn.innerText = "✅ تم";
    btn.parentElement.classList.add('done');
    btn.disabled = true;
}
