import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Animated pulsing skeleton loader box
class SkeletonBox extends StatefulWidget {
  final double? width;
  final double? height;
  final BorderRadiusGeometry? borderRadius;
  final EdgeInsetsGeometry? margin;

  const SkeletonBox({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.margin,
  });

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 0.35, end: 0.85).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          margin: widget.margin,
          decoration: BoxDecoration(
            color: Color.lerp(
              const Color(0xFFE2EFE9),
              const Color(0xFFCDE3D9),
              _animation.value,
            ),
            borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
          ),
        );
      },
    );
  }
}

/// Dashboard Skeleton Screen
class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero Net Balance Card Skeleton
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFF0E382F),
              borderRadius: BorderRadius.circular(28),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SkeletonBox(width: 90, height: 14, borderRadius: BorderRadius.all(Radius.circular(6))),
                    SkeletonBox(width: 75, height: 22, borderRadius: BorderRadius.all(Radius.circular(12))),
                  ],
                ),
                SizedBox(height: 16),
                SkeletonBox(width: 160, height: 38, borderRadius: BorderRadius.all(Radius.circular(10))),
                SizedBox(height: 18),
                SkeletonBox(width: 210, height: 26, borderRadius: BorderRadius.all(Radius.circular(12))),
              ],
            ),
          ),

          const SizedBox(height: 28),

          // Section Header Skeleton
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              SkeletonBox(width: 120, height: 20, borderRadius: BorderRadius.all(Radius.circular(8))),
              SkeletonBox(width: 55, height: 16, borderRadius: BorderRadius.all(Radius.circular(6))),
            ],
          ),

          const SizedBox(height: 14),

          // Group Card Skeletons (3 cards)
          ...List.generate(3, (index) => const GroupCardSkeletonItem()),
        ],
      ),
    );
  }
}

/// Single Group Card Skeleton Item
class GroupCardSkeletonItem extends StatelessWidget {
  const GroupCardSkeletonItem({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: const Row(
        children: [
          // Icon Avatar Skeleton
          SkeletonBox(width: 48, height: 48, borderRadius: BorderRadius.all(Radius.circular(24))),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 140, height: 16, borderRadius: BorderRadius.all(Radius.circular(6))),
                SizedBox(height: 8),
                SkeletonBox(width: 90, height: 12, borderRadius: BorderRadius.all(Radius.circular(4))),
              ],
            ),
          ),
          SizedBox(width: 10),
          SkeletonBox(width: 28, height: 28, borderRadius: BorderRadius.all(Radius.circular(14))),
        ],
      ),
    );
  }
}

/// Group Detail Screen Skeleton
class GroupDetailSkeleton extends StatelessWidget {
  const GroupDetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar Skeleton
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  SkeletonBox(width: 36, height: 36, borderRadius: BorderRadius.all(Radius.circular(18))),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 130, height: 16, borderRadius: BorderRadius.all(Radius.circular(6))),
                        SizedBox(height: 6),
                        SkeletonBox(width: 70, height: 11, borderRadius: BorderRadius.all(Radius.circular(4))),
                      ],
                    ),
                  ),
                  SkeletonBox(width: 36, height: 36, borderRadius: BorderRadius.all(Radius.circular(18))),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Tab Bar Skeleton
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: const Row(
                  children: [
                    Expanded(child: SkeletonBox(height: 40, borderRadius: BorderRadius.all(Radius.circular(12)))),
                    SizedBox(width: 6),
                    Expanded(child: SkeletonBox(height: 40, borderRadius: BorderRadius.all(Radius.circular(12)))),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Expense Items Skeleton List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: 4,
                itemBuilder: (_, __) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: const Row(
                    children: [
                      SkeletonBox(width: 44, height: 44, borderRadius: BorderRadius.all(Radius.circular(14))),
                      SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SkeletonBox(width: 130, height: 15, borderRadius: BorderRadius.all(Radius.circular(6))),
                            SizedBox(height: 6),
                            SkeletonBox(width: 100, height: 12, borderRadius: BorderRadius.all(Radius.circular(4))),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          SkeletonBox(width: 65, height: 16, borderRadius: BorderRadius.all(Radius.circular(6))),
                          SizedBox(height: 6),
                          SkeletonBox(width: 45, height: 11, borderRadius: BorderRadius.all(Radius.circular(4))),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
