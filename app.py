import os
import io
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from PIL import Image, UnidentifiedImageError

app = Flask(__name__)
# تفعيل CORS للسماح لموقعك بالاتصال بالسيرفر بدون مشاكل
CORS(app)

# جلب مفتاح Groq بشكل آمن من إعدادات Render (Environment Variables)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# إعداد عميل Groq
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # التأكد من وجود المفتاح في السيرفر
        if not client:
            return jsonify({"error": "مشكلة في السيرفر: مفتاح الذكاء الاصطناعي (GROQ_API_KEY) مفقود في الإعدادات."}), 500

        # 1. استقبال البيانات القادمة من الواجهة الأمامية
        cooking_method = request.form.get('cooking_method', 'غير محدد')
        protein_type = request.form.get('proteinType', 'غير محدد')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        # 2. التحقق من وجود الصورة ومعالجتها وتحويلها إلى Base64
        base64_image = None
        if image_file:
            try:
                image_bytes = image_file.read()
                # التأكد من أن الملف المرفق هو صورة حقيقية وصالحة
                img_object = Image.open(io.BytesIO(image_bytes))
                
                # تحويل الصورة إلى صيغة RGB لضمان التوافق (وتجنب مشاكل صور PNG الشفافة)
                if img_object.mode != 'RGB':
                    img_object = img_object.convert('RGB')
                
                # ضغط الصورة لحجم مناسب للرفع السريع
                buffered = io.BytesIO()
                img_object.save(buffered, format="JPEG", quality=85)
                
                # التشفير بصيغة Base64
                base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            except UnidentifiedImageError:
                return jsonify({"error": "الملف المرفق ليس صورة صالحة أو أنه تالف."}), 400
            except Exception as e:
                return jsonify({"error": f"فشل السيرفر في قراءة ملف الصورة: {str(e)}"}), 400
        else:
            return jsonify({"error": "الرجاء إرفاق صورة للوجبة، السيرفر لم يستقبل أي صورة."}), 400

        # 3. صياغة السؤال (Prompt) وإجبار الذكاء الاصطناعي على رد JSON محدد
        prompt = f"""
أنت خبير تغذية ذكي. قم بتحليل الوجبة في الصورة المرفقة.
البيانات الإضافية المساعدة للطبخ:
- طريقة الطبخ الأساسية: {cooking_method}
- نوع البروتين المضاف: {protein_type}
- مكونات إضافية بالجرام: {ingredients_json}

إذا كانت الصورة غير واضحة، أو مظلمة جداً، أو لا تحتوي على طعام، أو لا يمكنك التعرف عليها كوجبة، اجعل قيمة "status" هي "unclear".
أما إذا تعرفت على الطعام، اجعل قيمة "status" هي "success" وأكمل باقي البيانات المكتوبة باللغة العربية.

يجب إرجاع النتيجة بصيغة JSON فقط، وبنفس هذا الهيكل تماماً وبدون أي نصوص خارج الأقواس:
{{
  "status": "success أو unclear",
  "calories": 0, 
  "mealName": "اسم الوجبة بالعربية",
  "tipReduce": "نصيحة قصيرة ومحددة باللغة العربية لتقليل سعراتها",
  "tipVeggies": "نصيحة باللغة العربية لإضافة خضار أو تحسين قيمتها الغذائية"
}}
"""

        # 4. إعداد مصفوفة البيانات (النص + الصورة المشفرة)
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

        # 5. إرسال الطلب إلى نموذج الرؤية الخاص بـ Groq
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-instruct",
            messages=messages,
            response_format={"type": "json_object"}, # إجبار السيرفر على إرجاع JSON
            temperature=0.1 # تقليل العشوائية للحصول على نتائج ثابتة
        )

        # 6. قراءة النتيجة وتحويلها لـ JSON لإرسالها للمستخدم
        result_text = response.choices[0].message.content
        final_result = json.loads(result_text)

        # إذا أفاد الذكاء الاصطناعي أن الصورة غير واضحة أو ليست طعاماً
        if final_result.get("status") == "unclear":
            return jsonify({
                "error": "عذراً، الصورة غير واضحة، أو لا تحتوي على وجبة طعام معروفة. يرجى التقاط صورة أوضح للوجبة."
            }), 400

        # إرجاع النتيجة الناجحة للتطبيق
        return jsonify(final_result)

    except Exception as e:
        print(f"Server Error Log: {e}")
        return jsonify({"error": f"حدث خطأ داخلي في السيرفر أو أثناء الاتصال بـ Groq: {str(e)}"}), 500

# تشغيل السيرفر ليتناسب مع بيئة Render المحمية ومحلياً أيضاً
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
