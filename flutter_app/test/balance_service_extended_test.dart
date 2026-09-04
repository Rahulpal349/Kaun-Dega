import 'package:flutter_test/flutter_test.dart';
import 'package:kaun_dega/models/user_model.dart';
import 'package:kaun_dega/models/expense_model.dart';
import 'package:kaun_dega/models/settlement_model.dart';
import 'package:kaun_dega/services/balance_service.dart';

void main() {
  group('BalanceService Extended Tests', () {
    test('Handles complex 4-way circular expense graph with debt minimization', () {
      final user1 = UserModel(id: 'u1', name: 'User 1');
      final user2 = UserModel(id: 'u2', name: 'User 2');
      final user3 = UserModel(id: 'u3', name: 'User 3');
      final user4 = UserModel(id: 'u4', name: 'User 4');

      // Expense 1: User 1 pays 400, split equal among all 4 (100 each)
      final exp1 = ExpenseModel(
        id: 'e1',
        groupId: 'g1',
        description: 'Groceries',
        amount: 400.0,
        paidBy: 'u1',
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: 'u1', amount: 100.0),
          ExpenseShare(userId: 'u2', amount: 100.0),
          ExpenseShare(userId: 'u3', amount: 100.0),
          ExpenseShare(userId: 'u4', amount: 100.0),
        ],
        payer: PayerInfo(id: 'u1', name: 'User 1'),
      );

      // Expense 2: User 2 pays 200, split between u2 and u3 (100 each)
      final exp2 = ExpenseModel(
        id: 'e2',
        groupId: 'g1',
        description: 'Snacks',
        amount: 200.0,
        paidBy: 'u2',
        splitType: 'custom',
        shares: [
          ExpenseShare(userId: 'u2', amount: 100.0),
          ExpenseShare(userId: 'u3', amount: 100.0),
        ],
        payer: PayerInfo(id: 'u2', name: 'User 2'),
      );

      // Net calculations:
      // u1: paid 400, charged 100 => net = +300
      // u2: paid 200, charged (100 + 100 = 200) => net = 0
      // u3: paid 0, charged (100 + 100 = 200) => net = -200
      // u4: paid 0, charged 100 => net = -100
      // Sum of nets = +300 + 0 - 200 - 100 = 0 (Zero-sum conservation)

      final report = BalanceService.computeBalances(
        members: [user1, user2, user3, user4],
        expenses: [exp1, exp2],
        settlements: [],
      );

      final bal1 = report.balances.firstWhere((b) => b.id == 'u1');
      final bal2 = report.balances.firstWhere((b) => b.id == 'u2');
      final bal3 = report.balances.firstWhere((b) => b.id == 'u3');
      final bal4 = report.balances.firstWhere((b) => b.id == 'u4');

      expect(bal1.amount, 300.0);
      expect(bal2.amount, 0.0);
      expect(bal3.amount, -200.0);
      expect(bal4.amount, -100.0);

      // Debt simplification should greedily settle u3 (owes 200) -> u1 and u4 (owes 100) -> u1
      expect(report.moves.length, 2);
      expect(report.moves.any((m) => m.from == 'u3' && m.to == 'u1' && m.amount == 200.0), true);
      expect(report.moves.any((m) => m.from == 'u4' && m.to == 'u1' && m.amount == 100.0), true);
    });

    test('Settlements properly offset existing debt to zero', () {
      final userA = UserModel(id: 'u_a', name: 'Alice');
      final userB = UserModel(id: 'u_b', name: 'Bob');

      final expense = ExpenseModel(
        id: 'e1',
        groupId: 'g1',
        description: 'Cab Ride',
        amount: 100.0,
        paidBy: 'u_a',
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: 'u_a', amount: 50.0),
          ExpenseShare(userId: 'u_b', amount: 50.0),
        ],
        payer: PayerInfo(id: 'u_a', name: 'Alice'),
      );

      final settlement = SettlementModel(
        id: 's1',
        groupId: 'g1',
        fromUser: 'u_b',
        toUser: 'u_a',
        amount: 50.0,
      );

      final report = BalanceService.computeBalances(
        members: [userA, userB],
        expenses: [expense],
        settlements: [settlement],
      );

      final balAlice = report.balances.firstWhere((b) => b.id == 'u_a');
      final balBob = report.balances.firstWhere((b) => b.id == 'u_b');

      expect(balAlice.amount, 0.0);
      expect(balBob.amount, 0.0);
      expect(report.moves.isEmpty, true);
    });

    test('Returns clear message when group is fully settled', () {
      final text = BalanceService.buildWhatsappText('Flat 301', []);
      expect(text, contains('Flat 301'));
      expect(text, contains('Sab clear hai'));
    });
  });
}
