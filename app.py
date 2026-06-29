import os
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image, UnidentifiedImageError

app = Flask(__name__)
# السماح بجميع الاتصالات لتجنب أخطاء CORS
CORS(app)

# 1. جلب المفتاح بشكل آمن من إعدادات Render
# ملاحظة: يجب إضافة متغير باسم GOOGLE_API_KEY في منصة Render ووضع المفتاح الذي يبدأ بـ AIza فيه
MY_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not MY_API_KEY:
    print("تحذير: لم يتم العثور على مفتاح API! يرجى إضافته في إعدادات البيئة (Environment Variables).")

# إعداد الذكاء الاصطناعي
genai.configure(api_key=MY_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # التأكد من وجود مفتاح API قبل البدء
        if not MY_API_KEY:
            return jsonify({"error": "مشكلة في السيرفر: مفتاح الذكاء الاصطناعي مفقود."}), 500

        # استقبال البيانات من التطبيق
        cooking_method = request.form.get('cooking_method', 'غير محدد')
        protein_type = request.form.get('proteinType', 'غير محدد')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        # معالجة الصورة واكتشاف الأخطاء فيها
        img_object = None
        if image_file:
            try:
                image_bytes = image_file.read()
                img_object = Image.open(io.BytesIO(image_bytes))
            except UnidentifiedImageError:
                return jsonify({"error": "الملف المرفق ليس صورة صالحة أو أنه تالف."}), 400
            except Exception as e:
                return jsonify({"error": f"فشل في قراءة الصورة: {str(e)}"}), 400
        else:
            return jsonify({"error": "الرجاء إرفاق صورة للوجبة."}), 400

        # تجهيز السؤال
        prompt = f"""
أنت خبير تغذية ذكي. قم بتحليل الوجبة في الصورة المرفقة.
البيانات الإضافية:
- طريقة الطبخ: {cooking_method}
- نوع البروتين: {protein_type}
- مكونات إضافية: {ingredients_json}

إذا كانت الصورة غير واضحة، أو لا تحتوي على طعام، أو لا يمكنك التعرف عليها، اجعل قيمة "status" هي "unclear".
إذا تعرفت على الطعام، اجعل قيمة "status" هي "success" وأكمل باقي البيانات.
يجب إرجاع النتيجة بصيغة JSON فقط.
"""

        # إجبار النموذج على هيكل JSON محدد يسهل التعامل معه
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "status": {"type": "STRING", "description": "'success' if food is identified, 'unclear' if not food or unclear."},
                    "calories": {"type": "INTEGER", "description": "Estimated calories. 0 if unclear."},
                    "mealName": {"type": "STRING", "description": "Meal name in Arabic."},
                    "tipReduce": {"type": "STRING", "description": "Tip in Arabic to reduce calories."},
                    "tipVeggies": {"type": "STRING", "description": "Tip in Arabic to enhance nutrition."}
                },
                "required": ["status", "calories", "mealName", "tipReduce", "tipVeggies"]
            }
        )

        # إرسال الطلب للذكاء الاصطناعي
        response = model.generate_content(
            [prompt, img_object],
            generation_config=generation_config
        )

        # تحويل الرد إلى قاموس
        final_result = json.loads(response.text)

        # التحقق مما إذا كان الذكاء الاصطناعي لم يتعرف على الصورة
        if final_result.get("status") == "unclear":
            return jsonify({
                "error": "عذراً، الصورة غير واضحة أو لا تبدو كوجبة طعام. يرجى التقاط صورة أوضح."
            }), 400

        # إذا سار كل شيء على ما يرام، أرسل النتيجة
        return jsonify(final_result)

    except Exception as e:
        # التقاط أي أخطاء مفاجئة في السيرفر أو من API جوجل
        print(f"Server Error: {e}")
        return jsonify({"error": f"حدث خطأ داخلي في السيرفر أو في الاتصال بالذكاء الاصطناعي: {str(e)}"}), 500

# إعداد السيرفر ليعمل على Render أو محلياً
if __name__ == '__main__':
    # منصة Render تتطلب أن يكون الـ host هو 0.0.0.0 وأن يأخذ الـ port من بيئة التشغيل
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
