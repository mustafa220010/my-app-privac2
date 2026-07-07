import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService {
  static InterstitialAd? _interstitialAd;

  // معرفات الإعلانات الخاصة بك (البينية والبانر)
  static const String interstitialAdUnitId = 'ca-app-pub-2531938319579823/4955412380';
  static const String bannerAdUnitId = 'ca-app-pub-2531938319579823/7231709058';

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