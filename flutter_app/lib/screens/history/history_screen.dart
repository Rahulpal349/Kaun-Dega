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
    final expenses = appState.allExpenses;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Activity Timeline'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
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
                            const Text(
                              'No activity yet',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'All expense activities across your ledgers will appear here chronologically.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
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

                        return Container(
                          padding: const EdgeInsets.all(16),
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
                          child: Row(
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
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '${e.payer.name} · ${e.groupName ?? 'Group'} · $dateStr',
                                      style: const TextStyle(fontSize: 11.5, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                '₹${e.amount.toStringAsFixed(2)}',
                                style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ),
    );
  }
}
