import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kaun_dega/widgets/group_icon.dart';
import 'package:lucide_icons/lucide_icons.dart';

void main() {
  group('Flutter Widget Tests', () {
    testWidgets('GroupIconWidget renders appropriate icon and custom styles', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                GroupIconWidget(icon: 'trip', size: 24),
                GroupIconWidget(icon: 'food', size: 24),
                GroupIconWidget(icon: 'party', size: 24),
                GroupIconWidget(icon: 'other', size: 24),
              ],
            ),
          ),
        ),
      );

      // Verify that 4 GroupIconWidgets are rendered
      expect(find.byType(GroupIconWidget), findsNWidgets(4));

      // Check for specific LucideIcons
      expect(find.byIcon(LucideIcons.plane), findsOneWidget);
      expect(find.byIcon(LucideIcons.utensils), findsOneWidget);
      expect(find.byIcon(LucideIcons.sparkles), findsOneWidget);
      expect(find.byIcon(LucideIcons.receipt), findsOneWidget);
    });
  });
}
