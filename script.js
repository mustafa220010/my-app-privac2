// ==========================================
// 1. قسم تحليل الوجبة بالذكاء الاصطناعي
// ==========================================
async function analyzeMeal() {
    const imageInput = document.getElementById('imageInput').files[0];
    const cookingMethod = document.getElementById('cookingMethod').value;
    const proteinType = document.getElementById('proteinType').value;
    const ingredients = document.getElementById('ingredients').value;

    if (!imageInput) {
        alert("الرجاء إرفاق صورة للوجبة أولاً.");
        return;
    }

    const SERVER_URL = "https://my-app-privac2-1.onrender.com/analyze";
    
    const formData = new FormData();
    formData.append("image", imageInput);
    formData.append("cooking_method", cookingMethod);
    formData.append("proteinType", proteinType);
    formData.append("ingredients", ingredients);

    try {
        // إظهار حالة التحميل للمستخدم (يمكنك تطويرها لاحقاً)
        document.getElementById('mealName').innerText = "جاري التحليل...";
        document.getElementById('mealResult').style.display = 'block';

        const response = await fetch(SERVER_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("نوع الخطأ:", data.error_type);
            alert(`تنبيه: ${data.error}`);
            document.getElementById('mealResult').style.display = 'none';
            return;
        }

        // عرض النتائج الناجحة
        document.getElementById('mealName').innerText = data.mealName;
        document.getElementById('calories').innerText = data.calories + " سعرة حرارية";
        document.getElementById('tipReduce').innerText = data.tipReduce;
        document.getElementById('tipVeggies').innerText = data.tipVeggies;

    } catch (error) {
        console.error("خطأ في الاتصال:", error);
        alert("فشل الاتصال بالسيرفر. تأكد من اتصالك بالإنترنت وأن السيرفر يعمل.");
        document.getElementById('mealResult').style.display = 'none';
    }
}

// ==========================================
// 2. قسم حاسبة الاحتياج اليومي (تعمل محلياً)
// ==========================================
function calculateMacros() {
    const goal = document.getElementById('goal-select').value;
    const type = document.getElementById('calc-type-select').value;
    const weight = parseFloat(document.getElementById('calc-weight').value);
    const height = parseFloat(document.getElementById('calc-height').value);
    const age = parseFloat(document.getElementById('calc-age').value);
    const gender = document.getElementById('calc-gender').value;

    if (!weight || !height || !age) {
        alert("الرجاء تعبئة الوزن، الطول، والعمر لحساب النتيجة بدقة.");
        return;
    }

    // حساب معدل الأيض الأساسي (BMR)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    // افتراض نشاط رياضي متوسط
    let maintenanceCalories = bmr * 1.55;
    
    // الهدف (تنشيف أو تضخيم)
    let targetCalories = goal === 'cut' ? maintenanceCalories - 500 : maintenanceCalories + 500;

    let resultText = "";

    if (type === 'calories') {
        const goalText = goal === 'cut' ? 'للتنشيف وخسارة الدهون' : 'للتضخيم وبناء العضلات';
        resultText = `احتياجك اليومي هو: ${Math.round(targetCalories)} سعرة حرارية (${goalText}).`;
    } else if (type === 'protein') {
        let proteinGrams = goal === 'cut' ? weight * 2.2 : weight * 1.8;
        resultText = `احتياجك من البروتين هو: ${Math.round(proteinGrams)} جرام يومياً.`;
    } else if (type === 'carbs') {
        let fatCalories = (weight * 0.8) * 9; 
        let proteinCalories = (goal === 'cut' ? weight * 2.2 : weight * 1.8) * 4;
        let carbCalories = targetCalories - fatCalories - proteinCalories;
        let carbGrams = Math.max(0, carbCalories / 4); 
        
        resultText = `احتياجك من الكربوهيدرات هو: ${Math.round(carbGrams)} جرام يومياً.`;
    }

    document.getElementById('calc-result').innerText = resultText;
}