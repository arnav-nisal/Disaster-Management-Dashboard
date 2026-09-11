import 'package:flutter/material.dart';
import 'welcome_screen.dart';
import 'services/storage_service.dart';

class IncidentReportScreen extends StatefulWidget {
  final String? userName;
  final String? userRole;

  const IncidentReportScreen({
    super.key,
    this.userName,
    this.userRole,
  });

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen>
    with TickerProviderStateMixin {
  String _name = '';
  String _role = 'Civilian';
  bool _isLoading = true;

  late final AnimationController _entranceController;
  late final Animation<Offset> _bannerSlide;
  late final Animation<double> _bannerFade;
  late final Animation<Offset> _titleSlide;
  late final Animation<double> _titleFade;
  late final List<Animation<Offset>> _tileSlides;
  late final List<Animation<double>> _tileFades;
  late final Animation<double> _infoFade;
  late final Animation<Offset> _infoSlide;

  @override
  void initState() {
    super.initState();

    _entranceController = AnimationController(
      duration: const Duration(milliseconds: 900),
      vsync: this,
    );

    // Banner: 0-450ms
    _bannerSlide = Tween<Offset>(
      begin: const Offset(0, -0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.45, curve: Curves.easeOutCubic),
    ));
    _bannerFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.35, curve: Curves.easeOut),
    ));

    // Title: 200-550ms
    _titleSlide = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.20, 0.55, curve: Curves.easeOutCubic),
    ));
    _titleFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.20, 0.50, curve: Curves.easeOut),
    ));

    // Staggered cascade for category tiles (380-860ms)
    const tileIntervals = [
      Interval(0.38, 0.68, curve: Curves.easeOutCubic),
      Interval(0.44, 0.74, curve: Curves.easeOutCubic),
      Interval(0.50, 0.80, curve: Curves.easeOutCubic),
      Interval(0.56, 0.86, curve: Curves.easeOutCubic),
    ];
    _tileSlides = tileIntervals.map((interval) {
      return Tween<Offset>(
        begin: const Offset(0, 0.18),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: _entranceController, curve: interval));
    }).toList();

    _tileFades = tileIntervals.map((interval) {
      return Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(parent: _entranceController, curve: interval));
    }).toList();

    // Info: 650-1000ms
    _infoSlide = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.65, 1.0, curve: Curves.easeOutCubic),
    ));
    _infoFade = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.65, 0.95, curve: Curves.easeOut),
    ));

    _loadUserData();
  }

  @override
  void dispose() {
    _entranceController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    if (widget.userName != null && widget.userRole != null) {
      setState(() {
        _name = widget.userName!;
        _role = widget.userRole!;
        _isLoading = false;
      });
      _entranceController.forward();
      return;
    }

    final storage = StorageService.instance;
    final savedName = await storage.getUserName() ?? 'Unknown Person';
    final savedRole = await storage.getUserRole() ?? 'Civilian';
    if (!mounted) return;
    setState(() {
      _name = savedName;
      _role = savedRole;
      _isLoading = false;
    });
    _entranceController.forward();
  }

  Future<void> _handleLogout() async {
    final storage = StorageService.instance;
    await storage.logout();

    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 400),
        pageBuilder: (context, animation, secondaryAnimation) =>
            const WelcomeScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isFirstResponder = _role == 'First Responder';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.dashboard_rounded,
                    color: Color(0xFFEF4444), size: 18),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Incident Dashboard',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    fontSize: 18,
                  ),
                ),
              ),
            ],
          ),
          actions: [
            Container(
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF131B2E),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: IconButton(
                tooltip: 'Logout',
                icon: const Icon(Icons.logout_rounded,
                    color: Color(0xFF94A3B8), size: 19),
                onPressed: _handleLogout,
              ),
            ),
          ],
        ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(
                    valueColor:
                        AlwaysStoppedAnimation<Color>(Color(0xFFEF4444)),
                    strokeWidth: 2.5,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Loading dashboard…',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            )
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── User Welcome Banner ──
                    SlideTransition(
                      position: _bannerSlide,
                      child: FadeTransition(
                        opacity: _bannerFade,
                        child: _buildWelcomeBanner(isFirstResponder),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // ── Section Title ──
                    SlideTransition(
                      position: _titleSlide,
                      child: FadeTransition(
                        opacity: _titleFade,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 4,
                                  height: 22,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEF4444),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'Report an Emergency',
                                    style:
                                        theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Padding(
                              padding: const EdgeInsets.only(left: 14),
                              child: Text(
                                'Select an emergency category to begin an incident report.',
                                style:
                                    theme.textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Category Grid (Staggered Cascading Tiles) ──
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.0,
                      children: [
                        SlideTransition(
                          position: _tileSlides[0],
                          child: FadeTransition(
                            opacity: _tileFades[0],
                            child: _buildActionTile(
                              icon: Icons.local_fire_department_rounded,
                              title: 'Fire / Hazard',
                              subtitle: 'Blaze, gas leak, explosion',
                              color: const Color(0xFFFB923C),
                            ),
                          ),
                        ),
                        SlideTransition(
                          position: _tileSlides[1],
                          child: FadeTransition(
                            opacity: _tileFades[1],
                            child: _buildActionTile(
                              icon: Icons.water_drop_rounded,
                              title: 'Flood / Water',
                              subtitle: 'Overflow, storm surge',
                              color: const Color(0xFF38BDF8),
                            ),
                          ),
                        ),
                        SlideTransition(
                          position: _tileSlides[2],
                          child: FadeTransition(
                            opacity: _tileFades[2],
                            child: _buildActionTile(
                              icon: Icons.medical_services_rounded,
                              title: 'Medical Aid',
                              subtitle: 'Injury, first aid needed',
                              color: const Color(0xFFF87171),
                            ),
                          ),
                        ),
                        SlideTransition(
                          position: _tileSlides[3],
                          child: FadeTransition(
                            opacity: _tileFades[3],
                            child: _buildActionTile(
                              icon: Icons.night_shelter_rounded,
                              title: 'Safe Shelters',
                              subtitle: 'Nearby refuge points',
                              color: const Color(0xFF4ADE80),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Status Info Card with Live Radar Pulse ──
                    SlideTransition(
                      position: _infoSlide,
                      child: FadeTransition(
                        opacity: _infoFade,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF131B2E),
                            borderRadius: BorderRadius.circular(16),
                            border:
                                Border.all(color: const Color(0xFF1E293B)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isFirstResponder
                                      ? const Color(0xFFEF4444)
                                          .withValues(alpha: 0.12)
                                      : const Color(0xFF60A5FA)
                                          .withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  isFirstResponder
                                      ? Icons.cell_tower_rounded
                                      : Icons.info_outline_rounded,
                                  color: isFirstResponder
                                      ? const Color(0xFFEF4444)
                                      : const Color(0xFF60A5FA),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            isFirstResponder
                                                ? 'Dispatch Active'
                                                : 'Safety Advisory',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        _LiveRadarBeacon(
                                          color: isFirstResponder
                                              ? const Color(0xFFEF4444)
                                              : const Color(0xFF22C55E),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      isFirstResponder
                                          ? 'Priority alerts will trigger immediate push notifications.'
                                          : 'Follow instructions from local emergency personnel.',
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(
                                        color: const Color(0xFF94A3B8),
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
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
      );
  }

  Widget _buildWelcomeBanner(bool isFirstResponder) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isFirstResponder
              ? [const Color(0xFF7F1D1D), const Color(0xFFB91C1C)]
              : [const Color(0xFF1E3A5F), const Color(0xFF1D4ED8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isFirstResponder
                    ? const Color(0xFFDC2626)
                    : const Color(0xFF2563EB))
                .withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar with subtle ring
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
                width: 2,
              ),
            ),
            child: CircleAvatar(
              radius: 24,
              backgroundColor: Colors.white.withValues(alpha: 0.15),
              child: Icon(
                isFirstResponder
                    ? Icons.local_hospital_rounded
                    : Icons.person_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome, $_name',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: isFirstResponder
                              ? const Color(0xFFFCA5A5)
                              : const Color(0xFF93C5FD),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          _role.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10.5,
                            letterSpacing: 1.3,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
  }) {
    return _InteractiveActionTile(
      icon: icon,
      title: title,
      subtitle: subtitle,
      color: color,
      onTap: () async {
        await StorageService.instance.logIncident(
          category: title,
          description: subtitle,
        );

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(icon, color: Colors.white, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Selected: $title',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF1E293B),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            duration: const Duration(seconds: 2),
          ),
        );
      },
    );
  }
}

class _InteractiveActionTile extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _InteractiveActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  State<_InteractiveActionTile> createState() => _InteractiveActionTileState();
}

class _InteractiveActionTileState extends State<_InteractiveActionTile> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _isPressed ? 0.95 : 1.0,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOutCubic,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: widget.onTap,
          onTapDown: (_) => setState(() => _isPressed = true),
          onTapUp: (_) => setState(() => _isPressed = false),
          onTapCancel: () => setState(() => _isPressed = false),
          borderRadius: BorderRadius.circular(18),
          splashColor: widget.color.withValues(alpha: 0.16),
          highlightColor: widget.color.withValues(alpha: 0.08),
          child: Ink(
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: _isPressed
                    ? widget.color.withValues(alpha: 0.6)
                    : const Color(0xFF1E293B),
                width: _isPressed ? 1.5 : 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
                if (_isPressed)
                  BoxShadow(
                    color: widget.color.withValues(alpha: 0.2),
                    blurRadius: 16,
                  ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: widget.color.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: widget.color.withValues(alpha: 0.2),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Icon(widget.icon, color: widget.color, size: 22),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.title,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    widget.subtitle,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10.5,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LiveRadarBeacon extends StatefulWidget {
  final Color color;
  const _LiveRadarBeacon({required this.color});

  @override
  State<_LiveRadarBeacon> createState() => _LiveRadarBeaconState();
}

class _LiveRadarBeaconState extends State<_LiveRadarBeacon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    )..repeat();

    _scale = Tween<double>(begin: 1.0, end: 2.4).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutQuad),
    );
    _opacity = Tween<double>(begin: 0.8, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutQuad),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: SizedBox(
        width: 14,
        height: 14,
        child: Stack(
          alignment: Alignment.center,
          children: [
            AnimatedBuilder(
              animation: _controller,
              builder: (context, _) => Transform.scale(
                scale: _scale.value,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: widget.color.withValues(alpha: _opacity.value * 0.5),
                  ),
                ),
              ),
            ),
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color,
                boxShadow: [
                  BoxShadow(
                    color: widget.color.withValues(alpha: 0.6),
                    blurRadius: 4,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
