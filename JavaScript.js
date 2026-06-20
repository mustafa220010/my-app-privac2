// --- المتغيرات العامة ---
let currentLang = 'ar';
let userTheme = 'system';
let extraCount = 0;
let isPremium = false; 

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

// --- نظام الاشتراكات ---
function activatePremium(isRestore = false) {
    isPremium = true;
    
    if(isRestore) {
        alert(currentLang === 'en' ? 'Purchases restored successfully. Ads disabled.' : 'تمت استعادة المشتريات والاشتراك بنجاح. تم إيقاف الإعلانات.');
    } else {
        alert(currentLang === 'en' ? 'Subscription Successful! Thank you.' : 'تم الاشتراك بنجاح! شكراً لك.');
    }

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

function checkCustom(type) {
    const select = document.getElementById(type + 'Type');
    const customInput = document.getElementById(type + 'Custom');
    if(select && customInput) customInput.style.display = select.value === 'custom' ? 'block' : 'none';
}

function addExtraItem() {
    extraCount++;
    const container = document.getElementById('dynamicExtrasContainer');
    if(!container) return; // حماية من الخطأ إذا لم يكن العنصر موجوداً

    const isEn = (currentLang === 'en');
    const placeholderName = isEn ? 'e.g. Tabasco Sauce' : 'مثال: صوص تباسكو';
    const placeholderAmount = isEn ? 'Amount' : 'الكمية';
    
    const itemHtml = `
        <div class="extra-item" id="extraItem_${extraCount}" style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
            <input type="text" id="extraName_${extraCount}" placeholder="${placeholderName}" style="flex: 2; margin:0;">
            <input type="number" id="extraAmount_${extraCount}" placeholder="${placeholderAmount}" style="flex: 1; margin:0;">
            <select id="extraUnit_${extraCount}" style="flex: 1; margin:0;">
                <option value="g">${isEn ? 'g' : 'جرام'}</option>
                <option value="ml">${isEn ? 'ml' : 'مل'}</option>
            </select>
            <button onclick="document.getElementById('extraItem_${extraCount}').remove()" style="background:#e53e3e; color:white; padding:10px; border:none; border-radius:5px; cursor:pointer;">×</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', itemHtml);
}

// --- منطقة الحساب والذكاء الاصطناعي ---
async function startCalculation() {
    const advancedToggle = document.getElementById('advancedToggle');
    const isAdvanced = advancedToggle ? advancedToggle.checked : false;
    
    if (isPremium) {
        if(document.getElementById('title-ad')) document.getElementById('title-ad').style.display = 'none';
        if(document.getElementById('text-ad-placeholder')) document.getElementById('text-ad-placeholder').innerHTML = currentLang === 'en' ? 'Analyzing via AI...<br>Please wait' : 'جاري تحليل الصورة بالذكاء الاصطناعي...<br>الرجاء الانتظار';
        switchScreen('adScreen');
    } else {
        if(document.getElementById('title-ad')) document.getElementById('title-ad').style.display = 'block';
        if(document.getElementById('text-ad-placeholder')) document.getElementById('text-ad-placeholder').innerHTML = currentLang === 'en' ? 'Ad Space...<br>Result shortly' : 'مساحة إعلانية...<br>النتيجة بعد قليل';
        switchScreen('adScreen');
    }

    try {
        // محاكاة تأخير الرد
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const calculatedCalories = 520; 
        const aiTips = currentLang === 'en' ? "Try replacing white rice with brown rice." : "جرب استبدال الرز الأبيض بالرز البني لزيادة الألياف وتقليل امتصاص السكر.";

        // حماية عند عرض النتيجة
        const resultH1 = document.querySelector('#resultScreen h1');
        const tipsContent = document.getElementById('text-tips-content');
        const tipsBox = document.getElementById('aiTipsBox');

        if(resultH1) resultH1.innerText = calculatedCalories;
        if(tipsContent) tipsContent.innerText = aiTips;
        if(tipsBox) tipsBox.style.display = 'block'; // تعديل: إظهار النصائح بدلاً من إخفائها

        switchScreen('resultScreen');

    } catch (error) {
        console.error("خطأ في تحليل الذكاء الاصطناعي:", error);
        alert(currentLang === 'en' ? 'Error analyzing image. Try again.' : 'حدث خطأ أثناء تحليل الصورة. حاول مرة أخرى.');
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

// --- نظام تغيير اللغة المصحح ---
function changeLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    alert(currentLang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English');
    // هنا يجب إضافة كود تغيير النصوص في واجهة المستخدم (HTML) حسب اللغة المحددة
}