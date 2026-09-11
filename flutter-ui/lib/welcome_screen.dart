import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'incident_report_screen.dart';
import 'services/storage_service.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with TickerProviderStateMixin {
  final TextEditingController _nameController = TextEditingController();

  static const List<String> _roleOptions = ['Civilian', 'First Responder'];
  String _selectedRole = 'Civilian';
  bool _isSaving = false;

  // --- Animation controllers ---
  late final AnimationController _entranceController;
  late final AnimationController _pulseController;
  late final AnimationController _buttonGlowController;

  // Staggered entrance animations
  late final Animation<double> _iconScale;
  late final Animation<double> _iconFade;
  late final Animation<Offset> _titleSlide;
  late final Animation<double> _titleFade;
  late final Animation<Offset> _subtitleSlide;
  late final Animation<double> _subtitleFade;
  late final Animation<Offset> _cardSlide;
  late final Animation<double> _cardFade;
  late final Animation<double> _footerFade;

  // Continuous pulse
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();

    // Entrance stagger: 900ms total
    _entranceController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    // Icon: 0-400ms  scale bounce + fade
    _iconScale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.15), weight: 70),
      TweenSequenceItem(tween: Tween(begin: 1.15, end: 1.0), weight: 30),
    ]).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.45, curve: Curves.easeOut),
    ));
    _iconFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.25, curve: Curves.easeOut),
    ));

    // Title: 150-500ms
    _titleSlide = Tween<Offset>(
      begin: const Offset(0, 0.25),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.15, 0.50, curve: Curves.easeOutCubic),
    ));
    _titleFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.15, 0.45, curve: Curves.easeOut),
    ));

    // Subtitle: 250-600ms
    _subtitleSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.25, 0.55, curve: Curves.easeOutCubic),
    ));
    _subtitleFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.25, 0.50, curve: Curves.easeOut),
    ));

    // Card: 350-800ms
    _cardSlide = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.35, 0.80, curve: Curves.easeOutCubic),
    ));
    _cardFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.35, 0.70, curve: Curves.easeOut),
    ));

    // Footer: 700-1000ms
    _footerFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.70, 1.0, curve: Curves.easeOut),
    ));

    // Continuous subtle pulse on the shield icon
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2400),
      vsync: this,
    );
    _pulse = Tween<double>(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _pulseController.repeat(reverse: true);

    // Button glow sweep
    _buttonGlowController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat();

    _loadSavedProfile();
    _entranceController.forward();
  }

  Future<void> _loadSavedProfile() async {
    try {
      final storage = StorageService.instance;
      final savedName = await storage.getUserName();
      final savedRole = await storage.getUserRole();
      if (!mounted) return;
      if (savedName != null &&
          savedName.isNotEmpty &&
          savedName != 'Unknown Person') {
        _nameController.text = savedName;
      }
      if (savedRole != null && _roleOptions.contains(savedRole)) {
        setState(() => _selectedRole = savedRole);
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _nameController.dispose();
    _entranceController.dispose();
    _pulseController.dispose();
    _buttonGlowController.dispose();
    super.dispose();
  }

  Future<void> _handleContinue() async {
    setState(() => _isSaving = true);

    try {
      final rawName = _nameController.text.trim();
      final name = rawName.isEmpty ? 'Unknown Person' : rawName;
      final role = _selectedRole;

      final storage = StorageService.instance;
      await storage.saveUser(name: name, role: role);

      if (!mounted) return;

      await Navigator.of(context).push(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 500),
          reverseTransitionDuration: const Duration(milliseconds: 400),
          pageBuilder: (context, animation, secondaryAnimation) =>
              IncidentReportScreen(
            userName: name,
            userRole: role,
          ),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: CurvedAnimation(
                parent: animation,
                curve: Curves.easeOut,
              ),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.04, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutCubic,
                )),
                child: child,
              ),
            );
          },
        ),
      );
      if (mounted) _loadSavedProfile();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save: $e'),
          backgroundColor: const Color(0xFF991B1B),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isFirstResponder = _selectedRole == 'First Responder';
    final screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // Ambient gradient glow behind icon (isolated repaint layer)
          Positioned(
            top: -50,
            left: screenWidth / 2 - 120,
            child: RepaintBoundary(
              child: FadeTransition(
                opacity: _iconFade,
                child: Container(
                  width: 240,
                  height: 240,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFFDC2626).withValues(alpha: 0.12),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20.0, vertical: 12.0),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.center,
                  child: SizedBox(
                    width: math.min(screenWidth - 40, 420.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // ── Brand Emblem with isolated pulse layer ──
                        FadeTransition(
                          opacity: _iconFade,
                          child: ScaleTransition(
                            scale: _iconScale,
                            child: Center(
                              child: RepaintBoundary(
                                child: ScaleTransition(
                                  scale: _pulse,
                                  child: Container(
                                    width: 58,
                                    height: 58,
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [
                                          Color(0xFFDC2626),
                                          Color(0xFFEA580C),
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFDC2626)
                                              .withValues(alpha: 0.4),
                                          blurRadius: 20,
                                          spreadRadius: 1,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.shield_outlined,
                                      color: Colors.white,
                                      size: 32,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),

                          // ── Title ──
                          SlideTransition(
                            position: _titleSlide,
                            child: FadeTransition(
                              opacity: _titleFade,
                              child: Text(
                                'Disaster Relief Portal',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 22,
                                  color: Colors.white,
                                  letterSpacing: -0.5,
                                  height: 1.2,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),

                          // ── Subtitle ──
                          SlideTransition(
                            position: _subtitleSlide,
                            child: FadeTransition(
                              opacity: _subtitleFade,
                              child: Text(
                                'Rapid incident reporting & emergency response',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF94A3B8),
                                  fontSize: 12.5,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // ── Form Card ──
                          SlideTransition(
                            position: _cardSlide,
                            child: FadeTransition(
                              opacity: _cardFade,
                              child: _buildFormCard(theme, isFirstResponder),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // ── Footer ──
                          FadeTransition(
                            opacity: _footerFade,
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 7),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF131B2E),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                      color: const Color(0xFF1E293B)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF22C55E),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Flexible(
                                      child: Text(
                                        'Emergency Hotline: 911 / 112',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style:
                                            theme.textTheme.bodySmall?.copyWith(
                                          color: const Color(0xFF94A3B8),
                                          fontWeight: FontWeight.w500,
                                          fontSize: 11.5,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormCard(ThemeData theme, bool isFirstResponder) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF131B2E),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF1E293B),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: const Color(0xFFDC2626).withValues(alpha: 0.04),
            blurRadius: 40,
            spreadRadius: -10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Name Input ──
          const Text(
            'YOUR NAME',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Color(0xFF64748B),
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            style: const TextStyle(color: Colors.white, fontSize: 14.5),
            cursorColor: const Color(0xFFEF4444),
            decoration: InputDecoration(
              hintText: 'Enter your Name',
              hintStyle: const TextStyle(color: Color(0xFF475569)),
              prefixIcon: const Icon(Icons.person_outline_rounded,
                  color: Color(0xFF64748B), size: 19),
              suffixIcon: const Tooltip(
                message: 'Leave blank to continue as Unknown Person',
                child: Icon(Icons.help_outline_rounded,
                    color: Color(0xFF475569), size: 17),
              ),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF1E293B)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: Color(0xFFEF4444), width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Optional — defaults to "Unknown Person"',
            style: TextStyle(
              fontSize: 10.5,
              color: Color(0xFF475569),
              fontStyle: FontStyle.italic,
            ),
          ),

          const SizedBox(height: 14),

          // ── Role Toggle ──
          const Text(
            'SELECT ROLE',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Color(0xFF64748B),
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          _buildRoleToggle(),
          const SizedBox(height: 8),

          // Role info banner
          AnimatedContainer(
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: isFirstResponder
                  ? const Color(0xFF2A0D0D)
                  : const Color(0xFF0C1B30),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isFirstResponder
                    ? const Color(0xFF7F1D1D)
                    : const Color(0xFF1E3A5F),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isFirstResponder
                      ? Icons.verified_user_rounded
                      : Icons.explore_rounded,
                  size: 15,
                  color: isFirstResponder
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF60A5FA),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: Text(
                      isFirstResponder
                          ? 'Dispatch channels, priority alerts & coordination.'
                          : 'Report incidents, get help & find safe shelters.',
                      key: ValueKey(_selectedRole),
                      style: TextStyle(
                        fontSize: 11,
                        height: 1.3,
                        color: isFirstResponder
                            ? const Color(0xFFFECACA)
                            : const Color(0xFFBFDBFE),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Continue Button with animated glow (isolated repaint layer) ──
          RepaintBoundary(
            child: AnimatedBuilder(
              animation: _buttonGlowController,
              builder: (context, child) {
                return Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFDC2626).withValues(
                          alpha: 0.25 +
                              0.15 *
                                  math.sin(
                                      _buttonGlowController.value * 2 * math.pi),
                        ),
                        blurRadius: 18,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: child,
                );
              },
              child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _handleContinue,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor:
                      const Color(0xFFDC2626).withValues(alpha: 0.5),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: _isSaving
                      ? const SizedBox(
                          key: ValueKey('loading'),
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.0,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Row(
                          key: ValueKey('label'),
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Continue',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.3,
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward_rounded, size: 17),
                          ],
                        ),
                ),
              ),
            ),
          ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleToggle() {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final halfWidth = constraints.maxWidth / 2;
          final isCivilian = _selectedRole == 'Civilian';

          return Stack(
            children: [
              // Animated selection indicator
              AnimatedPositioned(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                left: isCivilian ? 3 : halfWidth + 1,
                top: 3,
                bottom: 3,
                width: halfWidth - 4,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isCivilian
                          ? [
                              const Color(0xFF1E3A5F),
                              const Color(0xFF1E3A8A),
                            ]
                          : [
                              const Color(0xFF7F1D1D),
                              const Color(0xFF991B1B),
                            ],
                    ),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: (isCivilian
                                ? const Color(0xFF2563EB)
                                : const Color(0xFFDC2626))
                            .withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),

              // Role buttons
              Row(
                children: _roleOptions.map((role) {
                  final isSelected = _selectedRole == role;
                  final isResp = role == 'First Responder';
                  return Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => setState(() => _selectedRole = role),
                      child: Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              isResp
                                  ? Icons.emergency_rounded
                                  : Icons.people_outline_rounded,
                              size: 15,
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFF64748B),
                            ),
                            const SizedBox(width: 5),
                            Flexible(
                              child: Text(
                                role,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? Colors.white
                                      : const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}
