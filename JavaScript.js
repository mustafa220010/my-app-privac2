// ==========================================
// 1. المتغيرات العامة
// ==========================================
let currentLang = 'ar';
let isPremium = false; // حالة الاشتراك VIP
let ingredientCount = 0; // عداد المكونات الإضافية

// ==========================================
// 2. وظائف التنقل الأساسية
// ==========================================
function switchScreen(screenId) {
    // إخفاء جميع الشاشات
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // إظهار الشاشة المطلوبة
    const targetScreen = document.getElementById(screenId);
    if(targetScreen) targetScreen.classList.add('active');
}

// محاكاة تسجيل الدخول
function simulateLogin() {
    const loginSec = document.getElementById('loginSection');
    const userSec = document.getElementById('userDataSection');
    if(loginSec) loginSec.style.display = 'none';
    if(userSec) userSec.style.display = 'block';
}

// ==========================================
// 3. نظام الاشتراكات (VIP) وإخفاء الإعلانات
// ==========================================
function activatePremium(isRestore = false) {
    isPremium = true; // تفعيل حالة المشترك
    
    // رسالة التأكيد
    if(isRestore) {
        alert('تمت استعادة المشتريات والاشتراك بنجاح. تم إيقاف الإعلانات.');
    } else {
        alert('تم الاشتراك بنجاح! شكراً لك.');
    }

    // إخفاء بنر الإعلانات وأزرار VIP من كل مكان في التطبيق
    const elementsToHide = ['main-banner-ad', 'header-vip-btn', 'btn-profile-vip'];
    elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    
    // الرجوع للشاشة الرئيسية
    switchScreen('mainScreen');
}

// ==========================================
// 4. الخيارات المتقدمة والمكونات
// ==========================================
function toggleAdvanced() {
    const advancedOptions = document.getElementById('advancedOptions');
    const advancedToggle = document.getElementById('advancedToggle');
    if(advancedOptions && advancedToggle) {
        advancedOptions.style.display = advancedToggle.checked ? 'block' : 'none';
    }
}

function checkNutritionFact() {
    const select = document.getElementById('proteinType');
    const customInput = document.getElementById('proteinCustom');
    const tip = document.getElementById('nutrition-tip');
    
    if(select && customInput) customInput.style.display = select.value === 'custom' ? 'block' : 'none';
    if(select && tip) tip.style.display = select.value === 'lentils' ? 'block' : 'none';
}

// دالة إضافة الخضار/السوائل/أخرى
function addIngredientRow() {
    ingredientCount++;
    const container = document.getElementById('dynamicIngredientsContainer');
    if(!container) return; // حماية من الأخطاء

    // كود HTML للصف الجديد
    const rowHtml = `
        <div class="extra-item-row" id="ingredient_row_${ingredientCount}" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: var(--extra-bg); padding: 10px; border-radius: 10px; margin-bottom: 10px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; width: 100%;">
                <select id="ing_type_${ingredientCount}" style="flex: 1; margin:0;" onchange="updateIngredientUnit(${ingredientCount})">
                    <option value="veg">🥦 خضروات</option>
                    <option value="liquid">🥛 سوائل</option>
                    <option value="other">⚙️ أخرى</option>
                </select>
                <input type="text" placeholder="اسم المكون (مثال: طماطم...)" style="flex: 2; margin:0;">
            </div>
            <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
                <input type="number" placeholder="الكمية" style="flex: 2; margin:0;">
                <select id="ing_unit_${ingredientCount}" style="flex: 1; margin:0; background-color: #edf2f7;" disabled>
                    <option value="g">جرام</option>
                    <option value="ml">مل</option>
                </select>
                <button type="button" onclick="document.getElementById('ingredient_row_${ingredientCount}').remove()" style="background:#e53e3e; color:white; border:none; border-radius:8px; padding:8px 12px; cursor:pointer; margin:0;">❌</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    updateIngredientUnit(ingredientCount); // تفعيل التحديث المباشر للوحدة
}

// دالة تثبيت الوحدات (الجرام للخضار والمل للسوائل)
function updateIngredientUnit(id) {
    const typeSelect = document.getElementById(`ing_type_${id}`);
    const unitSelect = document.getElementById(`ing_unit_${id}`);
    if(!typeSelect || !unitSelect) return;
    
    if (typeSelect.value === 'veg') {
        unitSelect.value = 'g';
        unitSelect.disabled = true;
        unitSelect.style.backgroundColor = '#edf2f7';
    } else if (typeSelect.value === 'liquid') {
        unitSelect.value = 'ml';
        unitSelect.disabled = true;
        unitSelect.style.backgroundColor = '#edf2f7';
    } else {
        unitSelect.disabled = false;
        unitSelect.style.backgroundColor = '#ffffff';
    }
}

// ==========================================
// 5. حساب السعرات والذكاء الاصطناعي
// ==========================================
async function startCalculation() {
    // 1. التحقق من الإعلانات
    if (isPremium) {
        if(document.getElementById('title-ad')) document.getElementById('title-ad').style.display = 'none';
        if(document.getElementById('text-ad-placeholder')) document.getElementById('text-ad-placeholder').innerHTML = 'جاري تحليل الصورة والبيانات...<br>الرجاء الانتظار';
    } else {
        if(document.getElementById('title-ad')) document.getElementById('title-ad').style.display = 'block';
        if(document.getElementById('text-ad-placeholder')) document.getElementById('text-ad-placeholder').innerHTML = 'مساحة إعلانية...<br>النتيجة بعد قليل';
        
        // استدعاء إعلان AdMob البيني هنا إذا توفر
        try { if (typeof showInterstitialAd === "function") showInterstitialAd(); } catch(e) {}
    }
    
    // الانتقال لشاشة الانتظار
    switchScreen('adScreen');

    // 2. محاكاة الرد من الذكاء الاصطناعي
    try {
        await new Promise(resolve => setTimeout(resolve, 3000)); // انتظار 3 ثوانٍ
        
        // النتيجة والنصائح
        if(document.getElementById('finalCalories')) document.getElementById('finalCalories').innerText = 540;
        if(document.getElementById('tipReduce')) document.getElementById('tipReduce').innerText = "استبدل الزيت العادي بمسحة خفيفة من زيت الزيتون، أو استخدم المقلاة الهوائية لتقليل السعرات.";
        if(document.getElementById('tipVeggies')) document.getElementById('tipVeggies').innerText = "الطبق يفتقر للألياف! أضف طبقاً جانبياً من السلطة الخضراء لتسريع الشبع.";
        if(document.getElementById('tipGeneral')) document.getElementById('tipGeneral').innerText = "استبدال الرز الأبيض بالرز البني يعطي طاقة تدوم أطول دون رفع سكر الدم.";
        
        if(document.getElementById('aiTipsContainer')) document.getElementById('aiTipsContainer').style.display = 'block';

        // الانتقال للنتيجة
        switchScreen('resultScreen'); 
    } catch (error) {
        alert('حدث خطأ أثناء التحليل. حاول مرة أخرى.');
        switchScreen('calcScreen');
    }
}

// ==========================================
// 6. نظام المظهر (داكن / فاتح)
// ==========================================
function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('dark-mode');
    else if (theme === 'light') document.body.classList.remove('dark-mode');
    else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }
}
function changeTheme() { 
    const selector = document.getElementById('themeSelector');
    if(selector) applyTheme(selector.value); 
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const selector = document.getElementById('themeSelector');
    if(selector) applyTheme(selector.value);
});
applyTheme('system');

// ==========================================
// 7. سياسة الخصوصية
// ==========================================
function openPrivacyPolicy() {
    window.open('https://mustafa220010.github.io/my-app-privacy/', '_blank');
}
