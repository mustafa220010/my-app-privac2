import os
import io
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image

app = Flask(__name__)
CORS(app)

# ضع مفتاحك هنا، وتأكد أنه يبدأ بـ AIza
MY_API_KEY = "AIzaAQ.Ab8RN6JxEk1upEmHg_qEPWBrYE2B0ARb-JCIOfhLGK8Q_TUTlw" 

genai.configure(api_key=MY_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    # هذا الكود هو المسؤول عن معالجة البيانات
    return jsonify({"status": "Server is running"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
