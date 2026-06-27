import os
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image

app = Flask(__name__)
CORS(app)

# إعداد مفتاح API بشكل آمن
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "YOUR_FALLBACK_API_KEY_HERE")
genai.configure(api_key=GOOGLE_API_KEY)

# استخدام أحدث النماذج
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # 1. استلام البيانات
        cooking_method = request.form.get('cooking_method', 'none')
        protein_type = request.form.get('proteinType', 'none')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        # 2. الطباعة للتحقق في سجلات السيرفر
        print(f"Received cooking_method: {cooking_method}")
        print(f"Received image_file: {image_file}")

        # 3. معالجة الصورة
        img_object = None
        if image_file:
            image_bytes = image_file.read()
            img_object = Image.open(io.BytesIO(image_bytes))

        # 4. البرومبت (خالي تماماً من الفواصل العربية)
        prompt = f"""
أنت خبير تغذية وحساب سعرات حرارية ذكي. قم بتحليل الوجبة المرفقة.
البيانات المتاحة للطبخ:
- طريقة الطبخ الأساسية: {cooking_method}
- نوع البروتين المضاف: {protein_type}
- مكونات إضافية تم إدخالها بالجرام: {ingredients_json}

يجب إرجاع النتيجة بصيغة JSON فقط يحتوي على المفاتيح التالية باللغة العربية:
1. "calories": (ضع عدد السعرات الإجمالية التقديرية كرقم صحيح فقط). إذا كانت الوجبة غير واضحة تماماً أو غير معروفة أو الصورة لا تحتوي على طعام, ضع القيمة 0.
2. "mealName": (ضع اسم الوجبة المكتشفة مثل "كبسة دجاج", "سلطة يونانية"). إذا لم يتم معرفة اسم الوجبة أو كانت البيانات مبهمة, اترك النص فارغاً تماماً "".
3. "tipReduce": (نصيحة ذكية وموجزة ومخصصة لتقليل السعرات في هذه الوجبة المحددة).
4. "tipVeggies": (نصيحة لتعزيز القيمة الغذائية أو إضافة خضار تتناسب مع الوجبة).
"""

        # 5. إرسال الطلب لنموذج الذكاء الاصطناعي
        if img_object:
            response = model.generate_content([prompt, img_object])
        else:
            response = model.generate_content(prompt)

        # 6. تنظيف النص المستلم وتحويله لرد برمجي (JSON)
        result_text = response.text.replace('```json', '').replace('```', '').strip()
        final_result = json.loads(result_text)
        
        return jsonify(final_result)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
