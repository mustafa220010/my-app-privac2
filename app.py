import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import io

flask
flask-cors
google-generativeai
pillow
gunicorn

app = Flask(__loqaymat mahsooba__)
CORS(app) # تفعيل السيرفر لاستقبال الطلبات من الواجهة الخارجية

# سحب مفتاح الـ API بشكل آمن من إعدادات البيئة في Render لحماية حسابك
GOOGLE_API_KEY = https://mhswb.onrender.com/("gen-lang-client-0565529644", "srv-d8t0sfnlk1mc73ahhu7g")
genai.configure(api_key=GOOGLE_API_KEY)

# استخدام أحدث النماذج السريعة والذكية لتحليل الصور والنصوص فورياً
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # 1. استقبال المكونات والبيانات المتقدمة من الواجهة
        cooking_method = request.form.get('cookingMethod', 'none')
        protein_type = request.form.get('proteinType', 'none')
        ingredients_json = request.form.get('ingredients', '[]')
        
        # 2. التحقق من وجود ملف الصورة ومعالجته
        image_file = request.files.get('image')
        img_object = None
        if image_file:
            image_bytes = image_file.read()
            img_object = Image.open(io.BytesIO(image_bytes))

        # 3. صياغة التعليمات الهيكلية الدقيقة لإجبار الذكاء الاصطناعي على توفير صيغة جيسون مطابقة تماماً لواجهة البرنامج
        prompt = f"""
        أنت خبير تغذية وحساب سعرات حرارية ذكي. قم بتحليل الوجبة المرفقة (عبر الصورة أو المكونات).
        
        البيانات المتقدمة المتاحة للطبخ:
        - طريقة الطبخ الأساسية: {cooking_method}
        - نوع البروتين المضاف: {protein_type}
        - مكونات إضافية تم إدخالها بالجرام: {ingredients_json}
        
        المطلوب منك هو إرجاع النتيجة بتنسيق JSON نظيف ومباشر بدون أي علامات اقتباس خارجية أو نصوص مقدمة (بصيغة كائن جاهز مباشرة).
        يجب أن يحتوي الـ JSON حصرياً على المفاتيح التالية باللغة العربية:
        1. "calories": (ضع عدد السعرات الإجمالية التقديرية كرقم صحيح فقط). إذا كانت الوجبة غير واضحة تماماً أو غير معروفة أو الصورة لا تحتوي على طعام، ضع القيمة 0.
        2. "mealName": (ضع اسم الوجبة المكتشفة مثل "كبسة دجاج"، "سلطة يونانية"). إذا لم يتم معرفة اسم الوجبة أو كانت البيانات مبهمة، اترك النص فارغاً تماماً "".
        3. "tipReduce": (نصيحة ذكية وموجزة ومخصصة لتقليل السعرات في هذه الوجبة المحددة).
        4. "tipVeggies": (نصيحة لتعزيز القيمة الغذائية أو إضافة خضار تتناسب مع الوجبة).
        
        تذكر: إذا كانت الوجبة غير معروفة، يجب جعل قيمة السعراتcalories تساوي 0 ونص اسم الوجبة فارغاً.
        """

        # 4. استدعاء معالج الذكاء الاصطناعي بناءً على المدخلات المتاحة
        if img_object:
            response = model.generate_content([prompt, img_object])
        else:
            response = model.generate_content(prompt)
            
        # تنظيف النص المستلم من أي عناصر تنسيق markdown زائدة لضمان تحليل الجيسون
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        result_data = json.loads(clean_text)
        
        return jsonify(result_data)

    except Exception as e:
        print(f"حدث خطأ أثناء معالجة السيرفر: {e}")
        # إرجاع 0 كآلية حماية مرنة لكي يتعامل معها كود الواجهة بسلاسة ويعرض كارت التنبيه الذكي
        return jsonify({
            "calories": 0,
            "mealName": "",
            "tipReduce": "",
            "tipVeggies": ""
        })

if __name__ == '__main__':
    # تشغيل السيرفر محلياً على البورت 5000 للربط الافتراضي
    app.run(debug=True, port=5000)
