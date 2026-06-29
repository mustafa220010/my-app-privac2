// دالة إرسال البيانات من موقعك إلى السيرفر
async function sendMealToServer(imageFile, cookingMethod, proteinType, ingredients) {
    
    // 1. هنا يوضع رابط السيرفر الحي على Render مضافاً إليه /analyze
    const SERVER_URL = "https://my-app-privac2-1.onrender.com/analyze";

    // تجهيز البيانات لإرسالها كـ FormData (لأنها تحتوي على ملف صورة)
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("cooking_method", cookingMethod);
    formData.append("proteinType", proteinType);
    formData.append("ingredients", JSON.stringify(ingredients));

    try {
        console.log("جاري إرسال البيانات للسيرفر...");
        
        const response = await fetch(SERVER_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        // 2. إذا رجع السيرفر خطأ (سواءً خطأ صورة غير واضحة، أو خطأ سيرفر داخلي)
        if (!response.ok) {
            // عرض رسالة الخطأ المخصصة القادمة من السيرفر في الواجهة
            alert(`تنبيه: ${data.error}`);
            return;
        }

        // 3. إذا نجحت العملية، يتم عرض البيانات للمستخدم
        console.log("تمت العملية بنجاح! السعرات:", data.calories);
        document.getElementById("mealName").innerText = data.mealName;
        document.getElementById("calories").innerText = data.calories + " سعرة حرارية";
        document.getElementById("tipReduce").innerText = data.tipReduce;
        document.getElementById("tipVeggies").innerText = data.tipVeggies;

    } catch (error) {
        // في حال فشل الاتصال بالشبكة تماماً أو السيرفر متوقف ومغلق
        console.error("خطأ في الاتصال بالشبكة:", error);
        alert("فشل الاتصال بالسيرفر، تأكد من أن السيرفر يعمل على منصة Render.");
    }
}
