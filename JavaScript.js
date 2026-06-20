// --- المتغيرات العامة ---
let currentLang = 'ar';
let userTheme = 'system';
let extraCount = 0;
let isPremium = false; // حالة الاشتراك (VIP)

// --- وظائف التنقل الأساسية ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if(targetScreen) targetScreen.classList.add('active');
}

// --- محاكاة تسجيل الدخول ---
function simulateLogin() {
    const loginSec = document.getElementById('loginSection');
    const userSec = document.getElementById('userDataSection');
    if(loginSec) loginSec.style.display = 'none';
    if(userSec) userSec.style.display = 'block';
}

// --- نظام الاشتراكات (إخفاء الإعلانات) ---
function activatePremium(isRestore = false) {
    isPremium = true;
    
    if(isRestore) {
        alert(currentLang === 'en' ? 'Purchases restored successfully. Ads disabled.' : 'تمت استعادة المشتريات والاشتراك بنجاح. تم إيقاف الإعلانات.');
    } else {
        alert(currentLang === 'en' ? 'Subscription Successful! Thank you.' : 'تم الاشتراك بنجاح! شكراً لك.');
    }

    // إخفاء بنر الإعلان السفلي برمجياً للمشتركين
    const mainBanner = document.getElementById('main-banner-ad');
    if (mainBanner) mainBanner.style.display = 'none';
    
    const headerVip = document.getElementById('header-vip-btn');
    if (headerVip) headerVip.style.display = 'none';
    
    const profileVip = document.getElementById('btn-profile-vip');
    if (profileVip) profileVip.style.display = 'none';
    
    switchScreen('mainScreen');
}

// --- وظائف الخيارات المتقدمة ---
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

function addIngredientRow() {
    extraCount++;
    const container = document.getElementById('dynamicIngredientsContainer');
    if(!container) return;

    const rowHtml = `
        <div class="extra-item-row" id="ingredient_row_${extraCount}" style="display: flex; gap: 8px; margin-top: 10px; background: var(--extra-bg); padding: 10px; border-radius: 10px;">
            <select style="flex: 1;">
                <option value="veg">خضروات</option>
                <option value="liquid">سوائل</option>
                <option value="other">أخرى</option>
            </select>
            <input type="text" placeholder="اسم المكون" style="flex: 2; margin:0;">
            <input type="number" placeholder="الكمية" style="flex: 1; margin:0;">
            <button type="button" onclick="document.getElementById('ingredient_row_${extraCount}').remove()" style="background:#e53e3e; color:white; padding:8px; border:none; border-radius:8px; cursor:pointer;">❌</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
}

// =====================================================================
// 🚀 منطقة الحساب ودمج إعلانات AdMob
// =====================================================================

async function startCalculation() {
    // التحقق من حالة الاشتراك لتحديد عرض الإعلان أو تجاوزه
    if (isPremium) {
        // العميل VIP: لا إعلانات، نظهر شاشة المعالجة فقط
        if(document.getElementById('title-ad')) document.getElementById('title-ad').style.display = 'none';
        if(document.getElementById('text-ad-placeholder')) document.getElementById('text-ad-placeholder').innerHTML = 'جاري تحليل الصورة بالذكاء الاصطناعي...<br>الرجاء الانتظار';
        switchScreen('adScreen');
    } else {
        // العميل العادي: نظهر شاشة الانتظار ونستدعي الإعلان البيني
        if(document.getElementById('title-ad')) document.getElementById('title-ad').style.display = 'block';
        if(document.getElementById('text-ad-placeholder')) document.getElementById('text-ad-placeholder').innerHTML = 'مساحة إعلانية...<br>النتيجة بعد قليل';
        switchScreen('adScreen');
        
        // 🚨 كود تشغيل إعلان AdMob (عبر Webintoapp) 🚨
        // إذا كان موقع Webintoapp يوفر كود JS لتشغيل الإعلان، ضعه هنا. 
        // مثال شائع:
        try {
            if (typeof showInterstitialAd === "function") {
                showInterstitialAd(); 
            }
        } catch(e) {
            console.log("لم يتم تشغيل الإعلان لأن التطبيق مفتوح في متصفح الكمبيوتر وليس الهاتف.");
        }
    }

    try {
        // محاكاة تأخير الرد من الذكاء الاصطناعي (3 ثوانٍ)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // النتيجة الوهمية (تستبدل لاحقاً ببيانات الـ API)
        const calculatedCalories = 540; 
        const reduceTip = "استبدل الزيت العادي بمسحة خفيفة من زيت الزيتون لتقليل السعرات.";
        const veggiesTip = "أضف طبقاً جانبياً من السلطة الخضراء لتسريع الشبع.";
        const generalTip = "استبدال الرز الأبيض بالبني يعطي طاقة تدوم أطول.";

        // وضع البيانات في الشاشة
        if(document.getElementById('finalCalories')) document.getElementById('finalCalories').innerText = calculatedCalories;
        if(document.getElementById('tipReduce')) document.getElementById('tipReduce').innerText = reduceTip;
        if(document.getElementById('tipVeggies')) document.getElementById('tipVeggies').innerText = veggiesTip;
        if(document.getElementById('tipGeneral')) document.getElementById('tipGeneral').innerText = generalTip;
        if(document.getElementById('aiTipsContainer')) document.getElementById('aiTipsContainer').style.display = 'block';

        // الانتقال لشاشة النتيجة
        switchScreen('resultScreen');

    } catch (error) {
        alert('حدث خطأ أثناء التحليل. حاول مرة أخرى.');
        switchScreen('calcScreen'); 
    }
}

// --- نظام المظهر ---
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

// --- سياسة الخصوصية ---
function openPrivacyPolicy() {
    const privacyUrl = 'https://mustafa220010.github.io/my-app-privacy/'; 
    window.open(privacyUrl, '_blank');
}
