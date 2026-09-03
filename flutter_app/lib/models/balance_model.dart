class UserBalance {
  final String id;
  final String name;
  final double amount; // Net balance (+ means is owed, - means owes)
  final double paid;
  final double charged;
  final double settledPaid;
  final double settledReceived;

  UserBalance({
    required this.id,
    required this.name,
    required this.amount,
    this.paid = 0.0,
    this.charged = 0.0,
    this.settledPaid = 0.0,
    this.settledReceived = 0.0,
  });

  factory UserBalance.fromJson(Map<String, dynamic> json) {
    return UserBalance(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Member',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      paid: (json['paid'] is num) ? (json['paid'] as num).toDouble() : 0.0,
      charged: (json['charged'] is num) ? (json['charged'] as num).toDouble() : 0.0,
      settledPaid: (json['settledPaid'] is num) ? (json['settledPaid'] as num).toDouble() : 0.0,
      settledReceived: (json['settledReceived'] is num) ? (json['settledReceived'] as num).toDouble() : 0.0,
    );
  }
}

class SettlementMove {
  final String from;
  final String fromName;
  final String to;
  final String toName;
  final String? toUpiId;
  final double amount;

  SettlementMove({
    required this.from,
    required this.fromName,
    required this.to,
    required this.toName,
    this.toUpiId,
    required this.amount,
  });
}

class GroupBalanceReport {
  final List<UserBalance> balances;
  final List<SettlementMove> moves;

  GroupBalanceReport({
    required this.balances,
    required this.moves,
  });
}
