import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'dart:convert';
import 'ad_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await MobileAds.instance.initialize();
  
  // تحميل إعلان الشاشة الكاملة في الخلفية
  AdService.loadInterstitialAd();
  
  runApp(const SmartCaloriesApp());
}

class SmartCaloriesApp extends StatelessWidget {
  const SmartCaloriesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'السعرات الذكي',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.green,
        scaffoldBackgroundColor: const Color(0xFFF4F7F6),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  File? _selectedImage;
  bool _isLoading = false;
  String _resultText = "التقط صورة للوجبة لمعرفة السعرات 🍏";
  
  // متغيرات الإعلانات
  BannerAd? _bannerAd;
  bool _isBannerLoaded = false;
  final ImagePicker _picker = ImagePicker();

  // 🔴 متغيرات الخيارات المتقدمة الجديدة
  bool _showAdvancedOptions = false;
  String _cookingMethod = 'مشوي';
  String _proteinType = 'دجاج';
  String? _subProteinType = 'صدور دجاج'; // النوع الفرعي للبروتين
  final TextEditingController _proteinWeightController = TextEditingController();
  final TextEditingController _extraIngredientsController = TextEditingController();

  // قوائم الأنواع الفرعية الذكية للحم والدجاج والسمك
  final Map<String, List<String>> _subProteinMap = {
    'دجاج': ['صدور دجاج', 'أفخاذ دجاج', 'أجنحة دجاج', 'شاورما دجاج', 'دجاج كامل مشوي'],
    'لحم': ['لحم غنم (خروف)', 'لحم بقري / عجل', 'لحم مفروم', 'ستيك لحم', 'كباب لحم'],
    'سمك': ['سلمون', 'تونة', 'هامور', 'شعور / كنعد', 'جمبري (روبيان)', 'سمك مشكل'],
    'بيض': ['بيض مسلوق', 'بيض مقلي', 'أومليت'],
  };

  @override
  void initState() {
    super.initState();
    _bannerAd = BannerAd(
      adUnitId: AdService.bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _isBannerLoaded = true;
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
    _bannerAd?.dispose();
    _proteinWeightController.dispose();
    _extraIngredientsController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
        _resultText = "تم التقاط الصورة! ادخل البيانات واضغط 'تحليل' 🚀";
      });
    }
  }

  Future<void> _analyzeMeal() async {
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء التقاط صورة أولاً!')),
      );
      return;
    }

    AdService.showInterstitialAd(() async {
      setState(() {
        _isLoading = true;
        _resultText = "جاري التحليل عبر الذكاء الاصطناعي... ⏳";
      });
      await _sendToServer();
    });
  }

  Future<void> _sendToServer() async {
    try {
      var request = http.MultipartRequest(
          'POST', Uri.parse('https://my-app-privac2-1.onrender.com/analyze'));
      
      request.files.add(await http.MultipartFile.fromPath('image', _selectedImage!.path));
      
      // 🔴 دمج نوع البروتين مع النوع الفرعي والوزن لإرساله للسيرفر
      String finalProteinData = _proteinType;
      if (_proteinType != 'بدون بروتين') {
        String subTypeStr = (_subProteinType != null && _subProteinType!.isNotEmpty) 
            ? ' (النوع بالتحديد: $_subProteinType)' : '';
        String weightStr = _proteinWeightController.text.isNotEmpty 
            ? ' (الوزن التقريبي: ${_proteinWeightController.text} جرام)' : '';
        finalProteinData = '$_proteinType$subTypeStr$weightStr';
      }

      request.fields['cooking_method'] = _cookingMethod;
      request.fields['proteinType'] = finalProteinData;
      request.fields['ingredients'] = _extraIngredientsController.text;
      
      var response = await request.send();
      
      if (response.statusCode == 200) {
        var responseData = await response.stream.bytesToString();
        var json = jsonDecode(responseData);
        setState(() {
          _resultText = "🔥 النتيجة:\n${json['calories']} سعرة حرارية\nالوجبة: ${json['mealName'] ?? 'غير معروف'}\n\nنصيحة: ${json['tipReduce'] ?? ''}";
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
    // التحقق مما إذا كان النوع المختار يمتلك قائمة أنواع فرعية
    List<String>? currentSubList = _subProteinMap[_proteinType];

    return Scaffold(
      appBar: AppBar(title: const Text('ماسح السعرات الذكي 🚀'), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // 1. مربع التقاط الصورة
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: Colors.green, width: 2),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: _selectedImage != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(13),
                        child: Image.file(_selectedImage!, fit: BoxFit.cover),
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.camera_alt, size: 50, color: Colors.green),
                          SizedBox(height: 10),
                          Text("اضغط هنا لتصوير الوجبة", style: TextStyle(fontSize: 16)),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 15),

            // 2. زر الخيارات المتقدمة
            SwitchListTile(
              title: const Text('⚙️ خيارات متقدمة (لدقة أعلى)', style: TextStyle(fontWeight: FontWeight.bold)),
              value: _showAdvancedOptions,
              activeColor: Colors.green,
              onChanged: (bool value) {
                setState(() {
                  _showAdvancedOptions = value;
                });
              },
            ),

            // 3. قسم الخيارات المتقدمة (يظهر فقط إذا تم تفعيل الزر)
            if (_showAdvancedOptions)
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                child: Padding(
                  padding: const EdgeInsets.all(15.0),
                  child: Column(
                    children: [
                      // طريقة الطبخ
                      DropdownButtonFormField<String>(
                        decoration: const InputDecoration(
                          labelText: 'طريقة الطبخ الأساسية',
                          prefixIcon: Icon(Icons.soup_kitchen_outlined),
                        ),
                        value: _cookingMethod,
                        items: ['مشوي', 'مسلوق', 'مقلي', 'في الفرن', 'بدون طبخ']
                            .map((label) => DropdownMenuItem(value: label, child: Text(label)))
                            .toList(),
                        onChanged: (value) => setState(() => _cookingMethod = value!),
                      ),
                      const SizedBox(height: 12),
                      
                      // نوع البروتين الأساسي
                      DropdownButtonFormField<String>(
                        decoration: const InputDecoration(
                          labelText: 'نوع البروتين الأساسي',
                          prefixIcon: Icon(Icons.restaurant_menu),
                        ),
                        value: _proteinType,
                        items: ['دجاج', 'لحم', 'سمك', 'بيض', 'نباتي', 'بدون بروتين']
                            .map((label) => DropdownMenuItem(value: label, child: Text(label)))
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            _proteinType = value!;
                            // تحديث النوع الفرعي تلقائياً بناءً على اختيار البروتين الجديد
                            if (_subProteinMap.containsKey(_proteinType)) {
                              _subProteinType = _subProteinMap[_proteinType]!.first;
                            } else {
                              _subProteinType = null;
                            }
                          });
                        },
                      ),
                      const SizedBox(height: 12),

                      // 🔴 قائمة النوع الفرعي (تظهر تلقائياً عند اختيار دجاج، لحم، سمك، أو بيض)
                      if (currentSubList != null)
                        Column(
                          children: [
                            DropdownButtonFormField<String>(
                              decoration: InputDecoration(
                                labelText: 'تحديد نوع $_proteinType بدقة',
                                prefixIcon: const Icon(Icons.set_meal_outlined, color: Colors.green),
                                border: const OutlineInputBorder(),
                              ),
                              value: _subProteinType,
                              items: currentSubList
                                  .map((label) => DropdownMenuItem(value: label, child: Text(label)))
                                  .toList(),
                              onChanged: (value) => setState(() => _subProteinType = value),
                            ),
                            const SizedBox(height: 12),
                          ],
                        ),

                      // 🔴 حقل الوزن (يظهر فقط إذا كان هناك بروتين)
                      if (_proteinType != 'بدون بروتين')
                        TextField(
                          controller: _proteinWeightController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'كم وزن البروتين تقريباً؟ (بالجرام)',
                            hintText: 'مثال: 150 أو 200',
                            prefixIcon: Icon(Icons.monitor_weight_outlined),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      
                      const SizedBox(height: 12),
                      // مكونات إضافية
                      TextField(
                        controller: _extraIngredientsController,
                        decoration: const InputDecoration(
                          labelText: 'مكونات إضافية في الوجبة (اختياري)',
                          hintText: 'مثال: أرز 100 جرام، زيت زيتون...',
                          prefixIcon: Icon(Icons.add_circle_outline),
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            
            const SizedBox(height: 15),
            
            // 4. عرض النتيجة
            Card(
              color: Colors.green.shade50,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: const BorderSide(color: Colors.green)),
              child: Padding(
                padding: const EdgeInsets.all(15.0),
                child: Text(
                  _resultText, 
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold), 
                  textAlign: TextAlign.center
                ),
              ),
            ),
            const SizedBox(height: 20),
            
            if (_isLoading) const CircularProgressIndicator(),
            const SizedBox(height: 10),
            
            // 5. زر التحليل
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _analyzeMeal,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                ),
                child: const Text('🔥 تحليل الوجبة الآن', style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
      
      // الإعلان في الأسفل
      bottomNavigationBar: _isBannerLoaded && _bannerAd != null
          ? Container(
              color: Colors.white,
              height: _bannerAd!.size.height.toDouble(),
              width: _bannerAd!.size.width.toDouble(),
              child: AdWidget(ad: _bannerAd!),
            )
          : const SizedBox(height: 0),
    );
  }
}
