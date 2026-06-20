import 'package:flutter/ Berry.dart'; // تأكد من استخدام حزمة Flutter المناسبة

void main() {
  runApp(CalorieCounterApp());
}

class CalorieCounterApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: HomeScreen(),
    );
  }
}

// 1. الشاشة الرئيسية
class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('حاسب السعرات الذكي')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton.icon(
              icon: Icon(Icons.camera_alt),
              label: Text('1. تصوير لحسب السعرات'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => CameraScreen())),
              style: ElevatedButton.styleFrom(padding: EdgeInsets.all(20)),
            ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              icon: Icon(Icons.settings),
              label: Text('2. الإعدادات'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => SettingsScreen())),
              style: ElevatedButton.styleFrom(padding: EdgeInsets.all(20)),
            ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              icon: Icon(Icons.help_outline),
              label: Text('3. كيفية حسبة السعرات وطريقة الاستخدام'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => InstructionsScreen())),
              style: ElevatedButton.styleFrom(padding: EdgeInsets.all(20)),
            ),
          ],
        ),
      ),
    );
  }
}

// 2. شاشة التصوير والخيارات المتقدمة
class CameraScreen extends StatefulWidget {
  @override
  _CameraScreenState createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  bool showAdvanced = false;
  final TextEditingController meatController = TextEditingController();
  final TextEditingController otherController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('تحليل الوجبة')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            // مكان الصورة
            Container(
              height: 200,
              color: Colors.grey[300],
              child: Center(child: Icon(Icons.image, size: 50, color: Colors.grey[700])),
            ),
            SizedBox(height: 20),
            ElevatedButton(onPressed: () {}, child: Text('التقط صورة أو اختر من المعرض')),
            Divider(height: 40),
            
            // زر تشغيل الخيارات المتقدمة الاختيارية
            Row(
              children: [
                Checkbox(
                  value: showAdvanced,
                  onChanged: (val) {
                    setState(() { showAdvanced = val!; });
                  },
                ),
                Text('إضافة خيارات متقدمة (أوزان دقيقة)'),
              ],
            ),
            
            // الخيارات المتقدمة تظهر فقط عند تفعيل الخيار
            if (showAdvanced) ...[
              TextField(
                controller: meatController,
                decoration: InputDecoration(labelText: 'وزن الدجاج أو اللحم (بالجرام)'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: otherController,
                decoration: InputDecoration(labelText: 'وزن المكونات الأخرى (أرز، بطاطس...)'),
                keyboardType: TextInputType.number,
              ),
            ],
            SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                // هنا يتم إرسال الصورة والبيانات للـ API
              },
              child: Text('احسب السعرات الآن'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            )
          ],
        ),
      ),
    );
  }
}

// 3. شاشة الإعدادات
class SettingsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('الإعدادات'), leading: BackButton()),
      body: ListView(
        children: [
          ListTile(
            title: Text('تغيير اللغة / Change Language'),
            trailing: Icon(Icons.language),
            onTap: () {
              // منطق تحويل اللغة
            },
          ),
        ],
      ),
    );
  }
}

// 4. شاشة التعليمات
class InstructionsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('طريقة الاستخدام')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Text(
          'مرحباً بك في تطبيق حسبة السعرات!\n\n'
          '1. يمكنك الاعتماد الفوري على تصوير الوجبة فقط، وسيقوم الذكاء الاصطناعي بتقدير السعرات تقريبياً.\n\n'
          '2. للحصول على حسبة مؤكدة ودقيقة جداً، قم بتفعيل "الخيارات المتقدمة" وأدخل أوزان المكونات الأساسية مثل اللحوم أو الدجاج بالجرام، وسيدمج التطبيق الصورة مع الأوزان ليعطيك النتيجة الأدق.',
          style: TextStyle(fontSize: 16, height: 1.5),
        ),
      ),
    );
  }
}