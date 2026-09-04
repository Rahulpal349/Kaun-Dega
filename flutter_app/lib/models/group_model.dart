import 'user_model.dart';

class GroupModel {
  final String id;
  final String name;
  final String emoji;
  final String icon;
  final String createdBy;
  final String createdAt;
  final List<String> memberIds;
  final Map<String, UserModel> members;
  final String myRole;

  GroupModel({
    required this.id,
    required this.name,
    this.emoji = '🧾',
    this.icon = 'other',
    required this.createdBy,
    String? createdAt,
    this.memberIds = const [],
    this.members = const {},
    this.myRole = 'member',
  }) : createdAt = createdAt ?? DateTime.now().toIso8601String();

  factory GroupModel.fromJson(Map<String, dynamic> json, {String currentUserId = ''}) {
    final rawMembers = json['members'];
    final Map<String, UserModel> parsedMembers = {};
    if (rawMembers is Map) {
      rawMembers.forEach((key, val) {
        if (val is Map<String, dynamic>) {
          parsedMembers[key.toString()] = UserModel.fromJson(val);
        } else if (val is Map) {
          parsedMembers[key.toString()] = UserModel.fromJson(Map<String, dynamic>.from(val));
        }
      });
    }

    List<String> mIds = [];
    if (json['memberIds'] is List) {
      mIds = (json['memberIds'] as List).map((e) => e.toString()).toList();
    } else {
      mIds = parsedMembers.keys.toList();
    }

    String userRole = 'member';
    if (currentUserId.isNotEmpty && parsedMembers.containsKey(currentUserId)) {
      userRole = parsedMembers[currentUserId]!.role;
    } else if (json['created_by'] == currentUserId || json['createdBy'] == currentUserId) {
      userRole = 'admin';
    }

    return GroupModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Group',
      emoji: json['emoji'] ?? '🧾',
      icon: json['icon'] ?? json['emoji'] ?? 'other',
      createdBy: json['created_by'] ?? json['createdBy'] ?? '',
      createdAt: json['created_at'] ?? json['createdAt'] ?? '',
      memberIds: mIds,
      members: parsedMembers,
      myRole: json['myRole'] ?? userRole,
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> memberJson = {};
    members.forEach((key, val) => memberJson[key] = val.toJson());

    return {
      'id': id,
      'name': name,
      'emoji': emoji,
      'icon': icon,
      'created_by': createdBy,
      'created_at': createdAt,
      'memberIds': memberIds,
      'members': memberJson,
    };
  }

  List<UserModel> get memberList => members.values.toList();
}
