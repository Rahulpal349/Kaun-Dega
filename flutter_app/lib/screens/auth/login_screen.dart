import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../config/theme.dart';
import '../../providers/app_state.dart';
import '../dashboard/dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;
  String? _errorMessage;

  // Phone OTP States
  int _selectedTab = 0; // 0: Google, 1: Phone
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final String _countryCode = '+91';
  bool _isOtpSent = false;
  String? _verificationId;
  bool _isPhoneLoading = false;
  String? _phoneError;

  late final TapGestureRecognizer _termsRecognizer;
  late final TapGestureRecognizer _privacyRecognizer;

  @override
  void initState() {
    super.initState();
    _termsRecognizer = TapGestureRecognizer()..onTap = () => _showTermsModal(context);
    _privacyRecognizer = TapGestureRecognizer()..onTap = () => _showPrivacyModal(context);
  }

  @override
  void dispose() {
    _termsRecognizer.dispose();
    _privacyRecognizer.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _showTermsModal(BuildContext context) {
    _showLegalModal(
      context,
      title: 'Terms of Service',
      icon: LucideIcons.fileText,
      sections: const [
        {
          'title': '1. Acceptance of Terms',
          'content':
              'By accessing and using Kaun Dega?, you acknowledge and agree to comply with these Terms of Service. If you disagree with any part of these terms, please discontinue using the service.',
        },
        {
          'title': '2. Description of the Service',
          'content':
              'Kaun Dega provides collaborative tools to record, track, calculate, and simplify group expenses. Kaun Dega is an informational expense ledger and settlement calculator — it does not directly process or hold banking funds.',
        },
        {
          'title': '3. User Accounts & Google Auth',
          'content':
              'You access the Service securely via Google Authentication or Verified Mobile OTP. You are responsible for safeguarding your account credentials and for all activities under your account.',
        },
        {
          'title': '4. Accurate Information',
          'content':
              'You agree to enter accurate expense records and use the application solely for lawful purposes among friends, flatmates, and travel groups.',
        },
      ],
    );
  }

  void _showPrivacyModal(BuildContext context) {
    _showLegalModal(
      context,
      title: 'Privacy Policy',
      icon: LucideIcons.shieldCheck,
      sections: const [
        {
          'title': '1. Information We Collect',
          'content':
              'When you sign in to Kaun Dega?, we collect basic profile details (name, email, profile photo, phone number). We also securely store expense entries, group memberships, and settlement notes that you create in the app.',
        },
        {
          'title': '2. How We Use Your Data',
          'content':
              'Your information is solely used to calculate shared expenses, synchronize group ledgers in real-time, generate settlement reports, and provide an effortless expense tracking experience.',
        },
        {
          'title': '3. Data Sharing & Security',
          'content':
              'Expense records and group memberships are shared exclusively with members of the specific groups you join. We do not sell or monetize your personal data. All network communications are encrypted via TLS/HTTPS.',
        },
      ],
    );
  }

  void _showLegalModal(
    BuildContext context, {
    required String title,
    required IconData icon,
    required List<Map<String, String>> sections,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.78,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const Text(
                          'Last updated: September 2026',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    icon: const Icon(LucideIcons.x, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.grey.shade100,
                      foregroundColor: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.cardBorder),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: sections.length,
                separatorBuilder: (_, __) => const SizedBox(height: 18),
                itemBuilder: (ctx, i) {
                  final sec = sections[i];
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        sec['title'] ?? '',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        sec['content'] ?? '',
                        style: const TextStyle(
                          fontSize: 13,
                          height: 1.45,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('I Understand', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final success = await appState.loginWithGoogle();
      if (!mounted) return;
      if (success) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      }
    } catch (e) {
      final err = e.toString();
      if (!mounted) return;
      if (err.contains('ApiException') ||
          err.contains('10:') ||
          err.contains('sign_in_failed') ||
          err.contains('com.google.android.gms') ||
          err.contains('DEVELOPER_ERROR') ||
          err.contains('PlatformException')) {
        _showGoogleSetupDialog(context);
      } else {
        setState(() {
          _errorMessage = 'Google Sign-In: $err';
        });
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSendPhoneOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 8) {
      setState(() => _phoneError = 'Please enter a valid mobile number');
      return;
    }

    setState(() {
      _isPhoneLoading = true;
      _phoneError = null;
    });

    final fullPhone = _countryCode + phone;
    final appState = Provider.of<AppState>(context, listen: false);

    await appState.sendPhoneOtp(
      phoneNumber: fullPhone,
      onCodeSent: (verId) {
        if (!mounted) return;
        setState(() {
          _isPhoneLoading = false;
          _isOtpSent = true;
          _verificationId = verId;
        });
      },
      onError: (err) {
        if (!mounted) return;
        final lower = err.toLowerCase();
        String userFriendlyError = err;

        if (lower.contains('quota') ||
            lower.contains('limit') ||
            lower.contains('too-many-requests') ||
            lower.contains('blocked') ||
            lower.contains('exceeded') ||
            lower.contains('10/day')) {
          userFriendlyError =
              'SMS daily quota limit reached (10 SMS/day).\n\nPlease sign in with Google instead, then add your mobile number in Profile settings.';
        }

        setState(() {
          _isPhoneLoading = false;
          _phoneError = userFriendlyError;
        });
      },
    );
  }

  Future<void> _handleVerifyPhoneOtp() async {
    final code = _otpController.text.trim();
    if (code.length != 6) {
      setState(() => _phoneError = 'Please enter full 6-digit OTP code');
      return;
    }

    setState(() {
      _isPhoneLoading = true;
      _phoneError = null;
    });

    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final success = await appState.verifyPhoneOtp(
        verificationId: _verificationId!,
        smsCode: code,
      );

      if (!mounted) return;
      if (success) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isPhoneLoading = false;
        _phoneError = 'Invalid OTP verification code. Please check and try again.';
      });
    }
  }

  void _showGoogleSetupDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(LucideIcons.alertCircle, color: AppColors.primary, size: 22),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Google Sign-In Setup',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: const Text(
          'Google Sign-In requires your app SHA-1 fingerprint to be registered in Firebase Console.\n\nAlternatively, you can test with Phone OTP or Guest mode.',
          style: TextStyle(fontSize: 13, height: 1.45),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final stateError = Provider.of<AppState>(context).error;

    return Scaffold(
      backgroundColor: const Color(0xFF092921),
      body: Stack(
        children: [
          // Elegant Deep Background Gradient Glows
          Positioned(
            top: -140,
            left: -100,
            child: Container(
              width: 440,
              height: 440,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF10B981).withValues(alpha: 0.25),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -120,
            right: -80,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF2DD4BF).withValues(alpha: 0.18),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Brand Header
                    Container(
                      margin: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        children: [
                          // Glowing Logo Avatar
                          Container(
                            width: 86,
                            height: 86,
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFF34D399), Color(0xFF059669)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.35),
                                  blurRadius: 24,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Color(0xFF0E382F),
                                shape: BoxShape.circle,
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(40),
                                child: Image.asset(
                                  'assets/images/logo.png',
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => Container(
                                    color: AppColors.primary,
                                    child: const Center(
                                      child: Text(
                                        'KD',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 26,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Kaun Dega?',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.6,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Split bills & settle debts with friends in seconds',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.75),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Glassmorphic Authentication Card
                    Container(
                      constraints: const BoxConstraints(maxWidth: 420),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.35),
                            blurRadius: 50,
                            offset: const Offset(0, 20),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Segmented Auth Mode Switcher with Smooth Sliding Pill Animation
                          Container(
                            height: 48,
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: LayoutBuilder(
                              builder: (context, constraints) {
                                final pillWidth = (constraints.maxWidth) / 2;
                                return Stack(
                                  children: [
                                    // Sliding White Pill Indicator
                                    AnimatedPositioned(
                                      duration: const Duration(milliseconds: 300),
                                      curve: Curves.fastOutSlowIn,
                                      left: _selectedTab == 0 ? 0 : pillWidth,
                                      top: 0,
                                      bottom: 0,
                                      width: pillWidth,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(12),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.08),
                                              blurRadius: 8,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Tab Buttons
                                    Row(
                                      children: [
                                        Expanded(
                                          child: GestureDetector(
                                            onTap: () {
                                              setState(() {
                                                _selectedTab = 0;
                                                _errorMessage = null;
                                                _phoneError = null;
                                              });
                                            },
                                            behavior: HitTestBehavior.opaque,
                                            child: Container(
                                              alignment: Alignment.center,
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  AnimatedScale(
                                                    scale: _selectedTab == 0 ? 1.1 : 1.0,
                                                    duration: const Duration(milliseconds: 200),
                                                    curve: Curves.easeOutBack,
                                                    child: Icon(
                                                      LucideIcons.chrome,
                                                      size: 16,
                                                      color: _selectedTab == 0 ? AppColors.primary : AppColors.textMuted,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  AnimatedDefaultTextStyle(
                                                    duration: const Duration(milliseconds: 200),
                                                    style: TextStyle(
                                                      fontSize: 13.5,
                                                      fontWeight: FontWeight.w700,
                                                      color: _selectedTab == 0 ? AppColors.textPrimary : AppColors.textMuted,
                                                    ),
                                                    child: const Text('Google'),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: GestureDetector(
                                            onTap: () {
                                              setState(() {
                                                _selectedTab = 1;
                                                _errorMessage = null;
                                                _phoneError = null;
                                              });
                                            },
                                            behavior: HitTestBehavior.opaque,
                                            child: Container(
                                              alignment: Alignment.center,
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  AnimatedScale(
                                                    scale: _selectedTab == 1 ? 1.1 : 1.0,
                                                    duration: const Duration(milliseconds: 200),
                                                    curve: Curves.easeOutBack,
                                                    child: Icon(
                                                      LucideIcons.phone,
                                                      size: 16,
                                                      color: _selectedTab == 1 ? AppColors.primary : AppColors.textMuted,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  AnimatedDefaultTextStyle(
                                                    duration: const Duration(milliseconds: 200),
                                                    style: TextStyle(
                                                      fontSize: 13.5,
                                                      fontWeight: FontWeight.w700,
                                                      color: _selectedTab == 1 ? AppColors.textPrimary : AppColors.textMuted,
                                                    ),
                                                    child: const Text('Phone OTP'),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Error Display
                          if (_errorMessage != null || _phoneError != null || stateError != null) ...[
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.negativeBg,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.negative.withValues(alpha: 0.3)),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    _phoneError ?? _errorMessage ?? stateError!,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                      color: AppColors.negative,
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w600,
                                      height: 1.4,
                                    ),
                                  ),
                                  if ((_phoneError ?? '').contains('Google')) ...[
                                    const SizedBox(height: 12),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton.icon(
                                        onPressed: () {
                                          setState(() {
                                            _selectedTab = 0;
                                            _phoneError = null;
                                            _errorMessage = null;
                                          });
                                        },
                                        icon: const Icon(LucideIcons.chrome, size: 16),
                                        label: const Text('Switch to Google Sign-In', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.primary,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          elevation: 0,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          // TAB 0: GOOGLE SIGN-IN
                          if (_selectedTab == 0) ...[
                            // Features overview
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.positiveBg.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.cardBorder),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(LucideIcons.zap, size: 11, color: Colors.white),
                                      ),
                                      const SizedBox(width: 10),
                                      const Expanded(
                                        child: Text(
                                          '1-Tap Secure Google Authentication',
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(LucideIcons.checkCircle2, size: 11, color: Colors.white),
                                      ),
                                      const SizedBox(width: 10),
                                      const Expanded(
                                        child: Text(
                                          'Auto-syncs group ledgers & WhatsApp share',
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _handleGoogleSignIn,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: AppColors.textPrimary,
                                  elevation: 0,
                                  side: const BorderSide(color: AppColors.cardBorder, width: 1.5),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                ),
                                child: _isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Image.asset(
                                            'assets/images/google_logo.png',
                                            width: 20,
                                            height: 20,
                                            fit: BoxFit.contain,
                                            errorBuilder: (_, __, ___) => Image.network(
                                              'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png',
                                              width: 20,
                                              height: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          const Text(
                                            'Continue with Google',
                                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ]
                          // TAB 1: PHONE OTP SIGN-IN
                          else ...[
                            if (!_isOtpSent) ...[
                              const Text(
                                'Mobile Number',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: AppColors.cardBorder, width: 1.5),
                                      borderRadius: BorderRadius.circular(16),
                                      color: Colors.grey.shade50,
                                    ),
                                    child: Text(
                                      _countryCode,
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: TextField(
                                      controller: _phoneController,
                                      keyboardType: TextInputType.phone,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                                      decoration: InputDecoration(
                                        hintText: '9876543210',
                                        prefixIcon: const Icon(LucideIcons.phone, size: 18, color: AppColors.textMuted),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(16),
                                          borderSide: const BorderSide(color: AppColors.cardBorder, width: 1.5),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(16),
                                          borderSide: const BorderSide(color: AppColors.primary, width: 2),
                                        ),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: _isPhoneLoading ? null : _handleSendPhoneOtp,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                    elevation: 0,
                                  ),
                                  child: _isPhoneLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                        )
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'Send OTP Code',
                                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                            ),
                                            SizedBox(width: 8),
                                            Icon(LucideIcons.arrowRight, size: 18),
                                          ],
                                        ),
                                ),
                              ),
                            ] else ...[
                              Text(
                                'Enter 6-digit code sent to $_countryCode${_phoneController.text.trim()}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 14),
                              TextField(
                                controller: _otpController,
                                keyboardType: TextInputType.number,
                                maxLength: 6,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 10,
                                  color: AppColors.primary,
                                ),
                                decoration: InputDecoration(
                                  counterText: '',
                                  hintText: '123456',
                                  hintStyle: TextStyle(
                                    letterSpacing: 8,
                                    color: Colors.grey.shade300,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(color: AppColors.cardBorder, width: 1.5),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(color: AppColors.primary, width: 2),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
                                ),
                              ),
                              const SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: _isPhoneLoading ? null : _handleVerifyPhoneOtp,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                    elevation: 0,
                                  ),
                                  child: _isPhoneLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                        )
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'Verify & Sign In',
                                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                            ),
                                            SizedBox(width: 8),
                                            Icon(LucideIcons.checkCircle2, size: 18),
                                          ],
                                        ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Center(
                                child: TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _isOtpSent = false;
                                      _phoneError = null;
                                      _otpController.clear();
                                    });
                                  },
                                  child: const Text(
                                    'Change Phone Number',
                                    style: TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],

                          const SizedBox(height: 20),
                          const Divider(color: AppColors.cardBorder, height: 1),
                          const SizedBox(height: 16),

                          // Legal Terms Footer
                          Text.rich(
                            TextSpan(
                              text: 'By signing in, you agree to our ',
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: AppColors.textMuted,
                                height: 1.45,
                              ),
                              children: [
                                TextSpan(
                                  text: 'Terms of Service',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                    decoration: TextDecoration.underline,
                                    decorationColor: AppColors.primary,
                                  ),
                                  recognizer: _termsRecognizer,
                                ),
                                const TextSpan(text: ' and '),
                                TextSpan(
                                  text: 'Privacy Policy',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                    decoration: TextDecoration.underline,
                                    decorationColor: AppColors.primary,
                                  ),
                                  recognizer: _privacyRecognizer,
                                ),
                                const TextSpan(text: '.'),
                              ],
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                    Text(
                      '© ${DateTime.now().year} Kaun Dega? • All rights reserved.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.5),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
