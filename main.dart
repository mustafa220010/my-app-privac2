import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'dart:io';
import 'dart:convert';
import 'ad_service.dart'; // ملف الإعلانات الخاص بك

void main() async {
 WidgetsFlutterBinding.ensureInitialized();
  void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await MobileAds.instance.initialize();

  // تفعيل جهاز الاختبار لضمان ظهور الإعلانات
  MobileAds.instance.updateRequestConfiguration(
  RequestConfiguration(
    testDeviceIds: ['B3EEABB8EE11C2BE770B684D95219ECB'], // هذا معرف اختبار عالمي
    ),
  );
  
  AdService.loadInterstitialAd(); // تحميل الإعلان
  runApp(const SmartCaloriesApp());
}
  await MobileAds.instance.initialize();
  
  // تحميل الإعلان مسبقاً
  AdService.loadInterstitialAd();
  
  runApp(const SmartCaloriesApp());
}

class SmartCaloriesApp extends StatelessWidget {
  const SmartCaloriesApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'تطبيق السعرات الذكي',
      debugShowCheckedModeBanner: false, // إخفاء علامة التجربة
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  File? _selectedImage;
  bool _isLoading = false;
  String _resultText = "التقط صورة لمعرفة السعرات 📸";

  final ImagePicker _picker = ImagePicker();

  // 1. دالة التقاط الصورة
  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
        _resultText = "تم اختيار الصورة! اضغط على 'تحليل' 🚀";
      });
    }
  }

  // 2. دالة التحليل (تدمج الإعلان + إرسال الصورة للسيرفر)
  Future<void> _analyzeMeal() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء التقاط صورة أولاً!')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _resultText = "جاري التحليل... ⏳";
    });

    // إظهار الإعلان أولاً، ثم تنفيذ كود السيرفر بعد إغلاقه
    AdService.showInterstitialAd(() async {
      await _sendToServer();
    });
  }

  // 3. دالة إرسال الصورة لسيرفرك (الذي برمجته بالبايثون)
  Future<void> _sendToServer() async {
    try {
      // رابط سيرفرك المرفوع على Render
      var request = http.MultipartRequest(
          'POST', Uri.parse('https://my-app-privac2-1.onrender.com/analyze'));
      
      request.files.add(
          await http.MultipartFile.fromPath('image', _selectedImage!.path));

      var response = await request.send();
      
      if (response.statusCode == 200) {
        var responseData = await response.stream.bytesToString();
        var json = jsonDecode(responseData);
        setState(() {
          // عرض النتيجة التي يرسلها السيرفر
          _resultText = "النتيجة: ${json['calories']} سعرة حرارية 🔥";
        });
      } else {
        setState(() {
          _resultText = "حدث خطأ في السيرفر ❌";
        });
      }
    } catch (e) {
      setState(() {
        _resultText = "تأكد من اتصالك بالإنترنت 🌐";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // إعداد كود البانر الإعلاني
    BannerAd? bannerAd = AdService.createBannerAd()..load();

    return Scaffold(
      appBar: AppBar(title: const Text('السعرات الذكي 🍏')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // عرض الصورة
            Container(
              height: 250,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.blueAccent, width: 2),
                borderRadius: BorderRadius.circular(15),
              ),
              child: _selectedImage != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(13),
                      child: Image.file(_selectedImage!, fit: BoxFit.cover),
                    )
                  : const Center(child: Text("لا توجد صورة", style: TextStyle(fontSize: 18))),
            ),
            const SizedBox(height: 20),
            
            // النص أو النتيجة
            Text(_resultText, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            
            // مؤشر التحميل
            if (_isLoading) const CircularProgressIndicator(),
            const SizedBox(height: 20),
            
            // أزرار التحكم
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _pickImage,
                    child: const Text('📸 التقاط صورة'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _analyzeMeal,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    child: const Text('🔥 تحليل الوجبة'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      // إعلان البانر في أسفل الشاشة
      bottomNavigationBar: SizedBox(
        height: 50,
        child: AdWidget(ad: bannerAd),
      ),
    );
  }
}
