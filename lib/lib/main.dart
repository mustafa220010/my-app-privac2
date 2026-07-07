import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'dart:convert';
import 'ad_service.dart'; // استدعاء ملف الإعلانات

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await MobileAds.instance.initialize();
  
  // تحميل الإعلان البيني (الشاشة الكاملة) مسبقاً
  AdService.loadInterstitialAd();
  
  runApp(const SmartCaloriesApp());
}

class SmartCaloriesApp extends StatelessWidget {
  const SmartCaloriesApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'السعرات الذكي',
      debugShowCheckedModeBanner: false,
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
  
  // متغيرات البانر
  BannerAd? _bannerAd;
  bool _isBannerLoaded = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadBannerAd(); // استدعاء البانر عند فتح الصفحة
  }

  // --- دالة تجهيز البانر ---
  void _loadBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: AdService.bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _isBannerLoaded = true; // 🔴 هذا هو السر لكي يظهر الإعلان فجأة
          });
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose(); // تنظيف الذاكرة
    super.dispose();
  }

  // --- دالة التقاط الصورة ---
  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
        _resultText = "تم اختيار الصورة! اضغط 'تحليل' 🚀";
      });
    }
  }

  // --- دالة التحليل (التي تظهر إعلان الشاشة الكاملة) ---
  Future<void> _analyzeMeal() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء التقاط صورة أولاً!')),
      );
      return;
    }

    // 🔴 إظهار إعلان الصفحة الكاملة أولاً، ثم إرسال الصورة للسيرفر
    AdService.showInterstitialAd(() async {
      setState(() {
        _isLoading = true;
        _resultText = "جاري التحليل... ⏳";
      });
      await _sendToServer(); // استدعاء السيرفر بعد إغلاق الإعلان
    });
  }

  // --- دالة إرسال البيانات للسيرفر ---
  Future<void> _sendToServer() async {
    try {
      var request = http.MultipartRequest(
          'POST', Uri.parse('https://my-app-privac2-1.onrender.com/analyze'));
      
      request.files.add(await http.MultipartFile.fromPath('image', _selectedImage!.path));
      var response = await request.send();
      
      if (response.statusCode == 200) {
        var responseData = await response.stream.bytesToString();
        var json = jsonDecode(responseData);
        setState(() {
          _resultText = "النتيجة: ${json['calories']} سعرة حرارية 🔥";
        });
      } else {
        setState(() { _resultText = "حدث خطأ في السيرفر ❌"; });
      }
    } catch (e) {
      setState(() { _resultText = "تأكد من اتصالك بالإنترنت 🌐"; });
    } finally {
      setState(() { _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('السعرات الذكي 🍏')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
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
            Text(_resultText, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            if (_isLoading) const CircularProgressIndicator(),
            const SizedBox(height: 20),
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
      // 🔴 مكان ظهور البانر في أسفل الشاشة
      bottomNavigationBar: _isBannerLoaded && _bannerAd != null
          ? SizedBox(
              height: _bannerAd!.size.height.toDouble(),
              width: _bannerAd!.size.width.toDouble(),
              child: AdWidget(ad: _bannerAd!),
            )
          : const SizedBox(height: 0), // لا نعرض شيئاً إذا لم يتحمل البانر بعد
    );
  }
}
