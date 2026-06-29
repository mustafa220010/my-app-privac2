import os
import io
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from PIL import Image, UnidentifiedImageError

app = Flask(__name__)
# السماح بجميع الاتصالات لتجنب أخطاء CORS
CORS(app)

# جلب المفتاح بشكل آمن من إعدادات Render (يجب أن يبدأ بـ gsk_)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("تحذير: لم يتم العثور على مفتاح GROQ API! يرجى إضافته في إعدادات البيئة.")

# إعداد عميل Groq
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        if not client:
            return jsonify({"error": "مشكلة في السيرفر: مفتاح الذكاء الاصطناعي مفقود."}), 500

        # استقبال البيانات من التطبيق
        cooking_method = request.form.get('cooking_method', 'غير محدد')
        protein_type = request.form.get('proteinType', 'غير محدد')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        # معالجة الصورة وتحويلها لصيغة Base64 التي يفهمها Groq
        base64_image = None
        if image_file:
            try:
                image_bytes = image_file.read()
                # التأكد من أن الملف صورة صالحة
                img_object = Image.open(io.BytesIO(image_bytes))
                
                # تحويل الصورة إلى صيغة متوافقة (JPEG) لتقليل الحجم
                if img_object.mode != 'RGB':
                    img_object = img_object.convert('RGB')
                
                buffered = io.BytesIO()
                img_object.save(buffered, format="JPEG")
                
                # تشفير الصورة
                base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            except UnidentifiedImageError:
                return jsonify({"error": "الملف المرفق ليس صورة صالحة أو أنه تالف."}), 400
        else:
            return jsonify({"error": "الرجاء إرفاق صورة للوجبة."}), 400

        # تجهيز السؤال والنظام المطلوب إرجاعه (JSON)
        prompt = f"""
أنت خبير تغذية ذكي. قم بتحليل الوجبة في الصورة المرفقة.
البيانات الإضافية للطبخ:
- طريقة الطبخ: {cooking_method}
- نوع البروتين: {protein_type}
- مكونات إضافية: {ingredients_json}

يجب إرجاع النتيجة بصيغة JSON فقط، باستخدام هذا الهيكل تماماً:
{{
  "status": "اكتب success إذا تعرفت على الطعام، أو unclear إذا كانت الصورة غير واضحة",
  "calories": 0, 
  "mealName": "اسم الوجبة بالعربية",
  "tipReduce": "نصيحة قصيرة لتقليل السعرات",
  "tipVeggies": "نصيحة لإضافة الخضار"
}}
"""

        # تجهيز الرسالة التي سيتم إرسالها إلى نموذج Groq (نص + صورة)
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]

        # إرسال الطلب لنموذج الرؤية الخاص بـ Groq (Llama 3.2 Vision)
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2
        )

        # استخراج النتيجة
        result_text = response.choices[0].message.content
        final_result = json.loads(result_text)

        # التحقق مما إذا كان الذكاء الاصطناعي لم يتعرف على الصورة
        if final_result.get("status") == "unclear":
            return jsonify({
                "error": "عذراً، الصورة غير واضحة أو لا تبدو كوجبة طعام. يرجى التقاط صورة أوضح."
            }), 400

        return jsonify(final_result)

    except Exception as e:
        print(f"Server Error: {e}")
        return jsonify({"error": f"حدث خطأ داخلي في السيرفر أو في الاتصال بـ Groq: {str(e)}"}), 500

# تشغيل السيرفر
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
