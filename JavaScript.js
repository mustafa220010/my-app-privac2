<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>حاسب السعرات الذكي</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
        /* ========================================== */
        /* المتغيرات الأساسية للألوان والمظهر */
        /* ========================================== */
        :root {
            --bg-color: #f0f4f8; 
            --primary-color: #3182ce; 
            --screen-bg: #ffffff;
            --text-color: #2d3748;
            --btn-text: #ffffff;
            --border-color: #e2e8f0;
            --advanced-bg: #f7fafc;
            --extra-bg: #edf2f7;
            --section-title: #4a5568;
            --card-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }

        /* الوضع الداكن */
        body.dark-mode {
            --bg-color: #1a202c !important;
            --screen-bg: #2d3748;
            --text-color: #f7fafc;
            --border-color: #4a5568;
            --advanced-bg: #222a38;
            --extra-bg: #1a202c;
            --section-title: #e2e8f0;
            --card-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }

        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--bg-color); color: var(--text-color); margin: 0; padding: 0; transition: background-color 0.3s, color 0.3s; }
        
        /* الترويسة */
        .app-header { background: var(--primary-color); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background 0.3s; }
        .app-header h3 { margin: 0; font-size: 18px; font-weight: bold; flex-grow: 1; text-align: center; }
        .profile-icon { font-size: 24px; cursor: pointer; background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 50%; }
        .btn-vip-header { background: linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%); color: #744210; border: none; padding: 8px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; margin: 0; width: auto; }

        /* الحاويات والشاشات */
        .app-container { padding: 20px; padding-bottom: 90px; } /* مسافة سفلية لعدم تداخل الإعلانات */
        .screen { background: var(--screen-bg); max-width: 450px; margin: 0 auto; padding: 25px; border-radius: 20px; box-shadow: var(--card-shadow); display: none; transition: 0.3s; position: relative; }
        .active { display: block; animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* الأزرار */
        button { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 12px; font-size: 16px; cursor: pointer; color: var(--btn-text); font-weight: bold; transition: transform 0.2s, background 0.3s; }
        button:active { transform: scale(0.98); }
        button:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .btn-primary { background-color: var(--primary-color); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .btn-back { background-color: #a0aec0; color: #fff; }
        .btn-calc { background-color: var(--primary-color); }
        .btn-upload { background-color: #4a5568; color: white; }

        /* شاشة انقطاع الإنترنت الإجبارية */
        #offlineOverlay {
            display: none; 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(26, 32, 44, 0.95); z-index: 9999;
            flex-direction: column; align-items: center; justify-content: center;
            color: white; text-align: center; padding: 20px; backdrop-filter: blur(5px);
        }
        #offlineOverlay h1 { color: #e53e3e; font-size: 50px; margin-bottom: 10px; }
        #offlineOverlay p { font-size: 18px; line-height: 1.6; max-width: 300px; }

        /* بنر إعلاني ثابت ومستطيل في الأسفل لا يقطع الحساب */
        .fixed-bottom-ad { position: fixed; bottom: 0; left: 0; width: 100%; background-color: var(--extra-bg); border-top: 2px solid var(--border-color); color: var(--section-title); text-align: center; padding: 12px; font-size: 13px; font-weight: bold; z-index: 999; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }

        /* مربع الصورة */
        .image-placeholder { position: relative; width: 100%; height: 180px; background-color: var(--extra-bg); border: 2px dashed var(--border-color); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; font-size: 45px; overflow: hidden; }
        .upload-progress { display: none; position: absolute; background: rgba(0,0,0,0.7); color: #48bb78; padding: 10px 20px; border-radius: 10px; font-size: 20px; font-weight: bold; z-index: 2; }
        #previewImage { display: none; width: 100%; height: 100%; object-fit: cover; z-index: 1; }

        .advanced-box, .history-card { background: var(--advanced-bg); border: 1px solid var(--border-color); padding: 18px; border-radius: 15px; margin-top: 15px; }
        .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: var(--section-title); border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
        input, select { width: 100%; padding: 12px; margin: 8px 0 15px 0; border: 1px solid var(--border-color); border-radius: 10px; box-sizing: border-box; background-color: var(--screen-bg); color: var(--text-color); font-size: 15px; outline: none; }
        input:focus, select:focus { border-color: var(--primary-color); }
        
        .checkbox-container { display: flex; align-items: center; justify-content: center; margin: 15px 0; font-weight: bold; color: var(--primary-color); background: var(--extra-bg); padding: 10px; border-radius: 10px; cursor: pointer; }
        .checkbox-container input { width: 20px; height: 20px; margin-left: 10px; margin-right: 10px; cursor: pointer; }
        
        /* المكونات الإضافية والسجل */
        .extra-item-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background-color: var(--screen-bg); padding: 10px; border-radius: 10px; margin-bottom: 10px; border: 1px solid var(--border-color); }
        .extra-item-row select, .extra-item-row input { margin: 0; padding: 8px; font-size: 14px; }
        .extra-item-row .row-top { display: flex; gap: 8px; width: 100%; }
        .extra-item-row .row-bottom { display: flex; gap: 8px; width: 100%; align-items: center; }
        .btn-remove { background-color: #e53e3e; color: white; border: none; border-radius: 8px; padding: 8px 12px; font-weight: bold; margin: 0; width: auto; }
        
        .history-item { border-bottom: 1px solid var(--border-color); padding: 10px 0; display: flex; justify-content: space-between; align-items: center; }
        .history-item:last-child { border-bottom: none; }
        
        /* تنسيق نصائح الذكاء الاصطناعي والأخطاء */
        .tip-card { padding: 12px; border-radius: 10px; margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
        .reduce-calories { background-color: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
        .increase-veggies { background-color: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
        .error-card { background-color: #fffaf0; color: #dd6b20; border: 1px solid #fbd38d; padding: 12px; border-radius: 10px; margin-top: 15px; font-weight: bold; font-size: 14px; text-align: center; }
        
        body.dark-mode .reduce-calories { background-color: #4a1313; color: #feb2b2; border-color: #742a2a; }
        body.dark-mode .increase-veggies { background-color: #1c4532; color: #9ae6b4; border-color: #276749; }
        body.dark-mode .error-card { background-color: #44331a; color: #fbd38d; border-color: #9c6d1e; }
    </style>
</head>
<body>

    <div id="offlineOverlay">
        <h1>📶❌</h1>
        <h2 data-i18n="offlineTitle">لا يوجد اتصال بالإنترنت</h2>
        <p data-i18n="offlineDesc">التطبيق يعتمد على الذكاء الاصطناعي والسيرفرات السحابية. يرجى الاتصال بالإنترنت للاستمرار في استخدام التطبيق.</p>
    </div>

    <div class="app-header">
        <div class="profile-icon" onclick="switchScreen('profileScreen')">👤</div>
        <h3 id="appTitle" data-i18n="appTitle">حاسب السعرات</h3>
        <button id="header-vip-btn" class="btn-vip-header" style="display:none;">👑 VIP</button>
    </div>

    <div class="app-container">
        <div id="mainScreen" class="screen active">
            <button class="btn-primary" onclick="switchScreen('calcScreen')" data-i18n="menu1">📸 1. تصوير لحساب السعرات</button>
            <button class="btn-primary" onclick="switchScreen('historyScreen')" data-i18n="menu2">📋 2. سجل الوجبات</button>
            <button class="btn-primary" onclick="switchScreen('settingsScreen')" data-i18n="menu3">⚙️ 3. الإعدادات والمظهر</button>
            <button class="btn-primary" onclick="switchScreen('infoScreen')" data-i18n="menu4">📖 4. طريقة الاستخدام</button>
        </div>

        <div id="settingsScreen" class="screen">
            <h2 style="text-align: center;" data-i18n="settingsTitle">الإعدادات والمظهر</h2>
            <div class="advanced-box">
                <label class="section-title" style="border:none; margin:0;" data-i18n="langLabel">اللغة (Language):</label>
                <select id="languageSelector" onchange="changeLanguage()">
                    <option value="ar">العربية (Arabic)</option>
                    <option value="en">English (الإنجليزية)</option>
                </select>
            </div>
            <div class="advanced-box">
                <label class="section-title" style="border:none; margin:0;" data-i18n="themeLabel">نمط العرض (فاتح/داكن):</label>
                <select id="themeSelector" onchange="changeTheme()">
                    <option value="system" data-i18n="themeSys">النظام التلقائي ⚙️</option>
                    <option value="light" data-i18n="themeLight">الوضع الفاتح ☀️</option>
                    <option value="dark" data-i18n="themeDark">الوضع الداكن 🌙</option>
                </select>
            </div>
            <div class="advanced-box">
                <label class="section-title" style="border:none; margin:0;" data-i18n="colorLabel">اللون الأساسي (الأزرار والحدود):</label>
                <select id="primaryColorSelector" onchange="changeColors()">
                    <option value="#3182ce" data-i18n="colorBlue">أزرق محيطي (الافتراضي)</option>
                    <option value="#48bb78" data-i18n="colorGreen">أخضر صحي</option>
                    <option value="#e53e3e" data-i18n="colorRed">أحمر نشط</option>
                    <option value="#805ad5" data-i18n="colorPurple">بنفسجي هادئ</option>
                    <option value="#ed8936" data-i18n="colorOrange">برتقالي حيوي</option>
                    <option value="#4a5568" data-i18n="colorGray">رمادي داكن</option>
                </select>
            </div>
            <div class="advanced-box">
                <label class="section-title" style="border:none; margin:0;" data-i18n="bgLabel">لون خلفية التطبيق:</label>
                <select id="bgColorSelector" onchange="changeColors()">
                    <option value="#f0f4f8" data-i18n="bg1">رمادي فاتح جداً (الافتراضي)</option>
                    <option value="#ffffff" data-i18n="bg2">أبيض ناصع</option>
                    <option value="#fffaf0" data-i18n="bg3">كريمي فاتح</option>
                    <option value="#e6fffa" data-i18n="bg4">نعناعي خفيف</option>
                    <option value="#ebf8ff" data-i18n="bg5">أزرق سماوي باهت</option>
                </select>
            </div>
            <button class="btn-back" onclick="switchScreen('mainScreen')" style="background-color: #4a5568;" data-i18n="privacyBtn">📄 سياسة الخصوصية</button>
            <button class="btn-back" onclick="switchScreen('mainScreen')" data-i18n="backBtn">⬅️ رجوع للرئيسية</button>
        </div>

        <div id="calcScreen" class="screen">
            <h2 style="text-align: center;" data-i18n="calcTitle">تحليل الوجبة</h2>
            <div id="imageBox" class="image-placeholder">
                <span id="imageIcon">📸</span>
                <img id="previewImage" src="" alt="">
                <div id="uploadProgress" class="upload-progress">0%</div>
            </div>
            <label class="btn-primary" style="display: block; text-align: center; cursor: pointer; border-radius: 12px; padding: 15px; color: white; font-weight: bold; margin-bottom: 10px;">
                <span data-i18n="captureBtn">التقط أو ارفع صورة 📸</span>
                <input type="file" id="mealImage" accept="image/*" capture="environment" style="display: none;">
            </label>

            <label class="checkbox-container">
                <input type="checkbox" id="advancedToggle" onchange="toggleAdvanced()">
                <span data-i18n="advToggle">⚙️ فتح الخيارات المتقدمة والمكونات</span>
            </label>

            <div id="advancedOptions" class="advanced-box" style="display: none;">
                <div class="section-title" data-i18n="cookMethod">طريقة الطبخ الأساسية:</div>
                <select id="cookingMethod">
                    <option value="none" data-i18n="cookOpt1">-- اختر طريقة الطبخ --</option>
                    <option value="grilled" data-i18n="cookOpt2">مشوي (أقل سعرات)</option>
                    <option value="boiled" data-i18n="cookOpt3">مسلوق (صحي جداً)</option>
                    <option value="fried" data-i18n="cookOpt4">مقلي (عالي السعرات)</option>
                </select>
                <div class="section-title" data-i18n="proteinType">نوع البروتين المضاف:</div>
                <select id="proteinType">
                    <option value="none" data-i18n="protOpt1">-- اختر النوع --</option>
                    <option value="chicken" data-i18n="protOpt2">دجاج</option>
                    <option value="meat" data-i18n="protOpt3">لحم غنم/بقر</option>
                    <option value="fish" data-i18n="protOpt4">سمك</option>
                </select>
                <div class="section-title" style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; border: none;">
                    <span data-i18n="extraIngLabel">المكونات الإضافية للوجبة:</span>
                    <button type="button" onclick="addIngredientRow()" style="margin: 0; width: auto; padding: 6px 15px; background: var(--primary-color); color: white; border: none; border-radius: 8px;" data-i18n="addIngBtn">➕ أضف مكون</button>
                </div>
                <div id="dynamicIngredientsContainer" style="margin-top: 10px;"></div>
            </div>

            <button id="calcBtn" class="btn-calc" onclick="startCalculation()" data-i18n="calcNowBtn">احسب السعرات الآن 🔥</button>
            <button class="btn-back" onclick="switchScreen('mainScreen')" data-i18n="backBtnOnly">رجوع</button>
        </div>

        <div id="resultScreen" class="screen" style="text-align: center;">
            <h2 style="text-align: center;" data-i18n="resTitle">النتيجة التقريبية</h2>
            <div class="advanced-box" style="text-align: center; border-color: #48bb78; border-width: 2px;" id="caloriesBox">
                <h1 id="finalCalories" style="color: #48bb78; margin: 0; font-size: 50px;">0</h1>
                <p style="margin-top: 5px; font-weight: bold;" data-i18n="kcalText">سعرة حرارية (Kcal)</p>
            </div>
            
            <div id="errorExplanationCard" class="error-card" style="display: none;"></div>

            <div id="aiTipsContainer" style="text-align: right; margin-top: 20px; display: none;">
                <div class="section-title" style="border: none; color: var(--text-color);" data-i18n="aiTipsLabel">💡 نصائح الذكاء الاصطناعي:</div>
                <div class="tip-card reduce-calories"><strong data-i18n="tip1">📉 للتقليل:</strong> <span id="tipReduce"></span></div>
                <div class="tip-card increase-veggies"><strong data-i18n="tip2">🥗 صحياً:</strong> <span id="tipVeggies"></span></div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn-back" style="flex: 1; margin: 0;" onclick="switchScreen('calcScreen')" data-i18n="backEditBtn">⬅️ رجوع للتعديل</button>
                <button class="btn-calc" style="flex: 1; margin: 0; background: #25D366;" onclick="shareResult()" data-i18n="shareBtn">📲 مشاركة النتيجة</button>
            </div>
            <button class="btn-primary" style="margin-top: 10px;" onclick="switchScreen('mainScreen')" data-i18n="homeBtn">🏠 الخيارات الرئيسية</button>
        </div>

        <div id="historyScreen" class="screen">
            <h2 style="text-align: center;" data-i18n="histTitle">سجل الوجبات</h2>
            <div style="text-align: left; margin-bottom: 10px;" id="clearHistoryDiv">
                <button onclick="clearHistory()" style="width: auto; padding: 5px 10px; background: transparent; color: #e53e3e; border: 1px solid #e53e3e; margin: 0;" data-i18n="clearHistBtn">🗑️ مسح السجل</button>
            </div>
            <div id="historyContainer" class="history-card" style="max-height: 350px; overflow-y: auto;">
                <p style="text-align:center; color:gray;" data-i18n="emptyHist">لا توجد وجبات محفوظة حالياً.</p>
            </div>
            <button class="btn-back" onclick="switchScreen('mainScreen')" style="margin-top: 15px;" data-i18n="backBtnOnly">رجوع</button>
        </div>

        <div id="profileScreen" class="screen">
            <h2 style="text-align: center;" data-i18n="profTitle">الحساب الشخصي</h2>
            <div id="loginSection" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px;">
                <p style="text-align: center; font-size: 14px; color: gray;" data-i18n="loginDesc">سجل الدخول لحفظ بياناتك وسجلك بشكل سحابي</p>
                
                <div id="g_id_onload"
                     data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
                     data-context="signin"
                     data-ux_mode="popup"
                     data-callback="handleGoogleLogin"
                     data-auto_select="false">
                </div>
                <div class="g_id_signin"
                     data-type="standard"
                     data-shape="skewed"
                     data-theme="outline"
                     data-text="signin_with"
                     data-size="large"
                     data-logo_alignment="left">
                </div>
            </div>
            <div id="userDataSection" style="display:none;" class="advanced-box">
                <p style="text-align: center; color: #48bb78; font-weight: bold;" id="googleUserTxt">✅ متصل</p>
                <button class="btn-remove" onclick="logoutGoogle()" style="width: 100%;">تسجيل الخروج Log Out</button>
            </div>
            <button class="btn-back" onclick="switchScreen('mainScreen')" data-i18n="backBtnOnly">رجوع</button>
        </div>

        <div id="infoScreen" class="screen">
            <h2 style="text-align: center;" data-i18n="infoTitle">طريقة الاستخدام</h2>
            <div class="advanced-box" style="line-height: 1.8;" id="infoTextContainer">
                <p data-i18n="info1">1. التقط صورة واضحة للوجبة وسيقوم التطبيق بتقدير السعرات آلياً.</p>
                <p data-i18n="info2">2. للحصول على حسبة أدق، استخدم (الخيارات المتقدمة) وحدد طريقة الطبخ والوزن.</p>
                <p data-i18n="info3">3. اقرأ نصائح الذكاء الاصطناعي بعد كل وجبة لتحسين نظامك الغذائي.</p>
                <p style="color: var(--primary-color); font-weight: bold;" data-i18n="info4">4. ملاحظة هامة: إذا أردت أن تكون السعرات مقاربة للحقيقة بشكل دقيق جداً، أضف البيانات الإضافية في قسم (الخيارات المتقدمة) لتساعد الذكاء الاصطناعي في الحسبة.</p>
            </div>
            <button class="btn-back" onclick="switchScreen('mainScreen')" data-i18n="backBtnOnly">رجوع</button>
        </div>
    </div>

    <div class="fixed-bottom-ad" data-i18n="adSpace">مساحة إعلانية مستطيلة نشطة (Google AdSense Banner Space)</div>

    <script>
        // قاموس ترجمة متكامل يشمل رسائل توضيح الأخطاء الجديدة للنتيجة 0
        const i18n = {
            ar: {
                appTitle: "حاسب السعرات", btnVip: "👑 VIP",
                offlineTitle: "لا يوجد اتصال بالإنترنت", offlineDesc: "التطبيق يعتمد على الذكاء الاصطناعي والسيرفرات السحابية. يرجى الاتصال بالإنترنت للاستمرار.",
                menu1: "📸 1. تصوير لحساب السعرات", menu2: "📋 2. سجل الوجبات", menu3: "⚙️ 3. الإعدادات والمظهر", menu4: "📖 4. طريقة الاستخدام",
                adSpace: "مساحة إعلانية مستطيلة نشطة (Google AdSense Banner Space)", settingsTitle: "الإعدادات والمظهر", langLabel: "اللغة (Language):",
                themeLabel: "نمط العرض (فاتح/داكن):", themeSys: "النظام التلقائي ⚙️", themeLight: "الوضع الفاتح ☀️", themeDark: "الوضع الداكن 🌙",
                colorLabel: "اللون الأساسي (الأزرار والحدود):", colorBlue: "أزرق محيطي (الافتراضي)", colorGreen: "أخضر صحي", colorRed: "أحمر نشط", colorPurple: "بنفسجي هادئ", colorOrange: "برتقالي حيوي", colorGray: "رمادي داكن",
                bgLabel: "لون خلفية التطبيق:", bg1: "رمادي فاتح جداً (الافتراضي)", bg2: "أبيض ناصع", bg3: "كريمي فاتح", bg4: "نعناعي خفيف", bg5: "أزرق سماوي باهت",
                privacyBtn: "📄 سياسة الخصوصية", backBtn: "⬅️ رجوع للرئيسية", backBtnOnly: "رجوع", calcTitle: "تحليل الوجبة",
                captureBtn: "التقط أو ارفع صورة 📸", advToggle: "⚙️ فتح الخيارات المتقدمة والمكونات", cookMethod: "طريقة الطبخ الأساسية:",
                cookOpt1: "-- اختر طريقة الطبخ --", cookOpt2: "مشوي (أقل سعرات)", cookOpt3: "مسلوق (صحي جداً)", cookOpt4: "مقلي (عالي السعرات)",
                proteinType: "نوع البروتين المضاف:", protOpt1: "-- اختر النوع --", protOpt2: "دجاج", protOpt3: "لحم غنم/بقر", protOpt4: "سمك",
                extraIngLabel: "المكونات الإضافية للوجبة:", addIngBtn: "➕ أضف مكون", calcNowBtn: "احسب السعرات الآن 🔥",
                resTitle: "النتيجة التقريبية", kcalText: "سعرة حرارية (Kcal)", aiTipsLabel: "💡 نصائح الذكاء الاصطناعي:", tip1: "📉 للتقليل:", tip2: "🥗 صحياً:",
                backEditBtn: "⬅️ رجوع للتعديل", shareBtn: "📲 مشاركة النتيجة", homeBtn: "🏠 الخيارات الرئيسية",
                histTitle: "سجل الوجبات", clearHistBtn: "🗑️ مسح السجل", emptyHist: "لا توجد وجبات محفوظة حالياً.",
                profTitle: "الحساب الشخصي", loginDesc: "سجل الدخول لحفظ بياناتك وسجلك بشكل سحابي", connected: "✅ متصل",
                infoTitle: "طريقة الاستخدام", info1: "1. التقط صورة واضحة للوجبة وسيقوم التطبيق بتقدير السعرات آلياً.", info2: "2. للحصول على حسبة أدق، استخدم (الخيارات المتقدمة) وحدد طريقة الطبخ والوزن.", info3: "3. اقرأ نصائح الذكاء الاصطناعي بعد كل وجبة لتحسين نظامك الغذائي.", info4: "4. ملاحظة هامة: إذا أردت أن تكون السعرات مقاربة للحقيقة بشكل دقيق جداً، أضف البيانات الإضافية في قسم (الخيارات المتقدمة) لتساعد الذكاء الاصطناعي في الحسبة.",
                errNoInput: "⚠️ النتيجة 0: لم تقم بالتقاط صورة ولم تقم بإدخال أي بيانات متقدمة لحساب السعرات!",
                errNoImage: "⚠️ النتيجة 0: لم تقم بوضع صورة للوجبة، والبيانات المتقدمة المرفقة غير كافية لتقدير السعرات!",
                errBadImage: "⚠️ النتيجة 0: توجد مشكلة في الصورة المرفقة (غير واضحة، مظلمة، أو لم يتعرف عليها الذكاء الاصطناعي)!",
                errBadData: "⚠️ النتيجة 0: توجد مشكلة أو نقص حاد في البيانات المتقدمة والمكونات المدخلة!"
            },
            en: {
                appTitle: "Calorie Calc", btnVip: "👑 VIP",
                offlineTitle: "No Internet Connection", offlineDesc: "The app relies on AI and cloud servers. Please connect to the internet to continue.",
                menu1: "📸 1. Snap to Calculate", menu2: "📋 2. Meals History", menu3: "⚙️ 3. Settings & Theme", menu4: "📖 4. How to Use",
                adSpace: "Google AdSense Banner Space Active", settingsTitle: "Settings & Theme", langLabel: "Language:",
                themeLabel: "Theme (Light/Dark):", themeSys: "System Auto ⚙️", themeLight: "Light Mode ☀️", themeDark: "Dark Mode 🌙",
                colorLabel: "Primary Color (Buttons & Borders):", colorBlue: "Ocean Blue (Default)", colorGreen: "Healthy Green", colorRed: "Active Red", colorPurple: "Calm Purple", colorOrange: "Vivid Orange", colorGray: "Dark Gray",
                bgLabel: "App Background Color:", bg1: "Very Light Gray (Default)", bg2: "Pure White", bg3: "Light Cream", bg4: "Light Mint", bg5: "Pale Sky Blue",
                privacyBtn: "📄 Privacy Policy", backBtn: "⬅️ Back to Home", backBtnOnly: "Back", calcTitle: "Meal Analysis",
                captureBtn: "Capture or Upload Image 📸", advToggle: "⚙️ Open Advanced Options", cookMethod: "Basic Cooking Method:",
                cookOpt1: "-- Select Cooking Method --", cookOpt2: "Grilled (Lower Cals)", cookOpt3: "Boiled (Very Healthy)", cookOpt4: "Fried (High Cals)",
                proteinType: "Added Protein Type:", protOpt1: "-- Select Type --", protOpt2: "Chicken", protOpt3: "Beef/Lamb", protOpt4: "Fish",
                extraIngLabel: "Extra Ingredients:", addIngBtn: "➕ Add Ingredient", calcNowBtn: "Calculate Calories Now 🔥",
                resTitle: "Approximate Result", kcalText: "Calories (Kcal)", aiTipsLabel: "💡 AI Tips:", tip1: "📉 To Reduce:", tip2: "🥗 Healthier:",
                backEditBtn: "⬅️ Back to Edit", shareBtn: "📲 Share Result", homeBtn: "🏠 Main Menu",
                histTitle: "Meals History", clearHistBtn: "🗑️ Clear History", emptyHist: "No saved meals currently.",
                profTitle: "Personal Profile", loginDesc: "Log in to save your data and history securely via Google Cloud", connected: "✅ Connected",
                infoTitle: "How to Use", info1: "1. Take a clear picture of the meal and the app will estimate calories automatically.", info2: "2. For more accuracy, use (Advanced Options) to specify cooking method and weight.", info3: "3. Read AI tips after each meal to improve your diet.", info4: "4. Important note: For highly accurate calories, add extra ingredients in the (Advanced Options) to help the AI.",
                errNoInput: "⚠️ Result 0: You did not provide an image or any advanced details for analysis!",
                errNoImage: "⚠️ Result 0: No image selected, and advanced details are insufficient to calculate calories!",
                errBadImage: "⚠️ Result 0: Problem with the image (blurry, dark, or unrecognized by the AI)!",
                errBadData: "⚠️ Result 0: Problem or complete lack of required advanced inputs/ingredients!"
            }
        };

        function checkOnlineStatus() {
            const overlay = document.getElementById('offlineOverlay');
            if (navigator.onLine) overlay.style.display = 'none';
            else overlay.style.display = 'flex';
        }
        window.addEventListener('online', checkOnlineStatus);
        window.addEventListener('offline', checkOnlineStatus);

        let ingredientCount = 0;
        let userHistory = JSON.parse(localStorage.getItem('appUserHistory')) || [];

        function switchScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
        }

        function applyLanguage(lang) {
            document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if(i18n[lang] && i18n[lang][key]) el.innerText = i18n[lang][key];
            });
            document.getElementById('infoTextContainer').style.textAlign = (lang === 'ar') ? 'right' : 'left';
            document.getElementById('clearHistoryDiv').style.textAlign = (lang === 'ar') ? 'left' : 'right';
        }

        function changeLanguage() {
            const lang = document.getElementById('languageSelector').value;
            localStorage.setItem('appLang', lang);
            applyLanguage(lang);
        }

        function changeTheme() { 
            const theme = document.getElementById('themeSelector').value;
            if (theme === 'dark') document.body.classList.add('dark-mode');
            else if (theme === 'light') document.body.classList.remove('dark-mode');
            else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('dark-mode');
                else document.body.classList.remove('dark-mode');
            }
        }

        function changeColors() {
            const primaryColor = document.getElementById('primaryColorSelector').value;
            const bgColor = document.getElementById('bgColorSelector').value;
            document.documentElement.style.setProperty('--primary-color', primaryColor);
            document.documentElement.style.setProperty('--bg-color', bgColor);
            localStorage.setItem('appPrimaryColor', primaryColor);
            localStorage.setItem('appBgColor', bgColor);
        }

        function loadSavedSettings() {
            const savedPrimary = localStorage.getItem('appPrimaryColor');
            const savedBg = localStorage.getItem('appBgColor');
            const savedLang = localStorage.getItem('appLang') || 'ar'; 
            if (savedPrimary) {
                document.documentElement.style.setProperty('--primary-color', savedPrimary);
                if(document.getElementById('primaryColorSelector')) document.getElementById('primaryColorSelector').value = savedPrimary;
            }
            if (savedBg) {
                document.documentElement.style.setProperty('--bg-color', savedBg);
                if(document.getElementById('bgColorSelector')) document.getElementById('bgColorSelector').value = savedBg;
            }
            if(document.getElementById('languageSelector')) document.getElementById('languageSelector').value = savedLang;
            applyLanguage(savedLang);
        }

        window.onload = function() { 
            checkOnlineStatus();
            loadSavedSettings(); 
            renderHistory(); 
            changeTheme(); 
            checkSavedGoogleUser();
        };

        document.getElementById('mealImage').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if(!file) return;
            const progress = document.getElementById('uploadProgress');
            const imgEl = document.getElementById('previewImage');
            const icon = document.getElementById('imageIcon');
            const reader = new FileReader();
            const lang = document.documentElement.lang;

            icon.style.display = 'none'; imgEl.style.display = 'none'; progress.style.display = 'block';
            let percent = 0;
            const interval = setInterval(() => {
                percent += 20;
                progress.innerText = (lang === 'ar') ? `جاري التحميل... ${percent}%` : `Loading... ${percent}%`;
                if(percent >= 100) {
                    clearInterval(interval);
                    reader.readAsDataURL(file); 
                }
            }, 100);

            reader.onload = function(event) {
                progress.style.display = 'none'; imgEl.src = event.target.result; imgEl.style.display = 'block';
            }
        });

        // ========================================== 
        // 🔐 نظام اتصال حساب Google والمزامنة 
        // ========================================== 
        function handleGoogleLogin(response) {
            // فك التشفير الأساسي لبيانات المستخدم المستلمة من الـ Token الخاص بجوجل
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const user = JSON.parse(jsonPayload);
            localStorage.setItem('googleUser', JSON.stringify(user));
            showConnectedUser(user.name);
        }

        function showConnectedUser(name) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('userDataSection').style.display = 'block';
            document.getElementById('googleUserTxt').innerText = (document.documentElement.lang === 'en') ? `✅ Connected: ${name}` : `✅ متصل: ${name}`;
        }

        function checkSavedGoogleUser() {
            const savedUser = localStorage.getItem('googleUser');
            if(savedUser) {
                const user = JSON.parse(savedUser);
                showConnectedUser(user.name);
            }
        }

        function logoutGoogle() {
            localStorage.removeItem('googleUser');
            document.getElementById('userDataSection').style.display = 'none';
            document.getElementById('loginSection').style.display = 'flex';
        }

        function saveToHistory(calories) {
            const dateString = new Date().toLocaleDateString('en-GB') + " - " + new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'});
            userHistory.push({ date: dateString, calories: calories });
            localStorage.setItem('appUserHistory', JSON.stringify(userHistory));
            renderHistory();
        }

        function renderHistory() {
            const container = document.getElementById('historyContainer');
            if(!container) return;
            if(userHistory.length === 0) { container.innerHTML = `<p style="text-align:center; color:gray;">${document.documentElement.lang === 'en' ? 'No saved meals.' : 'لا توجد وجبات.'}</p>`; return; }
            container.innerHTML = [...userHistory].reverse().map(item => `
                <div class="history-item">
                    <span style="font-size:14px; color:gray;">${item.date}</span>
                    <strong style="color: #48bb78;">${item.calories} Kcal</strong>
                </div>
            `).join('');
        }

        function clearHistory() {
            if(confirm(document.documentElement.lang === 'en' ? 'Clear all?' : 'مسح الكل؟')) {
                userHistory = []; localStorage.setItem('appUserHistory', JSON.stringify([])); renderHistory();
            }
        }

        function toggleAdvanced() {
            document.getElementById('advancedOptions').style.display = document.getElementById('advancedToggle').checked ? 'block' : 'none';
        }

        function addIngredientRow() {
            ingredientCount++;
            const lang = document.documentElement.lang;
            const rowHtml = `
                <div class="extra-item-row" id="ingredient_row_${ingredientCount}">
                    <div class="row-top">
                        <select style="flex: 1;"><option>${lang==='en'?'Vegetables':'خضار'}</option><option>${lang==='en'?'Liquids':'سوائل'}</option><option>${lang==='en'?'Others':'أخرى'}</option></select>
                        <input type="text" placeholder="${lang==='en'?'Name...':'اسم المكون...'}" style="flex: 2;">
                    </div>
                    <div class="row-bottom">
                        <input type="number" placeholder="${lang==='en'?'Qty (g)':'الوزن (جرام)'}" style="flex: 2;">
                        <button class="btn-remove" type="button" onclick="document.getElementById('ingredient_row_${ingredientCount}').remove()">❌</button>
                    </div>
                </div>
            `;
            document.getElementById('dynamicIngredientsContainer').insertAdjacentHTML('beforeend', rowHtml);
        }

        /* ===================================================================== */
        /* 🚀 الاتصال بالسيرفر والتحقق من الشروط الذكية للنتيجة 0 والمشكلة */
        /* ===================================================================== */
        async function startCalculation() {
            const calcBtn = document.getElementById('calcBtn');
            const originalText = calcBtn.innerText;
            const lang = document.documentElement.lang;
            
            const fileInput = document.getElementById('mealImage');
            const file = fileInput.files[0];
            
            const cookingMethod = document.getElementById('cookingMethod').value;
            const proteinType = document.getElementById('proteinType').value;
            const extraRows = document.querySelectorAll('.extra-item-row');
            
            // التحقق البرمجي من المدخلات المتقدمة
            let hasAdvancedDetails = (cookingMethod !== 'none') || (proteinType !== 'none') || (extraRows.length > 0);
            let hasImage = !!file;

            // 1. الشرط الصارم الأول: إذا غابت الصورة والبيانات المتقدمة معاً
            if (!hasImage && !hasAdvancedDetails) {
                displayZeroResult('errNoInput');
                return;
            }

            calcBtn.innerText = lang === 'en' ? 'AI Analyzing Image... ⏳' : 'جاري تحليل الصورة والبيانات بالذكاء الاصطناعي... ⏳'; 
            calcBtn.disabled = true;

            // بناء الطلب الهيكلي للسيرفر
            const formData = new FormData();
            if (hasImage) {
                formData.append('image', file);
            }
            formData.append('cookingMethod', cookingMethod);
            formData.append('proteinType', proteinType);
            
            const ingredients = [];
            extraRows.forEach(row => {
                const selectType = row.querySelector('select').value;
                const inputName = row.querySelector('input[type="text"]').value;
                const inputQty = row.querySelector('input[type="number"]').value;
                if (inputName || inputQty) {
                    ingredients.push({ type: selectType, name: inputName, qty: inputQty });
                }
            });
            formData.append('ingredients', JSON.stringify(ingredients));

            try {
              // استبدل الرابط القديم (اللوحي 127.0.0.1) برابط سيرفر Render الحي
              const serverUrl = "https://my-app-privac2-1.onrender.com/analyze";

             // عند إرسال البيانات (مثال على دالة fetch لديك)
              fetch(serverUrl, {
               method: 'POST',
               body: formData // إرسال الصورة والبيانات الأخرى
               })
               .then(response => response.json())
               .then(data => {
                 console.log("النتيجة من السيرفر:", data);
               })
               .catch(error => {
                 console.error("حدث خطأ في الاتصال بالسيرفر:", error);
                });
                
                const data = await response.json();
                const caloriesResult = parseInt(data.calories) || 0;

                // 2. إذا عادت النتيجة صفر من السيرفر أو تعذر حسابها لسبب ما
                if (caloriesResult === 0) {
                    if (!hasImage) {
                        displayZeroResult('errNoImage');
                    } else if (!hasAdvancedDetails) {
                        displayZeroResult('errBadImage');
                    } else {
                        displayZeroResult('errBadData');
                    }
                } else {
                    // عرض النتيجة الطبيعية بنجاح
                    document.getElementById('finalCalories').innerText = caloriesResult;
                    document.getElementById('caloriesBox').style.borderColor = '#48bb78';
                    document.getElementById('finalCalories').style.color = '#48bb78';
                    
                    document.getElementById('tipReduce').innerText = data.tipReduce || '';
                    document.getElementById('tipVeggies').innerText = data.tipVeggies || '';
                    
                    document.getElementById('errorExplanationCard').style.display = 'none';
                    document.getElementById('aiTipsContainer').style.display = 'block';

                    saveToHistory(caloriesResult);
                    switchScreen('resultScreen');
                }
            } catch (error) {
                // معالجة الأخطاء محلياً عند انقطاع السيرفر مع إظهار السبب التقديري
                console.error(error);
                if (!hasImage) {
                    displayZeroResult('errNoImage');
                } else {
                    displayZeroResult('errBadImage');
                }
            } finally {
                calcBtn.innerText = originalText; 
                calcBtn.disabled = false;
            }
        }

        // دالة مخصصة لعرض النتيجة 0 وتوضيح نوع المشكلة مع إخفاء النصائح تلقائياً
        function displayZeroResult(errorKey) {
            const lang = document.documentElement.lang;
            document.getElementById('finalCalories').innerText = "0";
            document.getElementById('caloriesBox').style.borderColor = '#dd6b20';
            document.getElementById('finalCalories').style.color = '#dd6b20';
            
            // إظهار سبب المشكلة المخصصة المخزنة في قاموس اللغات
            const errorCard = document.getElementById('errorExplanationCard');
            errorCard.innerText = i18n[lang][errorKey];
            errorCard.style.display = 'block';
            
            // إخفاء حاوية نصائح الذكاء الاصطناعي تماماً
            document.getElementById('aiTipsContainer').style.display = 'none';
            
            switchScreen('resultScreen');
        }

        function shareResult() {
            const cals = document.getElementById('finalCalories').innerText;
            const msg = document.documentElement.lang === 'en' ? `My meal has ${cals} Calories! 🥗🔥` : `وجبتي تحتوي على ${cals} سعرة حرارية! 🥗🔥`;
            if (navigator.share) navigator.share({ text: msg });
            else alert(msg);
        }
    </script>
</body>
</html>
