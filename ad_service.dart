import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService {
  // معرفات الاختبار الخاصة بجوجل (تظهر دائماً إعلانات تجريبية)
  static const String interstitialAdUnitId = 'ca-app-pub-3940256099942544/1033173712'; // إعلان بيني تجريبي
  static const String bannerAdUnitId = 'ca-app-pub-3940256099942544/6300978111';     // إعلان بانر تجريبي
  
  // --- تحميل الإعلان البيني (صفحة كاملة) ---
  static void loadInterstitialAd() {
    InterstitialAd.load(
      adUnitId: interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) => _interstitialAd = ad,
        onAdFailedToLoad: (error) => _interstitialAd = null,
      ),
    );
  }

  // --- عرض الإعلان البيني ---
  static void showInterstitialAd(Function onComplete) {
    if (_interstitialAd == null) {
      onComplete(); // إذا لم يوجد إعلان جاهز، يتم الانتقال مباشرة
      return;
    }
    
    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        loadInterstitialAd(); // تجهيز إعلان جديد للمرة القادمة
        onComplete();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        loadInterstitialAd();
        onComplete();
      },
    );
    
    _interstitialAd!.show();
    _interstitialAd = null; // تفريغ المتغير بعد العرض لتجنب التكرار
  }

  // --- إنشاء كود البانر (لإضافته في الواجهة) ---
  static BannerAd createBannerAd() {
    return BannerAd(
      adUnitId: bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: const BannerAdListener(),
    );
  }
}
