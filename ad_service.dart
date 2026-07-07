import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService {
  static InterstitialAd? _interstitialAd;

  // 🔴 استخدمنا معرفات الاختبار لضمان ظهور الإعلانات وقت البرمجة
  static const String interstitialAdUnitId = 'ca-app-pub-3940256099942544/1033173712'; // إعلان بيني اختباري
  static const String bannerAdUnitId = 'ca-app-pub-3940256099942544/6300978111';     // إعلان بانر اختباري

  // --- تحميل الإعلان البيني (صفحة كاملة) ---
  static void loadInterstitialAd() {
    InterstitialAd.load(
      adUnitId: interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
        },
        onAdFailedToLoad: (error) {
          _interstitialAd = null;
        },
      ),
    );
  }

  // --- عرض الإعلان البيني ---
  static void showInterstitialAd(Function onComplete) {
    if (_interstitialAd == null) {
      onComplete(); // إذا لم يوجد إعلان جاهز، يتم تنفيذ الأمر (مثل التحليل) مباشرة
      return;
    }
    
    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        loadInterstitialAd(); // تحميل إعلان جديد للمرة القادمة
        onComplete();         // استكمال أمر التحليل
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        loadInterstitialAd();
        onComplete();
      },
    );
    
    _interstitialAd!.show();
    _interstitialAd = null;
  }
}
