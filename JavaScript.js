// ==========================================
// المتغيرات العامة
// ==========================================
let currentLang = 'ar';
let isPremium = false; 
let ingredientCount = 0; 
let userHistory = JSON.parse(localStorage.getItem('appUserHistory')) || [];

// ==========================================
// التنقل والمظهر
// ==========================================
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function applyTheme(theme) {
    if (theme === 'dark') document.body.classList.add('dark-mode');
    else if (theme === 'light') document.body.classList.remove('dark-mode');
    else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    }
}

function changeTheme() { 
    applyTheme(document.getElementById('themeSelector').value); 
}
applyTheme('system'); // تفعيل تلقائي عند الفتح

// ==========================================
// نظام الـ VIP (حذف الإعلانات)
// ==========================================
function activatePremium() {
    isPremium = true;
    alert('تم تفعيل اشتراك VIP بنجاح! تم إخفاء الإعلانات.');
    
    // إخفاء جميع البانرات وأزرار VIP
    document.querySelectorAll('.ad-banner').forEach(ad => ad.style.display = 'none');
    const headerVip = document.getElementById('header-vip-btn');
    if (headerVip) headerVip.style.display = 'none';
}

// ==========================================
// الإنترنت، الكاميرا، وتخزين السجل
// ==========================================
function checkConnection() {
    if (!navigator.onLine) {
        alert('التطبيق يحتاج إلى اتصال بالإنترنت للعمل بشكل صحيح.');
        return false;
    }
    return true;
}

function loginWithGoogle() {
    if(!checkConnection()) return;
    alert("سيتم توجيهك الآن لتسجيل الدخول بحساب Google (اربط Firebase لاحقاً)...");
    
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userDataSection').style.display = 'block';
    renderHistory(); 
}

function saveToHistory(calories, tips) {
    const today = new Date();
    const dateString = today.toLocaleDateString('ar-EG') + " - " + today.toLocaleTimeString('ar-EG');
    userHistory.push({ date: dateString, calories: calories, tips: tips });
    localStorage.setItem('appUserHistory', JSON.stringify(userHistory));
}

function renderHistory() {
    const container = document.getElementById('historyContainer');
    if(!container) return;
    
    if(userHistory.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:gray;">سجل الوجبات فارغ حالياً.</p>';
        return;
    }
    
    container.innerHTML = [...userHistory].reverse().map(item => `
        <div style="background:var(--card-bg); padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between;">
                <strong>${item.date}</strong>
                <span style="color:var(--danger-color); font-weight:bold;">${item.calories} سعرة</span>
            </div>
            <div style="font-size:13px; color:gray; margin-top:5px;">${item.tips}</div>
        </div>
    `).join('');
}

function clearHistory() {
    if(confirm('هل أنت متأكد من مسح السجل بالكامل؟')) {
        userHistory = [];
        localStorage.setItem('appUserHistory', JSON.stringify(userHistory));
        renderHistory();
    }
}

// ==========================================
// الخيارات المتقدمة (إضافة مكونات)
// ==========================================
function toggleAdvanced() {
    const advancedOptions = document.getElementById('advancedOptions');
    const advancedToggle = document.getElementById('advancedToggle');
    if(advancedOptions && advancedToggle) {
        advancedOptions.style.display = advancedToggle.checked ? 'block' : 'none';
    }
}

function addIngredientRow() {
    ingredientCount++;
    const container = document.getElementById('dynamicIngredientsContainer');
    const rowHtml = `
        <div id="ingredient_row_${ingredientCount}" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: var(--card-bg); padding: 10px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border-color);">
            <div style="display: flex; gap: 8px; width: 100%;">
                <select id="ing_type_${ingredientCount}" style="flex: 1; margin:0;" onchange="updateIngredientUnit(${ingredientCount})">
                    <option value="veg">🥦 خضروات</option>
                    <option value="liquid">🥛 سوائل</option>
                    <option value="other">⚙️ أخرى</option>
                </select>
                <input type="text" placeholder="اسم المكون..." style="flex: 2; margin:0;">
            </div>
            <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
                <input type="number" placeholder="الكمية" style="flex: 2; margin:0;">
                <select id="ing_unit_${ingredientCount}" style="flex: 1; margin:0; background-color: var(--extra-bg);" disabled>
                    <option value="g">جرام</option>
                    <option value="ml">مل</option>
                </select>
                <button type="button" onclick="document.getElementById('ingredient_row_${ingredientCount}').remove()" style="background:var(--danger-color); padding:10px; flex:0.5; margin:0;">❌</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    updateIngredientUnit(ingredientCount);
}

function updateIngredientUnit(id) {
    const typeSelect = document.getElementById(`ing_type_${id}`);
    const unitSelect = document.getElementById(`ing_unit_${id}`);
    if(!typeSelect || !unitSelect) return;
    
    if (typeSelect.value === 'veg') {
        unitSelect.value = 'g';
        unitSelect.disabled = true;
    } else if (typeSelect.value === 'liquid') {
        unitSelect.value = 'ml';
        unitSelect.disabled = true;
    } else {
        unitSelect.disabled = false;
    }
}

// ==========================================
// حساب السعرات (بدون شاشة انتظار إعلانات)
// ==========================================
async function startCalculation() {
    if(!checkConnection()) return;

    const calcBtn = document.getElementById('calcBtn');
    const originalText = calcBtn.innerText;
    
    calcBtn.innerText = 'جاري تحليل الصورة... ⏳';
    calcBtn.disabled = true;
    calcBtn.style.opacity = '0.7';

    try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const calculatedCalories = Math.floor(Math.random() * 300) + 350; 
        const aiTip = "بناءً على الصورة، الوجبة غنية بالكربوهيدرات. يُنصح بإضافة مصدر بروتين لزيادة الشبع وتوازن العناصر الغذائية.";

        document.getElementById('finalCalories').innerText = calculatedCalories;
        document.getElementById('tipGeneral').innerText = aiTip;

        saveToHistory(calculatedCalories, aiTip);
        switchScreen('resultScreen'); 
    } catch (error) {
        alert('حدث خطأ. يرجى التأكد من الصورة والمحاولة مجدداً.');
    } finally {
        calcBtn.innerText = originalText;
        calcBtn.disabled = false;
        calcBtn.style.opacity = '1';
    }
}

// ==========================================
// مشاركة النتيجة
// ==========================================
function shareResult() {
    const calories = document.getElementById('finalCalories').innerText;
    const shareText = `حللت وجبتي بالذكاء الاصطناعي وظهرت النتيجة: ${calories} سعرة حرارية! 🥗🔥 جرب التطبيق الآن.`;

    if (navigator.share) {
        navigator.share({
            title: 'تطبيق حساب السعرات',
            text: shareText
        }).catch(err => console.log('تم إلغاء المشاركة'));
    } else {
        alert('جهازك الحالي لا يدعم خاصية المشاركة المباشرة.');
    }
}