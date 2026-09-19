import base64
import io
import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from groq import Groq
from PIL import Image, UnidentifiedImageError


app = Flask(__name__)
CORS(app)

groq_api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None


@app.route("/analyze", methods=["POST"])
def analyze_meal():
    try:
        if not client:
            return jsonify({
                "error_type": "server_configuration",
                "error": "مفتاح الذكاء الاصطناعي مفقود في إعدادات Render.",
            }), 500

        cooking_method = request.form.get(
            "cooking_method",
            request.form.get("cookingMethod", "غير محدد"),
        )
        protein_type = request.form.get("proteinType", "غير محدد")
        ingredients = request.form.get("ingredients", "[]")
        image_file = request.files.get("image")

        if not image_file or not image_file.filename:
            return jsonify({
                "error_type": "image_missing",
                "error": "لم يتم إرفاق صورة.",
            }), 400

        try:
            image_bytes = image_file.read()
            image = Image.open(io.BytesIO(image_bytes))

            if image.mode != "RGB":
                image = image.convert("RGB")

            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=85)
            base64_image = base64.b64encode(
                buffer.getvalue()
            ).decode("utf-8")

        except UnidentifiedImageError:
            return jsonify({
                "error_type": "image_invalid",
                "error": "الملف المرفق ليس صورة صالحة.",
            }), 400
        except Exception as error:
            return jsonify({
                "error_type": "image_processing",
                "error": str(error),
            }), 400

        prompt = f"""
أنت خبير تغذية. حلل صورة الوجبة بدقة.

طريقة الطبخ: {cooking_method}
نوع البروتين: {protein_type}
المكونات الإضافية: {ingredients}

أرجع JSON فقط، بدون أي نص إضافي، بهذا الشكل:
{{
  "status": "success",
  "calories": 0,
  "mealName": "اسم الوجبة بالعربية",
  "tipReduce": "نصيحة لتقليل السعرات",
  "tipVeggies": "نصيحة لإضافة الخضار"
}}

إذا كانت الصورة غير واضحة أو لا تحتوي على طعام:
{{
  "status": "unclear",
  "calories": 0,
  "mealName": "",
  "tipReduce": "",
  "tipVeggies": ""
}}
"""

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": (
                                f"data:image/jpeg;base64,"
                                f"{base64_image}"
                            ),
                        },
                    },
                ],
            },
        ]

        models_to_try = [
    "openai/gpt-oss-120b",
]
        ]

        response = None
        successful_model = None
        last_error = None

        for model_name in models_to_try:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.1,
                    max_tokens=600,
                )
                successful_model = model_name
                break

            except Exception as error:
                last_error = error
                print(
                    f"Groq model {model_name} failed: {error}",
                    flush=True,
                )

        if response is None:
            return jsonify({
                "error_type": "groq_api_error",
                "error": "فشل الاتصال بـ Groq.",
                "details": str(last_error),
            }), 502

        content = response.choices[0].message.content

        if not content:
            return jsonify({
                "error_type": "empty_ai_response",
                "error": "عاد رد فارغ من الذكاء الاصطناعي.",
            }), 502

        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            return jsonify({
                "error_type": "invalid_ai_response",
                "error": "رد الذكاء الاصطناعي ليس بصيغة JSON صحيحة.",
                "details": content,
            }), 502

        if result.get("status") == "unclear":
            return jsonify({
                "error_type": "ai_unclear_image",
                "error": "الصورة غير واضحة أو لا تحتوي على وجبة.",
            }), 400

        result["processed_by"] = successful_model
        return jsonify(result), 200

    except Exception as error:
        print(f"Unexpected server error: {error}", flush=True)

        return jsonify({
            "error_type": "internal_server_error",
            "error": str(error),
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
    )
