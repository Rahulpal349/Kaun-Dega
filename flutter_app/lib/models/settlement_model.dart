class SettlementModel {
  final String id;
  final String groupId;
  final String fromUser;
  final String toUser;
  final double amount;
  final String createdAt;

  SettlementModel({
    required this.id,
    required this.groupId,
    required this.fromUser,
    required this.toUser,
    required this.amount,
    String? createdAt,
  }) : createdAt = createdAt ?? DateTime.now().toIso8601String();

  factory SettlementModel.fromJson(Map<String, dynamic> json) {
    final rawAmt = json['amount'] ?? 0;
    final double parsedAmount = (rawAmt is num) ? rawAmt.toDouble() : double.tryParse(rawAmt.toString()) ?? 0.0;

    return SettlementModel(
      id: json['id'] ?? '',
      groupId: json['groupId'] ?? '',
      fromUser: json['from_user'] ?? json['fromUser'] ?? '',
      toUser: json['to_user'] ?? json['toUser'] ?? '',
      amount: parsedAmount,
      createdAt: json['created_at'] ?? json['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'groupId': groupId,
      'from_user': fromUser,
      'fromUser': fromUser,
      'to_user': toUser,
      'toUser': toUser,
      'amount': amount,
      'created_at': createdAt,
    };
  }
}
