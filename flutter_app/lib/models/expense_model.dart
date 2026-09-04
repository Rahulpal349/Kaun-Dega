class ExpenseShare {
  final String userId;
  final double amount;

  ExpenseShare({
    required this.userId,
    required this.amount,
  });

  factory ExpenseShare.fromJson(Map<String, dynamic> json) {
    final rawAmt = json['share_amount'] ?? json['amount'] ?? 0;
    return ExpenseShare(
      userId: json['user_id'] ?? json['userId'] ?? '',
      amount: (rawAmt is num) ? rawAmt.toDouble() : double.tryParse(rawAmt.toString()) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'userId': userId,
      'share_amount': amount,
      'amount': amount,
    };
  }
}

class PayerInfo {
  final String id;
  final String name;
  final String? upiId;

  PayerInfo({
    required this.id,
    required this.name,
    this.upiId,
  });

  factory PayerInfo.fromJson(Map<String, dynamic> json) {
    return PayerInfo(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Member',
      upiId: json['upi_id'] ?? json['upiId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'upi_id': upiId,
    };
  }
}

class ExpenseModel {
  final String id;
  final String groupId;
  final String description;
  final double amount;
  final String paidBy;
  final String splitType; // 'equal' | 'custom'
  final List<ExpenseShare> shares;
  final PayerInfo payer;
  final String createdAt;
  final String note;

  // Optional attached group info when fetched in global activity
  final String? groupName;
  final String? groupEmoji;

  ExpenseModel({
    required this.id,
    required this.groupId,
    required this.description,
    required this.amount,
    required this.paidBy,
    this.splitType = 'equal',
    this.shares = const [],
    required this.payer,
    String? createdAt,
    this.note = '',
    this.groupName,
    this.groupEmoji,
  }) : createdAt = createdAt ?? DateTime.now().toIso8601String();

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    final rawAmt = json['amount'] ?? 0;
    final double parsedAmount = (rawAmt is num) ? rawAmt.toDouble() : double.tryParse(rawAmt.toString()) ?? 0.0;

    final rawShares = json['expense_shares'] ?? json['shares'] ?? [];
    List<ExpenseShare> parsedShares = [];
    if (rawShares is List) {
      parsedShares = rawShares.map((s) {
        if (s is Map<String, dynamic>) {
          return ExpenseShare.fromJson(s);
        } else if (s is Map) {
          return ExpenseShare.fromJson(Map<String, dynamic>.from(s));
        }
        return ExpenseShare(userId: '', amount: 0);
      }).toList();
    }

    PayerInfo parsedPayer;
    if (json['payer'] is Map) {
      parsedPayer = PayerInfo.fromJson(Map<String, dynamic>.from(json['payer']));
    } else {
      parsedPayer = PayerInfo(id: json['paid_by'] ?? json['paidBy'] ?? '', name: 'Member');
    }

    String? gName;
    String? gEmoji;
    if (json['group'] is Map) {
      gName = json['group']['name'];
      gEmoji = json['group']['emoji'] ?? json['group']['icon'];
    }

    return ExpenseModel(
      id: json['id'] ?? '',
      groupId: json['groupId'] ?? '',
      description: json['description'] ?? '',
      amount: parsedAmount,
      paidBy: json['paid_by'] ?? json['paidBy'] ?? '',
      splitType: json['split_type'] ?? json['splitType'] ?? 'equal',
      shares: parsedShares,
      payer: parsedPayer,
      createdAt: json['created_at'] ?? json['createdAt'] ?? '',
      note: json['note'] ?? '',
      groupName: gName,
      groupEmoji: gEmoji,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'groupId': groupId,
      'description': description,
      'amount': amount,
      'paid_by': paidBy,
      'paidBy': paidBy,
      'split_type': splitType,
      'splitType': splitType,
      'expense_shares': shares.map((s) => s.toJson()).toList(),
      'shares': shares.map((s) => s.toJson()).toList(),
      'payer': payer.toJson(),
      'created_at': createdAt,
      'note': note,
    };
  }
}
