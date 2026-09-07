import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../config/theme.dart';
import '../../providers/app_state.dart';
import '../../widgets/group_icon.dart';
import 'group_detail_screen.dart';

/// Screen shown when the app is opened via a group invite deep link.
///
/// Handles:
/// - Loading group info from Firestore.
/// - Already-a-member state.
/// - Join action → navigates to GroupDetailScreen.
/// - Error / not-found states.
class JoinGroupScreen extends StatefulWidget {
  final String groupId;

  const JoinGroupScreen({super.key, required this.groupId});

  @override
  State<JoinGroupScreen> createState() => _JoinGroupScreenState();
}

class _JoinGroupScreenState extends State<JoinGroupScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  _GroupInfo? _groupInfo;
  bool _loading = true;
  bool _joining = false;
  bool _joined = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _loadGroupInfo();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _loadGroupInfo() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('groups')
          .doc(widget.groupId.trim())
          .get();

      if (!doc.exists || doc.data() == null) {
        setState(() {
          _error = 'This invite link is invalid or has expired.';
          _loading = false;
        });
        return;
      }

      final data = doc.data()!;
      final memberIds = List<String>.from(data['memberIds'] ?? []);
      // Capture context before await to avoid async gap warning
      if (!mounted) return;
      final appState = Provider.of<AppState>(context, listen: false);
      final myId = appState.currentUser?.id ?? '';

      setState(() {
        _groupInfo = _GroupInfo(
          name: data['name']?.toString() ?? 'Group',
          emoji: data['emoji']?.toString() ?? '🧾',
          icon: data['icon']?.toString() ?? 'other',
          memberCount: memberIds.length,
          isAlreadyMember: myId.isNotEmpty && memberIds.contains(myId),
        );
        _loading = false;
      });
      _animController.forward();
    } catch (e) {
      setState(() {
        _error = 'Could not load group info. Please try again.';
        _loading = false;
      });
    }
  }

  Future<void> _joinGroup() async {
    setState(() { _joining = true; _error = null; });
    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final group = await appState.joinGroupByCode(widget.groupId.trim());
      if (group == null) throw Exception('Group not found');

      setState(() { _joined = true; _joining = false; });
      await Future.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;

      // Navigate to the group detail screen replacing this screen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => GroupDetailScreen(groupId: group.id)),
      );
    } catch (e) {
      setState(() {
        _error = 'Failed to join group. Please try again.';
        _joining = false;
      });
    }
  }

  void _goToDashboard() {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0FAF5),
      body: SafeArea(
        child: _loading
            ? const _LoadingState()
            : _error != null && _groupInfo == null
                ? _ErrorState(message: _error!, onDashboard: _goToDashboard)
                : _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    final info = _groupInfo!;
    final isAlreadyMember = info.isAlreadyMember;

    return FadeTransition(
      opacity: _fadeAnim,
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Group icon bubble
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(alpha: 0.12),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.25), width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: GroupIconWidget(icon: info.emoji.isNotEmpty ? info.emoji : info.icon, size: 40, padding: 0),
                ),
              ),
              const SizedBox(height: 20),

              // "You're invited" badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primaryAccent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.link2, size: 13, color: AppColors.primaryLight),
                    const SizedBox(width: 5),
                    Text(
                      'Group Invite',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryLight,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Group name
              Text(
                info.name,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryDark,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),

              // Member count
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.users, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 5),
                  Text(
                    '${info.memberCount} member${info.memberCount != 1 ? 's' : ''}',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    if (_joined) ...[
                      const Icon(LucideIcons.checkCircle2, size: 48, color: AppColors.primary),
                      const SizedBox(height: 12),
                      const Text(
                        'You\'ve joined!',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Opening group...',
                        style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ] else if (isAlreadyMember) ...[
                      const Icon(LucideIcons.checkCircle2, size: 48, color: AppColors.primary),
                      const SizedBox(height: 12),
                      const Text(
                        'You\'re already a member',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _joining ? null : () => _openGroup(),
                          icon: const Icon(LucideIcons.arrowRight, size: 18),
                          label: const Text('Open Group'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                    ] else ...[
                      const Icon(LucideIcons.userPlus, size: 40, color: AppColors.primary),
                      const SizedBox(height: 12),
                      const Text(
                        'You\'ve been invited!',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Tap "Join Group" to start splitting expenses with this group.',
                        style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                      ],
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _joining ? null : _joinGroup,
                          icon: _joining
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(LucideIcons.users, size: 18),
                          label: Text(_joining ? 'Joining...' : 'Join Group'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),
              TextButton(
                onPressed: _goToDashboard,
                child: const Text('Go to Dashboard', style: TextStyle(color: AppColors.textSecondary)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openGroup() async {
    setState(() { _joining = true; });
    await Future.delayed(const Duration(milliseconds: 200));
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => GroupDetailScreen(groupId: widget.groupId.trim())),
    );
  }
}

// ─── Helper model ───────────────────────────────────────────────
class _GroupInfo {
  final String name;
  final String emoji;
  final String icon;
  final int memberCount;
  final bool isAlreadyMember;

  const _GroupInfo({
    required this.name,
    required this.emoji,
    required this.icon,
    required this.memberCount,
    required this.isAlreadyMember,
  });
}

// ─── Sub-widgets ────────────────────────────────────────────────

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withValues(alpha: 0.1),
            ),
            child: const Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Loading invite...', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onDashboard;

  const _ErrorState({required this.message, required this.onDashboard});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.red.withValues(alpha: 0.1),
              ),
              child: const Icon(LucideIcons.alertCircle, size: 36, color: Colors.redAccent),
            ),
            const SizedBox(height: 16),
            const Text(
              'Invalid Invite',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primaryDark),
            ),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13), textAlign: TextAlign.center),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onDashboard,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Go to Dashboard'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
