let currentEmployee = "";
let invoiceData = []; // قاعدة البيانات المؤقتة
let matchedInvoices = []; // الفواتير التي تمت مطابقتها

// 1. حفظ هوية الموظف
function saveEmployee() {
    const name = document.getElementById('employeeName').value;
    if (name.length < 3) return alert("يرجى إدخال اسمك الثلاثي بشكل صحيح");
    
    currentEmployee = name;
    document.getElementById('userBadge').innerText = "المسؤول: " + name;
    document.getElementById('userBadge').classList.remove('hidden');
    document.getElementById('loginStep').classList.add('hidden');
    document.getElementById('uploadStep').classList.remove('hidden');
}

// 2. معالجة ملف Excel
document.getElementById('excelFile').addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // تحويل البيانات لـ JSON
        invoiceData = XLSX.utils.sheet_to_json(worksheet);
        displayVendors();
        document.getElementById('uploadStep').classList.add('hidden');
        document.getElementById('matchStep').classList.remove('hidden');
    };
    reader.readAsArrayBuffer(e.target.files[0]);
});

// 3. عرض المذاخر المستخرجة من الملف
function displayVendors() {
    const list = document.getElementById('vendorList');
    list.innerHTML = "";
    
    // استخراج أسماء المذاخر الفريدة (نفترض اسم العمود 'المذخر' أو 'العميل')
    const vendors = [...new Set(invoiceData.map(item => item['اسم المذخر'] || item['العميل'] || "مذخر مجهول"))];
    
    vendors.forEach(vendor => {
        const count = invoiceData.filter(i => (i['اسم المذخر'] || i['العميل']) === vendor).length;
        const div = document.createElement('div');
        div.className = "vendor-card bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer";
        div.innerHTML = `
            <div>
                <h3 class="font-bold text-slate-800">${vendor}</h3>
                <p class="text-xs text-slate-500">${count} فواتير في الكشف</p>
            </div>
            <span class="bg-blue-50 text-blue-600 p-2 rounded-lg text-sm font-bold">بدء المطابقة</span>
        `;
        div.onclick = () => startMatching(vendor);
        list.appendChild(div);
    });
}

// 4. وضع المطابقة المباشر
function startMatching(vendorName) {
    const vInvoices = invoiceData.filter(i => (i['اسم المذخر'] || i['العميل']) === vendorName);
    const list = document.getElementById('vendorList');
    list.innerHTML = `<button onclick="displayVendors()" class="text-blue-600 text-sm mb-2 font-bold underline">← العودة للقائمة</button>
                      <h2 class="text-lg font-bold mb-4">مطابقة فواتير: ${vendorName}</h2>`;
    
    vInvoices.forEach(inv => {
        const invId = inv['رقم الفاتورة'] || "000";
        const div = document.createElement('div');
        div.className = "bg-white p-4 rounded-xl border-2 border-slate-100 mb-3 shadow-sm";
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="text-xs text-slate-400">رقم الفاتورة</span>
                    <p class="font-bold text-lg">#${invId}</p>
                </div>
                <div class="text-left">
                    <span class="text-xs text-slate-400">المبلغ</span>
                    <p class="font-bold text-blue-700">${inv['المبلغ'] || '0'} د.ع</p>
                </div>
            </div>
            <textarea placeholder="أضف ملاحظات (نقص، تضرر، إلخ)..." id="note-${invId}" class="w-full text-sm p-2 bg-slate-50 border rounded-lg mb-2 outline-none"></textarea>
            <button onclick="confirmInvoice('${invId}', '${vendorName}', this)" class="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold transition-all">تأكيد وصول الفاتورة</button>
        `;
        list.appendChild(div);
    });
}

// 5. تأكيد فاتورة محددة
function confirmInvoice(id, vendor, btn) {
    const note = document.getElementById(`note-${id}`).value;
    matchedInvoices.push({
        'رقم الفاتورة': id,
        'المذخر': vendor,
        'ملاحظات': note,
        'تاريخ المطابقة': new Date().toLocaleString('ar-IQ'),
        'المسؤول': currentEmployee
    });
    
    const card = btn.parentElement;
    card.classList.add('matched-anim', 'bg-green-50', 'border-green-200');
    btn.className = "w-full bg-green-600 text-white py-2 rounded-lg text-sm font-bold";
    btn.innerText = "✓ تم المطابقة";
    btn.disabled = true;
    
    document.getElementById('reportActions').classList.remove('hidden');
}

// 6. سحب التقارير (Excel & PDF)
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(matchedInvoices);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "مطابقة بيور");
    XLSX.writeFile(wb, `تقرير_بيور_${currentEmployee}.xlsx`);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt');
    doc.addFont('Arial', 'normal'); 
    
    doc.text(`تقرير مطابقة مكتب بيور العلمي`, 40, 40);
    doc.text(`اسم الموظف المسؤول: ${currentEmployee}`, 40, 60);
    
    const headers = [['رقم الفاتورة', 'المذخر', 'ملاحظات', 'تاريخ الاستلام']];
    const data = matchedInvoices.map(i => [i['رقم الفاتورة'], i['المذخر'], i['ملاحظات'], i['تاريخ المطابقة']]);
    
    doc.autoTable({
        head: headers,
        body: data,
        startY: 80,
        styles: { font: 'Arial', halign: 'right' },
        headStyles: { fillColor: [30, 58, 138] }
    });
    
    doc.save(`تقرير_بيور_${currentEmployee}.pdf`);
}
// المتغيرات العالمية
let currentEmployee = "";
let invoiceData = []; 
let matchedInvoices = []; 

// دالة حفظ الموظف والدخول
function saveEmployee() {
    const nameInput = document.getElementById('employeeName');
    const name = nameInput.value.trim();

    if (name.length < 3) {
        alert("يرجى إدخال اسمك الثلاثي بشكل صحيح لبدء العمل.");
        return;
    }

    // حفظ الاسم وتحديث الواجهة
    currentEmployee = name;
    
    // إخفاء مرحلة تسجيل الدخول وإظهار مرحلة رفع الملفات
    document.getElementById('loginStep').classList.add('hidden');
    document.getElementById('uploadStep').classList.remove('hidden');
    
    // إظهار اسم الموظف في الأعلى (اختياري)
    const badge = document.getElementById('userBadge');
    if(badge) {
        badge.innerText = "المسؤول: " + name;
        badge.classList.remove('hidden');
    }

    console.log("تم تسجيل دخول الموظف: " + name);
}

// دالة معالجة رفع ملف الإكسل
// سنضعها هنا لضمان عدم حدوث خطأ عند رفع الملف لاحقاً
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excelFile');
    if(fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        
        invoiceData = XLSX.utils.sheet_to_json(worksheet);
        alert("تم تحميل " + invoiceData.length + " فاتورة بنجاح.");
        
        // إظهار مرحلة المطابقة
        document.getElementById('uploadStep').classList.add('hidden');
        document.getElementById('matchStep').classList.remove('hidden');
        displayVendors();
    };
    reader.readAsArrayBuffer(file);
}
