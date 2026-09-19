import base64
import io
import json
import os
import urllib.error
import urllib.request

from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, UnidentifiedImageError


app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.6-flash"


@app.get("/")
def home():
    return jsonify({
        "status": "ok",
        "message": "Smart Calories server is running",
    })


@app.post("/analyze")
def analyze_meal():
    if not GEMINI_API_KEY:
        return jsonify({
            "error_type": "server_configuration",
            "error": "مفتاح Gemini مفقود في إعدادات Render.",
        }), 500

    image_file = request.files.get("image")

    if not image_file or not image_file.filename:
        return jsonify({
            "error_type": "image_missing",
            "error": "لم يتم إرفاق صورة.",
        }), 400

    cooking_method = request.form.get(
        "cooking_method",
        request.form.get("cookingMethod", "غير محدد"),
    )

    protein_type = request.form.get(
        "proteinType",
        request.form.get("protein_type", "غير محدد"),
    )

    ingredients = request.form.get(
        "ingredients",
        request.form.get("extra_ingredients", "لا يوجد"),
    )

    try:
        original_bytes = image_file.read()

        image = Image.open(io.BytesIO(original_bytes))

        if image.mode != "RGB":
            image = image.convert("RGB")

        image_buffer = io.BytesIO()
        image.save(image_buffer, format="JPEG", quality=85)

        image_bytes = image_buffer.getvalue()
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

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
أنت خبير تغذية متخصص في تحليل صور الوجبات.

حلل صورة الوجبة وقدر السعرات الحرارية والمعلومات الغذائية.

طريقة الطبخ:
{cooking_method}

نوع البروتين:
{protein_type}

المكونات الإضافية:
{ingredients}

أرجع JSON فقط بدون أي شرح خارجي، بهذا الشكل:
{{
  "status": "success",
  "calories": 0,
  "mealName": "اسم الوجبة بالعربية",
  "tipReduce": "نصيحة لتقليل السعرات",
  "tipVeggies": "نصيحة لإضافة الخضار"
}}

القواعد:
- calories يجب أن يكون رقمًا فقط.
- mealName يجب أن يكون اسم الوجبة بالعربية.
- إذا كانت الصورة غير واضحة أو لا تحتوي على طعام، استخدم:
{{
  "status": "unclear",
  "calories": 0,
  "mealName": "",
  "tipReduce": "",
  "tipVeggies": ""
}}
"""

    request_body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    },
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_base64,
                        },
                    },
                ],
            },
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }

    api_url = (
        "https://generativelanguage.googleapis.com/"
        f"v1beta/models/{GEMINI_MODEL}:generateContent"
        f"?key={GEMINI_API_KEY}"
    )

    try:
        http_request = urllib.request.Request(
            api_url,
            data=json.dumps(request_body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(http_request, timeout=90) as response:
            raw_response = response.read().decode("utf-8")

        gemini_response = json.loads(raw_response)

    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")

        print(
            f"Gemini HTTP error {error.code}: {error_body}",
            flush=True,
        )

        return jsonify({
            "error_type": "gemini_api_error",
            "error": "فشل الاتصال بخدمة Gemini.",
            "details": error_body,
        }), 502

    except Exception as error:
        print(
            f"Gemini connection error: {error}",
            flush=True,
        )

        return jsonify({
            "error_type": "gemini_connection_error",
            "error": "تعذر الاتصال بخدمة Gemini.",
            "details": str(error),
        }), 502

    try:
        candidates = gemini_response.get("candidates", [])

        if not candidates:
            return jsonify({
                "error_type": "empty_ai_response",
                "error": "لم ترجع Gemini أي نتيجة.",
                "details": gemini_response,
            }), 502

        parts = candidates[0].get("content", {}).get("parts", [])

        response_text = ""

        for part in parts:
            if "text" in part:
                response_text += part["text"]

        if not response_text.strip():
            return jsonify({
                "error_type": "empty_ai_response",
                "error": "رد Gemini فارغ.",
            }), 502

        response_text = response_text.strip()

        if response_text.startswith("```"):
            response_text = response_text.replace("```json", "")
            response_text = response_text.replace("```", "")
            response_text = response_text.strip()

        result = json.loads(response_text)

    except json.JSONDecodeError:
        return jsonify({
            "error_type": "invalid_ai_response",
            "error": "رد Gemini ليس بصيغة JSON صحيحة.",
            "details": response_text,
        }), 502

    except Exception as error:
        return jsonify({
            "error_type": "response_processing_error",
            "error": str(error),
        }), 502

    if result.get("status") == "unclear":
        return jsonify({
            "error_type": "ai_unclear_image",
            "error": "الصورة غير واضحة أو لا تحتوي على وجبة.",
        }), 400

    return jsonify({
        "status": "success",
        "calories": result.get("calories", 0),
        "mealName": result.get("mealName", ""),
        "tipReduce": result.get("tipReduce", ""),
        "tipVeggies": result.get("tipVeggies", ""),
        "processed_by": GEMINI_MODEL,
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
    )
