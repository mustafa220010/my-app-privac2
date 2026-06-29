import os
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image

app = Flask(__name__)
# السماح للواجهة الأمامية بالاتصال بالخادم بدون أخطاء CORS
CORS(app)

# ==========================================
# ⚠️ ضع مفتاحك الجديد هنا بين علامات التنصيص
# تأكد أن المفتاح يبدأ بـ AIza ولا توجد مسافات قبله أو بعده
# ==========================================
genai.configure(https://my-app-privac2-1.onrender.com)

# إعداد مفتاح الذكاء الاصطناعي
genai.configure(https://my-app-privac2-1.onrender.com)

# استخدام النموذج الأحدث والسريع الذي يدعم الصور والنصوص
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # 1. استقبال البيانات من التطبيق (الواجهة الأمامية)
        cooking_method = request.form.get('cooking_method', 'غير محدد')
        protein_type = request.form.get('proteinType', 'غير محدد')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        print(f"تم استلام طلب جديد - طريقة الطبخ: {cooking_method}")

        # 2. تجهيز الصورة (إذا تم إرفاقها)
        img_object = None
        if image_file:
            image_bytes = image_file.read()
            img_object = Image.open(io.BytesIO(image_bytes))

        # 3. تجهيز السؤال (Prompt) للذكاء الاصطناعي
        prompt = f"""
أنت خبير تغذية وحساب سعرات حرارية ذكي. قم بتحليل الوجبة في الصورة المرفقة إن وجدت، أو بناءً على المعطيات التالية.
البيانات المتاحة للطبخ:
- طريقة الطبخ الأساسية: {cooking_method}
- نوع البروتين المضاف: {protein_type}
- مكونات إضافية تم إدخالها بالجرام: {ingredients_json}

قم بتقدير السعرات الحرارية الإجمالية وإعطاء نصائح صحية.
يجب أن يكون الرد بصيغة JSON فقط.
"""

        # 4. إجبار الذكاء الاصطناعي على إرجاع JSON نظيف وبنفس الهيكلة المطلوبة
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "calories": {"type": "INTEGER", "description": "Total estimated calories. 0 if unclear."},
                    "mealName": {"type": "STRING", "description": "Name of the meal in Arabic, empty if unknown."},
                    "tipReduce": {"type": "STRING", "description": "Short tip in Arabic to reduce calories."},
                    "tipVeggies": {"type": "STRING", "description": "Tip in Arabic to add veggies or enhance nutrition."}
                },
                "required": ["calories", "mealName", "tipReduce", "tipVeggies"]
            }
        )

        # 5. إرسال الطلب (النص + الصورة) إلى Gemini
        content_parts = [prompt]
        if img_object:
            content_parts.append(img_object)

        response = model.generate_content(
            content_parts,
            generation_config=generation_config
        )

        # 6. تحويل الرد إلى قاموس بايثون وإرساله للتطبيق
        final_result = json.loads(response.text)
        print("تم التحليل بنجاح:", final_result)
        return jsonify(final_result)

    except Exception as e:
        print(f"حدث خطأ أثناء المعالجة: {e}")
        return jsonify({"error": str(e)}), 500

# تشغيل الخادم
if __name__ == '__main__':
    # يعمل على المنفذ 5000 محلياً لتتمكن من تجربته
    app.run(debug=True, host='0.0.0.0', port=5000)
