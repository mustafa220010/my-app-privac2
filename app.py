from flask import Flask, request, jsonify
from flask_cors import CORS

# إذا كنت تستخدم Gemini أو أي مكتبة ذكاء اصطناعي قم بتفعيل هذا السطر
# import google.generativeai as genai 

app = Flask(__name__)
CORS(app) # السماح للواجهة بالاتصال بهذا السيرفر بدون مشاكل

# genai.configure(AQ.Ab8RN6JusRQNZkrEO_eO0TCYFTN1aWrb8gKXQwf5uQ7wZocENA)

@app.route('/analyze', methods=['POST'])
def analyze_meal():
    try:
        # استلام البيانات من التطبيق
        image_file = request.files.get('image')
        cooking_method = request.form.get('cookingMethod')
        protein_type = request.form.get('proteinType')
        ingredients = request.form.get('ingredients')

        # =======================================================
        # AQ.Ab8RN6JusRQNZkrEO_eO0TCYFTN1aWrb8gKXQwf5uQ7wZocENA
        # =======================================================
        
        # مثال وهمي لكيفية إرجاع البيانات المطلوبة:
        # تقوم بجعل الذكاء الاصطناعي يستخرج هذه القيم بناءً على الصورة
        
        calculated_calories = 000 # ضع هنا متغير السعرات المرتجع من الذكاء الاصطناعي
        identified_meal_name = "دجاج مشوي مع خضار" # إذا لم يعرفها اجعلها فارغة هكذا ""
        tip_reduce = "استخدم رذاذ الزيت بدلاً من صبه لتقليل السعرات."
        tip_veggies = "إضافة البروكلي المسلوق ستزيد من الألياف الصحية في الوجبة."

        # إرجاع النتيجة لتظهر في ملف index.html
        return jsonify({
            "calories": calculated_calories,
            "mealName": identified_meal_name, 
            "tipReduce": tip_reduce,
            "tipVeggies": tip_veggies
        })

    except Exception as e:
        print(f"Error: {e}")
        # إرجاع 0 في حالة وجود خطأ ليقوم التطبيق بعرض بطاقة المشكلة
        return jsonify({"calories": 0})

if __name__ == '__main__':
    # تشغيل السيرفر على البورت 5000 ليتصل به التطبيق
    app.run(debug=True, port=5000)
