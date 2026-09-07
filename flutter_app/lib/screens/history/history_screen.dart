import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/app_state.dart';
import '../../widgets/group_icon.dart';
import '../../widgets/skeleton_loader.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String? _expandedActivityId;
  String? _selectedGroupName; // null = All groups

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppState>(context, listen: false).loadAllActivity();
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final allExpenses = appState.allExpenses;

    // Sorted unique group names
    final groupNames = allExpenses
        .map((e) => e.groupName ?? 'Group')
        .toSet()
        .toList()
      ..sort();

    // Apply group filter
    final expenses = _selectedGroupName == null
        ? allExpenses
        : allExpenses
            .where((e) => (e.groupName ?? 'Group') == _selectedGroupName)
            .toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Activity Timeline'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Group Filter Chips ─────────────────────────────
            if (!appState.isActivityLoading && allExpenses.isNotEmpty)
              Container(
                height: 48,
                margin: const EdgeInsets.only(top: 12, bottom: 4),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    // "All" chip
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: const Text('All'),
                        selected: _selectedGroupName == null,
                        onSelected: (_) =>
                            setState(() => _selectedGroupName = null),
                        selectedColor: AppColors.primary,
                        backgroundColor: Colors.white,
                        labelStyle: TextStyle(
                          color: _selectedGroupName == null
                              ? Colors.white
                              : AppColors.textSecondary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: BorderSide(
                            color: _selectedGroupName == null
                                ? AppColors.primary
                                : AppColors.cardBorder,
                          ),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        showCheckmark: false,
                        avatar: Icon(
                          LucideIcons.layoutGrid,
                          size: 13,
                          color: _selectedGroupName == null
                              ? Colors.white
                              : AppColors.textSecondary,
                        ),
                      ),
                    ),
                    // One chip per group
                    ...groupNames.map((name) {
                      final isSelected = _selectedGroupName == name;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(name),
                          selected: isSelected,
                          onSelected: (_) => setState(() =>
                              _selectedGroupName = isSelected ? null : name),
                          selectedColor: AppColors.primary,
                          backgroundColor: Colors.white,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w700,
                            fontSize: 12.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.cardBorder,
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          showCheckmark: false,
                        ),
                      );
                    }),
                  ],
                ),
              ),

            // ── Activity List ──────────────────────────────────
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => appState.loadAllActivity(),
                color: AppColors.primary,
                child: appState.isActivityLoading
                    ? const ActivitySkeleton()
                    : expenses.isEmpty
                        ? Center(
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
                                    child: const Icon(LucideIcons.history, size: 28, color: AppColors.primary),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    _selectedGroupName != null
                                        ? 'No activity in "$_selectedGroupName"'
                                        : 'No activity yet',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _selectedGroupName != null
                                        ? 'Try selecting a different group or tap "All".'
                                        : 'All expense activities across your ledgers will appear here chronologically.',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      itemCount: expenses.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, idx) {
                        final e = expenses[idx];
                        final dateStr = DateFormat('dd MMM yyyy').format(DateTime.tryParse(e.createdAt) ?? DateTime.now());
                        final isExpanded = _expandedActivityId == e.id;

                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.fastOutSlowIn,
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
                          child: InkWell(
                            onTap: () => setState(() => _expandedActivityId = isExpanded ? null : e.id),
                            borderRadius: BorderRadius.circular(20),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      GroupIconWidget(
                                        icon: e.groupEmoji ?? 'food',
                                        size: 18,
                                        padding: 10,
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              e.description,
                                              style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                              maxLines: isExpanded ? null : 1,
                                              overflow: isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              '${e.payer.name} · ${e.groupName ?? 'Group'} · $dateStr',
                                              style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                                              maxLines: isExpanded ? null : 1,
                                              overflow: isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      if (e.amount > 0)
                                        Text(
                                          '₹${e.amount.toStringAsFixed(2)}',
                                          style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                                        )
                                      else
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                          decoration: BoxDecoration(
                                            color: AppColors.positiveBg,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: const Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(LucideIcons.edit3, size: 12, color: AppColors.primary),
                                              SizedBox(width: 4),
                                              Text(
                                                'Update',
                                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primary),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  ),

                                  if (isExpanded) ...[
                                    const SizedBox(height: 12),
                                    const Divider(color: AppColors.cardBorder, height: 1),
                                    const SizedBox(height: 12),
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppColors.surfaceMuted,
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              const Text('LEDGER', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5)),
                                              Text(e.groupName ?? 'Group', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(e.amount > 0 ? 'PAID BY' : 'UPDATED BY', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5)),
                                              Text(e.payer.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                            ],
                                          ),
                                          if (e.note.isNotEmpty) ...[
                                            const SizedBox(height: 8),
                                            Text('Note: "${e.note}"', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic)),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
