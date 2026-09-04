import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../config/theme.dart';

class GroupIconWidget extends StatelessWidget {
  final String icon;
  final double size;
  final Color? color;
  final Color? backgroundColor;
  final double padding;

  const GroupIconWidget({
    super.key,
    required this.icon,
    this.size = 20,
    this.color,
    this.backgroundColor,
    this.padding = 10,
  });

  IconData _getIconData(String key) {
    final k = key.toLowerCase().trim();
    if (k.contains('food') || k.contains('drink') || k.contains('restaurant') || k.contains('dining') || k.contains('snack') || k.contains('lunch') || k.contains('dinner')) {
      return LucideIcons.utensils;
    }
    if (k.contains('trip') || k.contains('travel') || k.contains('vacation') || k.contains('flight') || k.contains('tour')) {
      return LucideIcons.plane;
    }
    if (k.contains('home') || k.contains('house') || k.contains('flat') || k.contains('rent') || k.contains('apartment')) {
      return LucideIcons.home;
    }
    if (k.contains('party') || k.contains('celebration') || k.contains('outing') || k.contains('event')) {
      return LucideIcons.sparkles;
    }
    if (k.contains('office') || k.contains('work') || k.contains('project') || k.contains('business')) {
      return LucideIcons.briefcase;
    }
    if (k.contains('shop') || k.contains('mall') || k.contains('clothe') || k.contains('store')) {
      return LucideIcons.shoppingBag;
    }
    if (k.contains('movie') || k.contains('cinema') || k.contains('film') || k.contains('show') || k.contains('entertainment')) {
      return LucideIcons.clapperboard;
    }
    if (k.contains('fuel') || k.contains('car') || k.contains('cab') || k.contains('taxi') || k.contains('ride') || k.contains('transport')) {
      return LucideIcons.car;
    }
    if (k.contains('fitness') || k.contains('gym') || k.contains('sport') || k.contains('workout')) {
      return LucideIcons.dumbbell;
    }
    if (k.contains('education') || k.contains('book') || k.contains('study') || k.contains('course') || k.contains('school')) {
      return LucideIcons.graduationCap;
    }
    if (k.contains('coffee') || k.contains('chai') || k.contains('tea') || k.contains('cafe')) {
      return LucideIcons.coffee;
    }
    if (k.contains('gift') || k.contains('present')) {
      return LucideIcons.gift;
    }
    if (k.contains('health') || k.contains('doctor') || k.contains('medicine') || k.contains('medical')) {
      return LucideIcons.heartPulse;
    }
    return LucideIcons.tag;
  }

  @override
  Widget build(BuildContext context) {
    final iconData = _getIconData(icon);
    final primaryColor = color ?? AppColors.primary;
    final bg = backgroundColor ?? AppColors.positiveBg;

    return Container(
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.cardBorder, width: 1),
      ),
      child: Icon(
        iconData,
        size: size,
        color: primaryColor,
      ),
    );
  }
}
