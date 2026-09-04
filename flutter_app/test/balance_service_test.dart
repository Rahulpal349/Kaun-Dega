import 'package:flutter_test/flutter_test.dart';
import 'package:kaun_dega/models/user_model.dart';
import 'package:kaun_dega/models/expense_model.dart';
import 'package:kaun_dega/models/balance_model.dart';
import 'package:kaun_dega/services/balance_service.dart';

void main() {
  group('BalanceService Debt Simplification Tests', () {
    test('Correctly computes equal split and minimal settlement moves', () {
      final userA = UserModel(id: 'u_a', name: 'Alice');
      final userB = UserModel(id: 'u_b', name: 'Bob');
      final userC = UserModel(id: 'u_c', name: 'Charlie');

      final expense1 = ExpenseModel(
        id: 'e1',
        groupId: 'g1',
        description: 'Dinner',
        amount: 300.0,
        paidBy: 'u_a',
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: 'u_a', amount: 100.0),
          ExpenseShare(userId: 'u_b', amount: 100.0),
          ExpenseShare(userId: 'u_c', amount: 100.0),
        ],
        payer: PayerInfo(id: 'u_a', name: 'Alice'),
      );

      final report = BalanceService.computeBalances(
        members: [userA, userB, userC],
        expenses: [expense1],
        settlements: [],
      );

      // Alice is owed +200, Bob owes -100, Charlie owes -100
      final balAlice = report.balances.firstWhere((b) => b.id == 'u_a');
      final balBob = report.balances.firstWhere((b) => b.id == 'u_b');
      final balCharlie = report.balances.firstWhere((b) => b.id == 'u_c');

      expect(balAlice.amount, 200.0);
      expect(balBob.amount, -100.0);
      expect(balCharlie.amount, -100.0);

      // Moves should have 2 transactions: Bob -> Alice (100), Charlie -> Alice (100)
      expect(report.moves.length, 2);
      expect(report.moves.every((m) => m.to == 'u_a'), true);
    });

    test('Generates crisp WhatsApp settlement message', () {
      final moves = [
        SettlementMove(from: 'u_b', fromName: 'Bob', to: 'u_a', toName: 'Alice', toUpiId: 'alice@upi', amount: 100.0),
      ];
      final text = BalanceService.buildWhatsappText('Goa Trip', moves);

      expect(text.contains('Goa Trip'), true);
      expect(text.contains('Bob'), true);
      expect(text.contains('Alice'), true);
      expect(text.contains('100.00'), true);
      expect(text.contains('alice@upi'), true);
    });
  });
}
