import os
import io
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from PIL import Image, UnidentifiedImageError

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        if not client:
            return jsonify({
                "error_type": "server_configuration",
                "error": "مفتاح الذكاء الاصطناعي مفقود في إعدادات Render."
            }), 500

        cooking_method = request.form.get('cooking_method', 'غير محدد')
        protein_type = request.form.get('proteinType', 'غير محدد')
        ingredients_json = request.form.get('ingredients', '[]')
        image_file = request.files.get('image')

        if not image_file or image_file.filename == '':
            return jsonify({
                "error_type": "image_missing",
                "error": "لم يتم إرفاق صورة."
            }), 400

        try:
            image_bytes = image_file.read()
            img_object = Image.open(io.BytesIO(image_bytes))
            
            if img_object.mode != 'RGB':
                img_object = img_object.convert('RGB')
            
            buffered = io.BytesIO()
            img_object.save(buffered, format="JPEG", quality=85)
            base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
        except UnidentifiedImageError:
            return jsonify({"error_type": "image_invalid", "error": "الملف ليس صورة صالحة."}), 400
        except Exception as e:
            return jsonify({"error_type": "image_processing", "error": str(e)}), 400

        prompt = f"""
أنت خبير تغذية ذكي. حلل الوجبة في الصورة.
- طريقة الطبخ: {cooking_method}
- نوع البروتين: {protein_type}
- مكونات إضافية: {ingredients_json}

إذا كانت الصورة غير واضحة أو ليست طعاماً، اجعل "status" هي "unclear".
إذا تعرفت عليها، اجعل "status" هي "success".
أرجع JSON فقط بهذا الهيكل:
{{
  "status": "success أو unclear",
  "calories": 0, 
  "mealName": "اسم الوجبة بالعربية",
  "tipReduce": "نصيحة لتقليل السعرات",
  "tipVeggies": "نصيحة لإضافة خضار"
}}
"""
        messages = [
            {"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}]}
        ]

        models_to_try = [
            "llama-3.2-11b-vision-preview",
            "meta-llama/llama-4-scout-17b-16e-instruct",
            "qwen/qwen3.6-27b"
        ]
        
        response = None
        successful_model = None
        
        for model_name in models_to_try:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                successful_model = model_name
                break
            except Exception:
                continue

        if not response:
            return jsonify({"error_type": "groq_api_error", "error": "فشل الاتصال بـ Groq عبر جميع النماذج."}), 502

        final_result = json.loads(response.choices[0].message.content)

        if final_result.get("status") == "unclear":
            return jsonify({"error_type": "ai_unclear_image", "error": "الصورة غير واضحة كوجبة طعام."}), 400

        final_result["processed_by"] = successful_model
        return jsonify(final_result)

    except Exception as e:
        return jsonify({"error_type": "internal_server_error", "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
