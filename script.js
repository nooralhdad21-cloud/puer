pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

function login() {
    const name = document.getElementById('nameInput').value;
    if (name.length < 3) return alert("يرجى إدخال اسمك");
    document.getElementById('userBadge').innerText = "المندوب: " + name;
    document.getElementById('userBadge').classList.remove('hidden');
    document.getElementById('loginStep').classList.add('hidden');
    document.getElementById('uploadStep').classList.remove('hidden');
}

document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let allText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            allText += content.items.map(s => s.str).join(' ');
        }
        process(allText);
    };
    reader.readAsArrayBuffer(file);
});

function process(text) {
    const container = document.getElementById('results');
    container.innerHTML = '<h3 class="font-bold mb-4">الفواتير المستخرجة:</h3>';
    
    // البحث عن رقم الفاتورة والاسم والسعر في كشف بيور
    const regex = /(\d{5,6})/g; 
    const matches = text.match(regex) || [];
    
    [...new Set(matches)].forEach(id => {
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-3xl shadow-sm border-r-8 border-blue-600 flex justify-between items-center mb-4";
        card.innerHTML = `
            <div>
                <p class="text-[10px] text-blue-500 font-bold tracking-tighter">رقم الفاتورة #${id}</p>
                <h4 class="font-bold text-gray-800 text-sm">مذخر / صيدلية من الكشف</h4>
                <p class="text-blue-700 font-bold text-xs mt-1 italic">بإنتظار المطابقة</p>
            </div>
            <button onclick="this.innerText='✅ تم'; this.className='bg-green-100 text-green-700 px-6 py-2 rounded-xl text-xs font-bold'; this.parentElement.style.opacity='0.5';" class="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold">تأكيد</button>
        `;
        container.appendChild(card);
    });
    
    document.getElementById('uploadStep').classList.add('hidden');
    document.getElementById('listStep').classList.remove('hidden');
}
