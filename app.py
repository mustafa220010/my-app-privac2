import os
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "YOUR_FALLBACK_API_KEY_HERE")
genai.configure(api_key=GOOGLE_API_KEY)

# 1. التحديث إلى نموذج يدعم الصور والنصوص معاً
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        cooking_method = request.form.get('cooking_method', 'none')
        protein_type = request.form.get('proteinType', 'none')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        print(f"Received cooking_method: {cooking_method}")
        print(f"Received image_file: {image_file}")

        img_object = None
        if image_file:
            image_bytes = image_file.read()
            img_object = Image.open(io.BytesIO(image_bytes))

        prompt = f"""
أنت خبير تغذية وحساب سعرات حرارية ذكي. قم بتحليل الوجبة المرفقة.
البيانات المتاحة للطبخ:
- طريقة الطبخ الأساسية: {cooking_method}
- نوع البروتين المضاف: {protein_type}
- مكونات إضافية تم إدخالها بالجرام: {ingredients_json}

قم بإرجاع النتيجة بدقة وبصيغة JSON فقط.
"""

        # 2. إجبار النموذج على إرجاع JSON نظيف متوافق مع متطلباتك
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "calories": {"type": "INTEGER", "description": "Total estimated calories. 0 if unclear or no food."},
                    "mealName": {"type": "STRING", "description": "Name of the meal in Arabic, empty if unknown."},
                    "tipReduce": {"type": "STRING", "description": "Short tip in Arabic to reduce calories."},
                    "tipVeggies": {"type": "STRING", "description": "Tip in Arabic to add veggies or enhance nutrition."}
                },
                "required": ["calories", "mealName", "tipReduce", "tipVeggies"]
            }
        )

        content_parts = [prompt]
        if img_object:
            content_parts.append(img_object)

        # إرسال الطلب مع الإعدادات الجديدة
        response = model.generate_content(
            content_parts,
            generation_config=generation_config
        )

        # 3. قراءة الـ JSON مباشرة دون الحاجة لتنظيف النص
        final_result = json.loads(response.text)
        
        return jsonify(final_result)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
