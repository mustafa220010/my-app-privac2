import os
import io
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from PIL import Image, UnidentifiedImageError

app = Flask(__name__)
# تفعيل CORS لضمان استقبال الطلبات من موقعك على GitHub Pages بدون قيود
CORS(app)

# جلب مفتاح Groq من إعدادات منصة Render بشكل آمن
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # 1. التحقق من إعدادات السيرفر ومفتاح الـ API
        if not client:
            return jsonify({
                "error_type": "server_configuration",
                "error": "مشكلة في السيرفر: مفتاح الذكاء الاصطناعي (GROQ_API_KEY) مفقود أو غير معرف في إعدادات Render (Environment Variables)."
            }), 500

        # 2. استقبال البيانات القادمة من الواجهة الأمامية (تم الحفاظ عليها بالكامل)
        cooking_method = request.form.get('cooking_method', 'غير محدد')
        protein_type = request.form.get('proteinType', 'غير محدد')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        # 3. التحقق الدقيق من ملف الصورة وتحديد نوع الخطأ
        if not image_file or image_file.filename == '':
            return jsonify({
                "error_type": "image_missing",
                "error": "السيرفر لم يستقبل أي صورة. تأكد من إرفاق ملف الصورة بشكل صحيح من واجهة موقعك."
            }), 400

        try:
            image_bytes = image_file.read()
            img_object = Image.open(io.BytesIO(image_bytes))
            
            # تحويل صيغة الألوان لضمان التوافق مع نماذج الرؤية (وتفادي مشاكل شفافية الـ PNG)
            if img_object.mode != 'RGB':
                img_object = img_object.convert('RGB')
            
            # ضغط الصورة للحفاظ على سرعة الرفع لـ Render وتقليل استهلاك البيانات
            buffered = io.BytesIO()
            img_object.save(buffered, format="JPEG", quality=85)
            base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
        except UnidentifiedImageError:
            return jsonify({
                "error_type": "image_invalid",
                "error": "الملف المرفوع ليس صورة صالحة أو أنه تالف. يرجى التأكد من اختيار ملف بصيغة (JPG, PNG, JPEG)."
            }), 400
        except Exception as e:
            return jsonify({
                "error_type": "image_processing_error",
                "error": f"فشل السيرفر في معالجة وقراءة ملف الصورة الداخلي: {str(e)}"
            }), 400

        # 4. صياغة الأوامر (Prompt) للذكاء الاصطناعي بدقة متناهية
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

        # 5. آلية تفادي توقف النماذج (Fallback System)
        # يقوم السيرفر بتجربة النماذج المتاحة للرؤية بالترتيب لضمان استمرارية الخدمة
        models_to_try = [
            "llama-3.2-11b-vision-preview",
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "qwen/qwen3.6-27b"
        ]
        
        response = None
        last_groq_error = None
        successful_model = None
        
        for model_name in models_to_try:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    response_format={"type": "json_object"}, # إلزام الموديل برد JSON مهيكل
                    temperature=0.1
                )
                successful_model = model_name
                break # عند نجاح أحد النماذج يتم كسر الحلقة فوراً
            except Exception as e:
                last_groq_error = str(e)
                print(f"تنبيـه: فشل النموذج {model_name}. جاري محاولة البديل.. الخطأ: {last_groq_error}")
                continue

        # إذا تم فحص جميع النماذج وفشلت العملية بالكامل من طرف منصة Groq
        if not response:
            return jsonify({
                "error_type": "groq_api_error",
                "error": f"فشل الاتصال بـ Groq عبر جميع النماذج الاحتياطية. قد يكون هناك خلل في المفتاح أو الحصة اليومية. الخطأ الأخير: {last_groq_error}"
            }), 502

        # 6. تحليل واستخراج البيانات المستلمة من الذكاء الاصطناعي
        try:
            result_text = response.choices[0].message.content
            final_result = json.loads(result_text)
        except Exception as e:
            return jsonify({
                "error_type": "ai_parsing_error",
                "error": f"استجاب الذكاء الاصطناعي ولكن حدث خطأ أثناء قراءة البيانات المستلمة: {str(e)}"
            }), 502

        # التحقق إذا ما أفاد الموديل بأن الصورة ليست واضحة أو لا تحتوي على وجبة
        if final_result.get("status") == "unclear":
            return jsonify({
                "error_type": "ai_unclear_image",
                "error": "عذراً، الصورة غير واضحة أو مظلمة، أو أنها لا تحتوي على وجبة طعام يمكن التعرف عليها. يرجى التقاط صورة أقرب وأوضح للوجبة."
            }), 400

        # إضافة اسم النموذج الناجح كمعلومة إضافية تظهر في لوحة التحكم (logs)
        final_result["processed_by"] = successful_model
        return jsonify(final_result)

    except Exception as e:
        print(f"Fatal System Error: {e}")
        return jsonify({
            "error_type": "internal_server_error",
            "error": f"حدث خطأ داخلي غير متوقع في خادم السيرفر: {str(e)}"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
