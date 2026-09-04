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
    switch (key.toLowerCase()) {
      case 'food':
      case 'drinks':
      case 'restaurant':
      case 'dining':
        return LucideIcons.utensils;
      case 'trip':
      case 'travel':
      case 'vacation':
        return LucideIcons.plane;
      case 'home':
      case 'flat':
      case 'household':
        return LucideIcons.home;
      case 'party':
      case 'celebration':
        return LucideIcons.sparkles;
      case 'coffee':
      case 'chai':
        return LucideIcons.coffee;
      case 'shopping':
        return LucideIcons.shoppingBag;
      case 'car':
      case 'fuel':
        return LucideIcons.car;
      default:
        return LucideIcons.receipt;
    }
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
