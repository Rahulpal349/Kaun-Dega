import '../models/user_model.dart';
import '../models/expense_model.dart';
import '../models/settlement_model.dart';
import '../models/balance_model.dart';

class BalanceService {
  /// Deterministic client-side debt simplification & balance calculation
  static GroupBalanceReport computeBalances({
    required List<UserModel> members,
    required List<ExpenseModel> expenses,
    required List<SettlementModel> settlements,
  }) {
    final Map<String, UserModel> names = {};
    final Map<String, double> net = {};
    final Map<String, double> paid = {};
    final Map<String, double> charged = {};
    final Map<String, double> settledPaid = {};
    final Map<String, double> settledReceived = {};
    final Set<String> memberIdSet = {};

    for (final m in members) {
      memberIdSet.add(m.id);
      names[m.id] = m;
      net[m.id] = 0.0;
      paid[m.id] = 0.0;
      charged[m.id] = 0.0;
      settledPaid[m.id] = 0.0;
      settledReceived[m.id] = 0.0;
    }

    // Process all expenses: payer gets credited, split members get debited
    for (final e in expenses) {
      final shares = e.shares;
      final shareTotal = shares.fold<double>(0.0, (sum, s) => sum + s.amount);
      final paidBy = e.paidBy;

      if (paidBy.isNotEmpty) {
        net[paidBy] = (net[paidBy] ?? 0.0) + shareTotal;
        paid[paidBy] = (paid[paidBy] ?? 0.0) + shareTotal;
      }

      for (final s in shares) {
        if (s.userId.isNotEmpty) {
          net[s.userId] = (net[s.userId] ?? 0.0) - s.amount;
          charged[s.userId] = (charged[s.userId] ?? 0.0) + s.amount;
        }
      }
    }

    // Process past settlements: moves money directly from debtor to creditor
    for (final s in settlements) {
      if (s.amount <= 0) continue;
      final from = s.fromUser;
      final to = s.toUser;

      if (from.isNotEmpty) {
        net[from] = (net[from] ?? 0.0) + s.amount;
        settledPaid[from] = (settledPaid[from] ?? 0.0) + s.amount;
      }
      if (to.isNotEmpty) {
        net[to] = (net[to] ?? 0.0) - s.amount;
        settledReceived[to] = (settledReceived[to] ?? 0.0) + s.amount;
      }
    }

    // Greedy debt simplification algorithm:
    // Matches the biggest debtor with the biggest creditor
    final List<MapEntry<String, double>> creditors = net.entries
        .where((e) => e.value > 0.01)
        .map((e) => MapEntry(e.key, e.value))
        .toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final List<MapEntry<String, double>> debtors = net.entries
        .where((e) => e.value < -0.01)
        .map((e) => MapEntry(e.key, -e.value))
        .toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final List<SettlementMove> moves = [];
    int i = 0; // debtors index
    int j = 0; // creditors index

    // Create mutable copies of amounts
    final List<double> debtorAmounts = debtors.map((e) => e.value).toList();
    final List<double> creditorAmounts = creditors.map((e) => e.value).toList();

    while (i < debtors.length && j < creditors.length) {
      final pay = debtorAmounts[i] < creditorAmounts[j] ? debtorAmounts[i] : creditorAmounts[j];

      if (pay > 0.01) {
        final debtorId = debtors[i].key;
        final creditorId = creditors[j].key;

        moves.add(SettlementMove(
          from: debtorId,
          fromName: names[debtorId]?.name ?? 'Member',
          to: creditorId,
          toName: names[creditorId]?.name ?? 'Member',
          toUpiId: names[creditorId]?.upiId.isNotEmpty == true ? names[creditorId]?.upiId : null,
          amount: double.parse(pay.toStringAsFixed(2)),
        ));
      }

      debtorAmounts[i] -= pay;
      creditorAmounts[j] -= pay;

      if (debtorAmounts[i] < 0.01) i++;
      if (creditorAmounts[j] < 0.01) j++;
    }

    // Build balances list
    final List<String> allIds = [
      ...members.map((m) => m.id),
      ...net.keys.where((id) => !memberIdSet.contains(id)),
    ];

    final List<UserBalance> balances = [];
    for (final id in allIds) {
      final isMember = memberIdSet.contains(id);
      final netAmt = double.parse((net[id] ?? 0.0).toStringAsFixed(2));

      if (!isMember && netAmt.abs() < 0.01) continue;

      balances.add(UserBalance(
        id: id,
        name: names[id]?.name ?? 'Member',
        amount: netAmt,
        paid: double.parse((paid[id] ?? 0.0).toStringAsFixed(2)),
        charged: double.parse((charged[id] ?? 0.0).toStringAsFixed(2)),
        settledPaid: double.parse((settledPaid[id] ?? 0.0).toStringAsFixed(2)),
        settledReceived: double.parse((settledReceived[id] ?? 0.0).toStringAsFixed(2)),
      ));
    }

    return GroupBalanceReport(balances: balances, moves: moves);
  }

  /// Builds WhatsApp share formatted summary text
  static String buildWhatsappText(String groupName, List<SettlementMove> moves) {
    final name = groupName.isNotEmpty ? groupName : 'Kaun Dega?';

    if (moves.isEmpty) {
      return '*$name* — Sab clear hai! 🎉\nNo one needs to pay anything.';
    }

    final buffer = StringBuffer();
    buffer.writeln('*$name* — 🧾 Hisaab Kitab:');
    buffer.writeln();
    for (final m in moves) {
      buffer.writeln('• *${m.fromName}* to pay *${m.toName}* ₹${m.amount.toStringAsFixed(2)}');
      if (m.toUpiId != null && m.toUpiId!.isNotEmpty) {
        buffer.writeln('  📲 UPI: `${m.toUpiId}`');
      }
    }
    buffer.writeln();
    buffer.writeln('⚡ Split and settled via *Kaun Dega?*');

    return buffer.toString();
  }
}
