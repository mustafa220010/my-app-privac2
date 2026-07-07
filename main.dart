import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'ad_service.dart'; // هذا الملف الذي قمت بإنشائه

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await MobileAds.instance.initialize();
  
  // تحميل الإعلان عند بداية تشغيل التطبيق
  AdService.loadInterstitialAd();
  
  runApp(const MaterialApp(
    home: Scaffold(
      body: Center(child: Text("تطبيق الماكروز الخاص بي")),
    ),
  ));
}