class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String upiId;
  final String gender;
  final String avatarUrl;
  final String role; // 'admin' | 'member' | 'former'
  final bool isShadow;
  final String createdAt;

  UserModel({
    required this.id,
    required this.name,
    this.email = '',
    this.phone = '',
    this.upiId = '',
    this.gender = '',
    this.avatarUrl = '',
    this.role = 'member',
    this.isShadow = false,
    String? createdAt,
  }) : createdAt = createdAt ?? DateTime.now().toIso8601String();

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'User',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      upiId: json['upi_id'] ?? json['upiId'] ?? '',
      gender: json['gender'] ?? '',
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'] ?? '',
      role: json['role'] ?? 'member',
      isShadow: json['isShadow'] ?? false,
      createdAt: json['created_at'] ?? json['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'upi_id': upiId,
      'gender': gender,
      'avatar_url': avatarUrl,
      'role': role,
      'isShadow': isShadow,
      'created_at': createdAt,
    };
  }

  UserModel copyWith({
    String? name,
    String? email,
    String? phone,
    String? upiId,
    String? gender,
    String? avatarUrl,
    String? role,
    bool? isShadow,
  }) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      upiId: upiId ?? this.upiId,
      gender: gender ?? this.gender,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role ?? this.role,
      isShadow: isShadow ?? this.isShadow,
      createdAt: createdAt,
    );
  }
}
