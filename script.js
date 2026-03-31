// محرك الرفع المطور لـ Pure Pharma
document.getElementById('pdfUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
        alert("لم يتم اختيار ملف!");
        return;
    }

    console.log("جاري معالجة الملف:", file.name);
    document.getElementById('loader').classList.remove('hidden');

    try {
        const buffer = await file.arrayBuffer();
        // تحميل مكتبة PDF.js من الرابط المباشر لضمان عدم التعليق
        const pdf = await pdfjsLib.getDocument({data: buffer}).promise;
        
        if (pdf.numPages === 0) {
            alert("ملف PDF فارغ أو غير مدعوم");
        } else {
            // تنفيذ التحليل (نفس الكود السابق)
            masterDB = {}; 
            // ... بقية عمليات المعالجة
            alert("تم رفع وتحليل " + pdf.numPages + " صفحات بنجاح!");
        }
        renderDashboard();
    } catch (error) {
        console.error("خطأ في الرفع:", error);
        alert("فشل الرفع: تأكد من أن الملف ليس محمياً بكلمة سر.");
    } finally {
        document.getElementById('loader').classList.add('hidden');
    }
});
