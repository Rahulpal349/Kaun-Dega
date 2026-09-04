import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../config/theme.dart';
import '../../providers/app_state.dart';
import '../../models/group_model.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../widgets/group_icon.dart';
import '../group/new_group_screen.dart';
import '../group/group_detail_screen.dart';
import '../history/history_screen.dart';
import '../profile/profile_screen.dart';
import '../auth/login_screen.dart';
import '../../widgets/skeleton_loader.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentTabIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppState>(context, listen: false).refreshDashboard();
    });
  }

  void _onTabChanged(int index) {
    if (index == _currentTabIndex) return;
    setState(() => _currentTabIndex = index);
  }

  void _confirmSignOut() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to sign out of Kaun Dega?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final appState = Provider.of<AppState>(context, listen: false);
              await appState.logout();
              if (!mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.negative,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  void _showGroupOptions(GroupModel group) {
    final isAdmin = group.myRole == 'admin';

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.cardBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                group.name,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(LucideIcons.arrowRight, color: AppColors.primary),
                title: const Text('Open Ledger', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => GroupDetailScreen(groupId: group.id)),
                  );
                },
              ),
              if (isAdmin)
                ListTile(
                  leading: const Icon(LucideIcons.trash2, color: AppColors.negative),
                  title: const Text('Delete Group Ledger', style: TextStyle(color: AppColors.negative, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Permanently deletes all expenses and balances'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (dCtx) => AlertDialog(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        title: const Text('Delete Group?'),
                        content: Text('Are you sure you want to delete "${group.name}"? This cannot be undone.'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(dCtx, false), child: const Text('Cancel')),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(dCtx, true),
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.negative),
                            child: const Text('Delete'),
                          ),
                        ],
                      ),
                    );

                    if (confirm == true) {
                      if (!mounted) return;
                      await Provider.of<AppState>(context, listen: false).deleteGroup(group.id);
                    }
                  },
                )
              else
                ListTile(
                  leading: const Icon(LucideIcons.logOut, color: AppColors.negative),
                  title: const Text('Leave Group', style: TextStyle(color: AppColors.negative, fontWeight: FontWeight.w600)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await Provider.of<AppState>(context, listen: false).leaveGroup(group.id);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showJoinGroupDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Join a Group', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter or paste an invite code or link to join an existing ledger.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'e.g. g_12345 or link',
                prefixIcon: Icon(LucideIcons.link, size: 18),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () async {
              String input = controller.text.trim();
              if (input.isNotEmpty) {
                if (input.contains('/join/')) {
                  input = input.split('/join/').last.split('?').first.split('#').first.trim();
                }
                Navigator.pop(ctx);
                final appState = Provider.of<AppState>(context, listen: false);
                final joinedGroup = await appState.joinGroupByCode(input);
                if (mounted) {
                  if (joinedGroup != null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Joined "${joinedGroup.name}"!'), behavior: SnackBarBehavior.floating),
                    );
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => GroupDetailScreen(groupId: joinedGroup.id)),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Invalid invite code or group not found.'), behavior: SnackBarBehavior.floating),
                    );
                  }
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBody(int index) {
    switch (index) {
      case 0:
        return _buildLedgersTab();
      case 1:
        return const HistoryScreen();
      case 2:
        return const ProfileScreen();
      default:
        return _buildLedgersTab();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        layoutBuilder: (currentChild, previousChildren) {
          return Stack(
            alignment: Alignment.topCenter,
            children: <Widget>[
              ...previousChildren,
              if (currentChild != null) currentChild,
            ],
          );
        },
        transitionBuilder: (child, animation) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0.015, 0),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            ),
          );
        },
        child: KeyedSubtree(
          key: ValueKey<int>(_currentTabIndex),
          child: _buildTabBody(_currentTabIndex),
        ),
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentTabIndex,
        onTap: _onTabChanged,
      ),
      floatingActionButton: _currentTabIndex == 0
          ? FloatingActionButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const NewGroupScreen()),
                );
              },
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: const Icon(LucideIcons.plus, size: 26),
            )
          : null,
    );
  }

  Widget _buildLedgersTab() {
    final appState = Provider.of<AppState>(context);
    final user = appState.currentUser;
    final groups = appState.groups;
    final consolidatedBal = appState.consolidatedBalance;
    final totalSpent = appState.totalSpent;

    if (appState.isLoading && groups.isEmpty) {
      return const SafeArea(child: DashboardSkeleton());
    }

    return RefreshIndicator(
      onRefresh: () => appState.refreshDashboard(),
      color: AppColors.primary,
      child: CustomScrollView(
        slivers: [
          // SaaS Style Header
          SliverAppBar(
            pinned: true,
            expandedHeight: 80,
            backgroundColor: AppColors.background,
            surfaceTintColor: Colors.transparent,
            title: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(LucideIcons.wallet, size: 18, color: AppColors.primary),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Kaun Dega?',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    Text(
                      'Hi, ${user?.name.split(' ').first ?? 'Friend'} 👋',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              IconButton(
                onPressed: _confirmSignOut,
                icon: const Icon(LucideIcons.logOut, size: 20, color: AppColors.textMuted),
                tooltip: 'Sign Out',
              ),
              const SizedBox(width: 8),
            ],
          ),

          // Main Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Consolidated Balance Hero Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF145C4B), Color(0xFF0E382F)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.25),
                          blurRadius: 24,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'NET BALANCE',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                                color: Colors.white.withValues(alpha: 0.7),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    consolidatedBal > 0
                                        ? LucideIcons.arrowDownLeft
                                        : consolidatedBal < 0
                                            ? LucideIcons.arrowUpRight
                                            : LucideIcons.check,
                                    size: 13,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    consolidatedBal > 0
                                        ? 'You get'
                                        : consolidatedBal < 0
                                            ? 'You owe'
                                            : 'Settled',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          '${consolidatedBal >= 0 ? '+' : ''}₹${consolidatedBal.abs().toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -1,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.receipt, size: 14, color: AppColors.primaryAccent),
                              const SizedBox(width: 6),
                              Text(
                                'Total Shared Spending: ₹${totalSpent.toStringAsFixed(2)}',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.9),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Active Ledgers Section Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Your Ledgers',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.3,
                        ),
                      ),
                      Row(
                        children: [
                          TextButton.icon(
                            onPressed: _showJoinGroupDialog,
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            icon: const Icon(LucideIcons.link, size: 14, color: AppColors.primary),
                            label: const Text('Join Code', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 12.5)),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${groups.length} ${groups.length == 1 ? 'group' : 'groups'}',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  if (groups.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: const BoxDecoration(
                              color: AppColors.positiveBg,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.users, size: 30, color: AppColors.primary),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'No ledgers yet',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Create a group to start splitting expenses with friends, flatmates or colleagues.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const NewGroupScreen()),
                              );
                            },
                            icon: const Icon(LucideIcons.plus, size: 18),
                            label: const Text('Create First Group'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: groups.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final g = groups[index];
                        final isAdmin = g.myRole == 'admin';

                        return Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => GroupDetailScreen(groupId: g.id),
                                ),
                              );
                            },
                            onLongPress: () => _showGroupOptions(g),
                            borderRadius: BorderRadius.circular(22),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(color: AppColors.cardBorder),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  GroupIconWidget(
                                    icon: g.icon,
                                    size: 22,
                                    padding: 12,
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Flexible(
                                              child: Text(
                                                g.name,
                                                style: const TextStyle(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w700,
                                                  color: AppColors.textPrimary,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            if (isAdmin) ...[
                                              const SizedBox(width: 6),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: AppColors.amberBg,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: const Text(
                                                  'ADMIN',
                                                  style: TextStyle(
                                                    fontSize: 8.5,
                                                    fontWeight: FontWeight.w800,
                                                    color: AppColors.amber,
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            const Icon(LucideIcons.users, size: 12, color: AppColors.textMuted),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${g.memberIds.length} members',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textSecondary,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(LucideIcons.moreVertical, size: 18, color: AppColors.textMuted),
                                    onPressed: () => _showGroupOptions(g),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
