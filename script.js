<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام بيور | إدارة كشوفات الشرقاط</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <script src="https://cdn.tailwindscc.com"></script>
</head>
<body class="p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
        <div class="bg-slate-900 text-white p-8 rounded-3xl shadow-xl mb-10 no-print flex justify-between items-center">
            <h1 class="text-2xl font-black italic text-indigo-400 uppercase">PurePharma</h1>
            <div class="flex flex-col items-end">
                <input type="file" id="pdfFile" class="hidden" accept=".pdf">
                <button onclick="document.getElementById('pdfFile').click()" class="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition">رفع ملف الكشف</button>
                <div id="loader" class="hidden mt-2 text-xs animate-pulse text-indigo-400">جاري المعالجة...</div>
            </div>
        </div>
        <div id="clientsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print"></div>
        <div id="detailsModal" class="fixed inset-0 bg-black/70 hidden flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div class="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div class="p-6 border-b flex justify-between items-center bg-slate-50">
                    <button onclick="closeModal()" class="text-slate-400 hover:text-red-500 font-bold">إغلاق [X]</button>
                    <div class="flex gap-2">
                        <button onclick="window.print()" class="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">طباعة</button>
                        <button id="waBtn" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">واتساب</button>
                    </div>
                </div>
                <div id="modalContent" class="p-8 overflow-y-auto"></div>
            </div>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
