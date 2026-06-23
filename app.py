from flask import Flask, request, jsonify
from flask_cors import CORS
# استدعاء مكتبة الذكاء الاصطناعي التي تستخدمها (مثال: مكتبة جوجل للذكاء الاصطناعي)
# import google.generativeai as genai 

app = Flask(__name__)
CORS(app) # للسماح للواجهة بالاتصال بالسيرفر

# هنا تضع مفتاح API الخاص بالذكاء الاصطناعي
# aistudio.google.com(AQ.Ab8RN6JusRQNZkrEO_eO0TCYFTN1aWrb8gKXQwf5uQ7wZocENA)

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # 1. استلام الصورة من التطبيق
        image_file = request.files.get('image')
        
        # 2. استلام البيانات المتقدمة من التطبيق
        cooking_method = request.form.get('cookingMethod')
        protein_type = request.form.get('proteinType')
        ingredients = request.form.get('ingredients') # يأتي كنص JSON

        # ==========================================
        # AQ.Ab8RN6JusRQNZkrEO_eO0TCYFTN1aWrb8gKXQwf5uQ7wZocENA
        # ==========================================
        
        # مثال وهمي لكيفية إرسال الطلب للذكاء الاصطناعي:
        # prompt = f"حلل هذه الوجبة. طريقة الطبخ: {cooking_method}، البروتين: {protein_type}، المكونات: {ingredients}. كم عدد السعرات؟"
        # response = model.generate_content([prompt, image_file])
        # ai_result = response.text
        
        # بعد أن يحلل الذكاء الاصطناعي الصورة، تقوم باستخراج الأرقام والنصائح
        # في هذا المثال سنضع أرقاماً افتراضية كأن الذكاء الاصطناعي قام بالرد:
        calculated_calories = 450 
        tip_reduce = "حاول تقليل كمية الزيت المستخدمة في القلي."
        tip_veggies = "إضافة طبق سلطة خضراء سيزيد من الألياف ويشعرك بالشبع."

        # 3. إرسال النتيجة النهائية لتظهر في التطبيق
        return jsonify({
            "calories": calculated_calories,
            "tipReduce": tip_reduce,
            "tipVeggies": tip_veggies
        })

    except Exception as e:
        print(f"Error: {e}")
        # إرجاع 0 في حال حدوث خطأ ليتعامل معها التطبيق ويظهر رسالة المشكلة
        return jsonify({"calories": 0})

if __name__ == '__main__':
    # تشغيل السيرفر على البورت 5000 ليتطابق مع كود التطبيق
    app.run(debug=True, port=5000)