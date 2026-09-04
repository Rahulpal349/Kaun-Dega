import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/app_state.dart';
import '../../models/expense_model.dart';
import '../../widgets/group_icon.dart';
import '../../services/share_service.dart';
import '../../services/balance_service.dart';
import 'add_expense_screen.dart';
import 'new_group_screen.dart';
import 'group_report_screen.dart';
import 'settle_modal.dart';
import '../../widgets/skeleton_loader.dart';

class GroupDetailScreen extends StatefulWidget {
  final String groupId;

  const GroupDetailScreen({super.key, required this.groupId});

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  int _selectedTab = 0; // 0: Expenses, 1: Balance
  String _expenseSort = 'recent'; // 'recent' | 'highest' | 'lowest'
  String? _expandedExpenseId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppState>(context, listen: false).loadGroupDetails(widget.groupId);
    });
  }

  void _shareOnWhatsapp() {
    final appState = Provider.of<AppState>(context, listen: false);
    final group = appState.activeGroup;
    final report = appState.activeBalanceReport;
    final inviteCode = widget.groupId;

    final text = BalanceService.buildWhatsappText(
      group?.name ?? 'Kaun Dega?',
      report.moves,
      inviteCode: inviteCode,
    );
    ShareService.shareToWhatsapp(text);
  }

  void _showAddOfflineMemberDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Add Offline Member', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Add a friend or colleague by name to split expenses with them right now.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'e.g. Rahul, Aman',
                prefixIcon: Icon(LucideIcons.userPlus, size: 18),
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
              final name = controller.text.trim();
              if (name.isNotEmpty) {
                Navigator.pop(ctx);
                await Provider.of<AppState>(context, listen: false).addShadowMemberToActiveGroup(name);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Add Member'),
          ),
        ],
      ),
    );
  }

  void _showInviteModal() {
    final appState = Provider.of<AppState>(context, listen: false);
    final group = appState.activeGroup;
    final inviteCode = widget.groupId;
    final inviteUrl = ShareService.getInviteUrl(inviteCode);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.cardBorder, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 16),
              const Text(
                'Invite Members',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                'Share this join link or code with friends to invite them to "${group?.name}".',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('INVITE LINK', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.8)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            inviteUrl,
                            style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w600, fontSize: 12.5, color: AppColors.primary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.copy, size: 18, color: AppColors.primary),
                          tooltip: 'Copy Link',
                          onPressed: () {
                            ShareService.copyToClipboard(inviteUrl);
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Invite link copied to clipboard!'), behavior: SnackBarBehavior.floating),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('INVITE CODE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.8)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            inviteCode,
                            style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 13.5),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.copy, size: 18, color: AppColors.primary),
                          tooltip: 'Copy Code',
                          onPressed: () {
                            ShareService.copyToClipboard(inviteCode);
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Invite code copied!'), behavior: SnackBarBehavior.floating),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ShareService.shareInvite(groupName: group?.name ?? 'Ledger', inviteCode: inviteCode);
                  },
                  icon: const Icon(LucideIcons.share2, size: 18),
                  label: const Text('Share Link & Code on WhatsApp'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showManageMembersModal() {
    final appState = Provider.of<AppState>(context, listen: false);
    final group = appState.activeGroup;
    final members = group?.memberList ?? [];
    final currentUserId = appState.currentUser?.id ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: AppColors.cardBorder, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Text(
                      'Manage Members & Users',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showAddOfflineMemberDialog();
                    },
                    icon: const Icon(LucideIcons.userPlus, size: 14),
                    label: const Text('Add User', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Only group creator / admin can edit user names or remove members.',
                style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: members.length,
                  separatorBuilder: (_, __) => const Divider(color: AppColors.cardBorder, height: 16),
                  itemBuilder: (context, idx) {
                    final m = members[idx];
                    final isMe = m.id == currentUserId;
                    final isAdminMember = m.role == 'admin' || m.id == group?.createdBy;

                    return Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.positiveBg,
                          child: Text(
                            m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      m.name,
                                      style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (isAdminMember) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.amberBg,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'ADMIN',
                                        style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.amber),
                                      ),
                                    ),
                                  ],
                                  if (m.isShadow) ...[
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.surfaceMuted,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'OFFLINE',
                                        style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              if (m.email.isNotEmpty)
                                Text(m.email, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.edit2, size: 16, color: AppColors.primary),
                          tooltip: 'Edit Member Name',
                          onPressed: () {
                            _showEditMemberNameDialog(m.id, m.name);
                          },
                        ),
                        if (!isMe)
                          IconButton(
                            icon: const Icon(LucideIcons.userMinus, size: 16, color: AppColors.negative),
                            tooltip: 'Remove Member',
                            onPressed: () async {
                            final nav = Navigator.of(ctx);
                            final messenger = ScaffoldMessenger.of(context);
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (dCtx) => AlertDialog(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                title: Text('Remove ${m.name}?'),
                                content: const Text('Are you sure you want to remove this member from the group?'),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(dCtx, false), child: const Text('Cancel')),
                                  ElevatedButton(
                                    onPressed: () => Navigator.pop(dCtx, true),
                                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.negative),
                                    child: const Text('Remove'),
                                  ),
                                ],
                              ),
                            );

                            if (confirm == true) {
                              nav.pop();
                              await appState.removeMemberFromActiveGroup(m.id);
                              messenger.showSnackBar(
                                SnackBar(content: Text('${m.name} removed from group.'), behavior: SnackBarBehavior.floating),
                              );
                            }
                          },
                          ),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showAddOfflineMemberDialog();
                  },
                  icon: const Icon(LucideIcons.userPlus, size: 16, color: AppColors.primary),
                  label: const Text('Add Member / User', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditMemberNameDialog(String memberId, String currentName) {
    final controller = TextEditingController(text: currentName);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Edit Member Name', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter a new display name for this member in this ledger.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'e.g. Rahul, Aman',
                prefixIcon: Icon(LucideIcons.userCheck, size: 18),
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
              final newName = controller.text.trim();
              if (newName.isNotEmpty && newName != currentName) {
                Navigator.pop(ctx);
                await Provider.of<AppState>(context, listen: false).updateMemberNameInActiveGroup(memberId, newName);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Member name updated!'), behavior: SnackBarBehavior.floating),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showEditGroupNameDialog() {
    final appState = Provider.of<AppState>(context, listen: false);
    final group = appState.activeGroup;
    final nameController = TextEditingController(text: group?.name ?? '');
    String selectedIcon = group?.icon ?? 'food';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) {
          final allOptions = NewGroupScreen.themeOptions;
          return Container(
            padding: EdgeInsets.fromLTRB(
              20, 20, 20,
              MediaQuery.of(dialogCtx).viewInsets.bottom + 20,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(color: AppColors.cardBorder, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Edit Group Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 16),
                  const Text('GROUP NAME', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.8)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: nameController,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                    decoration: const InputDecoration(
                      hintText: 'e.g. Goa Trip 2026',
                      prefixIcon: Icon(LucideIcons.edit3, size: 18, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('CATEGORY THEME', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.8)),
                  const SizedBox(height: 10),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 3.4,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                    ),
                    itemCount: allOptions.length,
                    itemBuilder: (context, index) {
                      final opt = allOptions[index];
                      final isSelected = selectedIcon == opt.id;
                      return InkWell(
                        onTap: () => setDialogState(() => selectedIcon = opt.id),
                        borderRadius: BorderRadius.circular(14),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary : AppColors.surfaceMuted,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : AppColors.cardBorder,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                opt.icon,
                                size: 16,
                                color: isSelected ? Colors.white : AppColors.primary,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  opt.label,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: isSelected ? Colors.white : AppColors.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (isSelected)
                                const Icon(LucideIcons.check, size: 14, color: Colors.white),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: TextButton(
                          onPressed: () => Navigator.pop(dialogCtx),
                          child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            final newName = nameController.text.trim();
                            if (newName.isNotEmpty) {
                              Navigator.pop(dialogCtx);
                              await appState.updateActiveGroupDetails(newName, selectedIcon);
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Group details updated successfully!'), behavior: SnackBarBehavior.floating),
                                );
                              }
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Text('Save Details', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showGroupOptionsMenu() {
    final appState = Provider.of<AppState>(context, listen: false);
    final group = appState.activeGroup;
    final isAdmin = group?.myRole == 'admin' || (appState.currentUser != null && (group?.createdBy == appState.currentUser?.id));

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
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
                decoration: BoxDecoration(color: AppColors.cardBorder, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 16),
              if (isAdmin) ...[
                ListTile(
                  leading: const Icon(LucideIcons.edit3, color: AppColors.primary),
                  title: const Text('Edit Group Name', style: TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showEditGroupNameDialog();
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.users, color: AppColors.primary),
                  title: const Text('Manage Members & Edit Users', style: TextStyle(fontWeight: FontWeight.w600)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showManageMembersModal();
                  },
                ),
              ],
              ListTile(
                leading: const Icon(LucideIcons.userPlus, color: AppColors.primary),
                title: const Text('Add Offline Member', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showAddOfflineMemberDialog();
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.link, color: AppColors.primary),
                title: const Text('Invite Link & Code', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _showInviteModal();
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.share2, color: Color(0xFF25D366)),
                title: const Text('Share Summary on WhatsApp', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _shareOnWhatsapp();
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.pieChart, color: AppColors.primary),
                title: const Text('View Analytics & Report', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => GroupReportScreen(groupId: widget.groupId)),
                  );
                },
              ),
              const Divider(color: AppColors.cardBorder),
              if (isAdmin)
                ListTile(
                  leading: const Icon(LucideIcons.trash2, color: AppColors.negative),
                  title: const Text('Delete Group Ledger', style: TextStyle(color: AppColors.negative, fontWeight: FontWeight.w600)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (dCtx) => AlertDialog(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        title: const Text('Delete Group?'),
                        content: const Text('This will permanently delete all expenses and balances.'),
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
                      await Provider.of<AppState>(context, listen: false).deleteGroup(widget.groupId);
                      if (!mounted) return;
                      Navigator.pop(context);
                    }
                  },
                )
              else
                ListTile(
                  leading: const Icon(LucideIcons.logOut, color: AppColors.negative),
                  title: const Text('Leave Group', style: TextStyle(color: AppColors.negative, fontWeight: FontWeight.w600)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await Provider.of<AppState>(context, listen: false).leaveGroup(widget.groupId);
                    if (!mounted) return;
                    Navigator.pop(context);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final group = appState.activeGroup;
    final expenses = appState.activeExpenses;
    final balanceReport = appState.activeBalanceReport;
    final totalExpenses = expenses.fold<double>(0.0, (sum, e) => sum + e.amount);
    final isAdmin = group?.myRole == 'admin' || (appState.currentUser != null && group?.createdBy == appState.currentUser?.id);
    if (appState.isActiveGroupLoading && group == null) {
      return const GroupDetailSkeleton();
    }

    // Sort expenses
    final sortedExpenses = List<ExpenseModel>.from(expenses);
    if (_expenseSort == 'highest') {
      sortedExpenses.sort((a, b) => b.amount.compareTo(a.amount));
    } else if (_expenseSort == 'lowest') {
      sortedExpenses.sort((a, b) => a.amount.compareTo(b.amount));
    } else {
      sortedExpenses.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            GroupIconWidget(
              icon: group?.icon ?? 'other',
              size: 16,
              padding: 6,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          group?.name ?? 'Ledger',
                          style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isAdmin)
                        InkWell(
                          onTap: _showEditGroupNameDialog,
                          borderRadius: BorderRadius.circular(12),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                            child: Icon(LucideIcons.edit3, size: 14, color: AppColors.textMuted),
                          ),
                        ),
                      if (isAdmin) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.amberBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'ADMIN',
                            style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.amber),
                          ),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    '${group?.memberIds.length ?? 0} members',
                    style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.share2, size: 20, color: Color(0xFF25D366)),
            onPressed: _shareOnWhatsapp,
            tooltip: 'Share on WhatsApp',
          ),
          IconButton(
            icon: const Icon(LucideIcons.moreVertical, size: 20),
            onPressed: _showGroupOptionsMenu,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Custom Segmented Switch (Expenses / Balance)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Container(
                height: 48,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final pillWidth = (constraints.maxWidth) / 2;
                    return Stack(
                      children: [
                        // Sliding Green Pill Indicator
                        AnimatedPositioned(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.fastOutSlowIn,
                          left: _selectedTab == 0 ? 0 : pillWidth,
                          top: 0,
                          bottom: 0,
                          width: pillWidth,
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppColors.positiveBg,
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                        ),

                        // Tab Buttons
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _selectedTab = 0),
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
                                          LucideIcons.receipt,
                                          size: 16,
                                          color: _selectedTab == 0 ? AppColors.primary : AppColors.textMuted,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      AnimatedDefaultTextStyle(
                                        duration: const Duration(milliseconds: 200),
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: _selectedTab == 0 ? AppColors.primary : AppColors.textSecondary,
                                        ),
                                        child: const Text('Expenses'),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => setState(() => _selectedTab = 1),
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
                                          LucideIcons.scale,
                                          size: 16,
                                          color: _selectedTab == 1 ? AppColors.primary : AppColors.textMuted,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      AnimatedDefaultTextStyle(
                                        duration: const Duration(milliseconds: 200),
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: _selectedTab == 1 ? AppColors.primary : AppColors.textSecondary,
                                        ),
                                        child: const Text('Balance'),
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
            ),

            // Tab Content Area
            Expanded(
              child: AnimatedSwitcher(
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
                    child: child,
                  );
                },
                child: KeyedSubtree(
                  key: ValueKey<int>(_selectedTab),
                  child: _selectedTab == 0
                      ? _buildExpensesList(sortedExpenses, group)
                      : _buildBalanceView(balanceReport, totalExpenses),
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: _selectedTab == 0
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => AddExpenseScreen(groupId: widget.groupId)),
                );
              },
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              icon: const Icon(LucideIcons.plus, size: 20),
              label: const Text('Add Expense', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          : null,
    );
  }

  // --- Expenses Tab ---
  Widget _buildExpensesList(List<ExpenseModel> sortedExpenses, dynamic group) {
    if (sortedExpenses.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: AppColors.positiveBg,
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.receipt, size: 28, color: AppColors.primary),
              ),
              const SizedBox(height: 16),
              const Text(
                'No expenses logged yet',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              const Text(
                'Tap the button below to add dinner bills, tickets, or groceries.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        // Sort & Filter Toolbar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'TRANSACTIONS',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.8),
              ),
              DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _expenseSort,
                  icon: const Icon(LucideIcons.arrowUpDown, size: 14, color: AppColors.textMuted),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                  items: const [
                    DropdownMenuItem(value: 'recent', child: Text('Recent First')),
                    DropdownMenuItem(value: 'highest', child: Text('Highest Amount')),
                    DropdownMenuItem(value: 'lowest', child: Text('Lowest Amount')),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _expenseSort = val);
                  },
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: sortedExpenses.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, idx) {
              final e = sortedExpenses[idx];
              final isExpanded = _expandedExpenseId == e.id;
              final dateStr = DateFormat('dd MMM yyyy').format(DateTime.tryParse(e.createdAt) ?? DateTime.now());

              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Main Collapsed Row
                    InkWell(
                      onTap: () {
                        setState(() {
                          _expandedExpenseId = isExpanded ? null : e.id;
                        });
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    e.description,
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Paid by ${e.payer.name}',
                                    style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₹${e.amount.toStringAsFixed(2)}',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  dateStr,
                                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Expanded Details Section
                    if (isExpanded) ...[
                      const Divider(color: AppColors.cardBorder, height: 1),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          color: AppColors.surfaceMuted,
                          borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
                        ),
                        child: () {
                          final appState = context.read<AppState>();
                          final currentUserId = appState.currentUser?.id ?? '';
                          final currentUserName = (appState.currentUser?.name ?? '').toLowerCase().trim();
                          final isExpensePayer = (currentUserId.isNotEmpty && (e.paidBy == currentUserId || e.payer.id == currentUserId)) ||
                              (currentUserName.isNotEmpty && e.payer.name.toLowerCase().trim() == currentUserName);
                          final canEditExpense = isExpensePayer;

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Payer row
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'PAID BY',
                                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5),
                                  ),
                                  if (canEditExpense)
                                    PopupMenuButton<String>(
                                      onSelected: (newPayerId) async {
                                        await Provider.of<AppState>(context, listen: false)
                                            .updateExpensePayer(e.id, newPayerId);
                                      },
                                      child: Row(
                                        children: [
                                          Text(
                                            '${e.payer.name} ✎',
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.primary,
                                              decoration: TextDecoration.underline,
                                            ),
                                          ),
                                        ],
                                      ),
                                      itemBuilder: (pCtx) {
                                        final members = group?.memberList ?? [];
                                        return members.map<PopupMenuEntry<String>>((m) {
                                          return PopupMenuItem<String>(
                                            value: m.id,
                                            child: Text(m.name, style: const TextStyle(fontSize: 13)),
                                          );
                                        }).toList();
                                      },
                                    )
                                  else
                                    Text(
                                      e.payer.name,
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Split breakdown
                              const Text(
                                'SPLIT BREAKDOWN',
                                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5),
                              ),
                              const SizedBox(height: 6),
                              ...e.shares.map((share) {
                                final member = group?.members[share.userId];
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 3),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${member?.name ?? 'Member'} owes',
                                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                      ),
                                      Text(
                                        '₹${share.amount.toStringAsFixed(2)}',
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                      ),
                                    ],
                                  ),
                                );
                              }),

                              if (e.note.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text('Note: "${e.note}"', style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontStyle: FontStyle.italic)),
                              ],

                              const SizedBox(height: 14),

                              // Action buttons (Edit & Delete or Lock Notice)
                              if (canEditExpense)
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => AddExpenseScreen(groupId: widget.groupId, existingExpense: e),
                                            ),
                                          );
                                        },
                                        icon: const Icon(LucideIcons.edit2, size: 14),
                                        label: const Text('Edit'),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          side: const BorderSide(color: AppColors.cardBorder),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        onPressed: () async {
                                          final appState = Provider.of<AppState>(context, listen: false);
                                          final confirm = await showDialog<bool>(
                                            context: context,
                                            builder: (dCtx) => AlertDialog(
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                              title: const Text('Delete Expense?'),
                                              content: Text('Delete "${e.description}"? This cannot be undone.'),
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
                                            await appState.deleteExpense(e.id);
                                          }
                                        },
                                        icon: const Icon(LucideIcons.trash2, size: 14, color: AppColors.negative),
                                        label: const Text('Delete', style: TextStyle(color: AppColors.negative)),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(vertical: 10),
                                          side: const BorderSide(color: AppColors.negativeBg),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              else
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceMuted,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.cardBorder),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(LucideIcons.lock, size: 14, color: AppColors.textMuted),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Only ${e.payer.name} can edit or delete this expense.',
                                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          );
                        }(),
                      ),
                    ],
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // --- Balance Tab ---
  Widget _buildBalanceView(dynamic balanceReport, double totalExpenses) {
    final moves = balanceReport.moves;
    final balances = balanceReport.balances;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Total Expenses Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'TOTAL EXPENSES:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.8),
                ),
                Text(
                  '₹${totalExpenses.toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.primary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // How to Settle Card
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'How to settle?',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    TextButton.icon(
                      onPressed: _shareOnWhatsapp,
                      icon: const Icon(LucideIcons.share2, size: 14, color: Color(0xFF25D366)),
                      label: const Text('WhatsApp', style: TextStyle(color: Color(0xFF25D366), fontWeight: FontWeight.w700, fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (moves.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: const Column(
                      children: [
                        Icon(LucideIcons.checkCircle2, size: 32, color: AppColors.primary),
                        SizedBox(height: 8),
                        Text(
                          'All clear! Sab settled hai 🎉',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: moves.length,
                    separatorBuilder: (_, __) => const Divider(color: AppColors.cardBorder, height: 16),
                    itemBuilder: (context, idx) {
                      final move = moves[idx];

                      return Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  move.fromName,
                                  style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                ),
                                Text(
                                  'pays to ${move.toName}',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '₹${move.amount.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.primary),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                                ),
                                builder: (_) => SettleModal(
                                  groupId: widget.groupId,
                                  move: move,
                                  onSettled: () {
                                    Provider.of<AppState>(context, listen: false).loadGroupDetails(widget.groupId);
                                  },
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.positiveBg,
                              foregroundColor: AppColors.primary,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('Settle', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                          ),
                        ],
                      );
                    },
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Member Balances Summary Card
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Member Balances',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 14),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: balances.length,
                  separatorBuilder: (_, __) => const Divider(color: AppColors.cardBorder, height: 16),
                  itemBuilder: (context, idx) {
                    final b = balances[idx];
                    final isPositive = b.amount > 0;
                    final isNegative = b.amount < 0;

                    return Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: AppColors.positiveBg,
                          child: Text(
                            b.name.isNotEmpty ? b.name[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                b.name,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                              ),
                              Text(
                                'Charged: ₹${b.charged.toStringAsFixed(0)} · Paid: ₹${b.paid.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '${isPositive ? '+' : ''}₹${b.amount.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: isPositive
                                ? AppColors.positive
                                : isNegative
                                    ? AppColors.negative
                                    : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
