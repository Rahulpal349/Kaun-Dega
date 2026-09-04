import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../config/theme.dart';

class CustomBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const CustomBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottomInset > 0 ? bottomInset + 4 : 16),
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(
            color: AppColors.cardBorder.withValues(alpha: 0.9),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildNavItem(
              index: 0,
              icon: LucideIcons.layoutGrid,
              activeIcon: LucideIcons.layoutGrid,
              label: 'Ledgers',
            ),
            _buildNavItem(
              index: 1,
              icon: LucideIcons.activity,
              activeIcon: LucideIcons.activity,
              label: 'Activity',
            ),
            _buildNavItem(
              index: 2,
              icon: LucideIcons.user,
              activeIcon: LucideIcons.user,
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isSelected = currentIndex == index;

    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.fastOutSlowIn,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary.withValues(alpha: 0.12)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedScale(
                scale: isSelected ? 1.12 : 1.0,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutBack,
                child: Icon(
                  isSelected ? activeIcon : icon,
                  size: 20,
                  color: isSelected ? AppColors.primary : AppColors.textMuted,
                ),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 300),
                curve: Curves.fastOutSlowIn,
                child: isSelected
                    ? Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: AnimatedOpacity(
                          duration: const Duration(milliseconds: 250),
                          opacity: isSelected ? 1.0 : 0.0,
                          child: Text(
                            label,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              letterSpacing: -0.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.clip,
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
