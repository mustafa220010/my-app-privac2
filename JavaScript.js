// ... كود دالة fetch لإرسال البيانات ...

const response = await fetch(SERVER_URL, {
    method: "POST",
    body: formData
});

const data = await response.json();

if (!response.ok) {
    // السيرفر الآن يرسل لك error_type يوضح المشكلة تماماً
    console.error("نوع الخطأ المكتشف:", data.error_type);
    
    // إظهار رسالة مخصصة للمستخدم بناءً على سبب الخطأ
    if (data.error_type === "ai_unclear_image") {
        alert(`❌ مشكلة في الصورة: ${data.error}`);
    } else if (data.error_type === "image_invalid" || data.error_type === "image_missing") {
        alert(`⚠️ تنبيه المدخلات: ${data.error}`);
    } else {
        // أخطاء السيرفر أو منصة Groq
        alert(`🖥️ مشكلة في النظام/السيرفر: ${data.error}`);
    }
    return;
}

// ... تكملة كود عرض البيانات الناجحة (mealName, calories, إلخ) ...
