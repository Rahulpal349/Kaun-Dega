import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/user_model.dart';
import '../models/group_model.dart';
import '../models/expense_model.dart';
import '../models/settlement_model.dart';

class StorageService {
  static const String _userKey = 'kd_user_profile';
  static const String _groupsKey = 'kd_groups_list';
  static const String _expensesPrefix = 'kd_expenses_';
  static const String _settlementsPrefix = 'kd_settlements_';
  static const String _isInitializedKey = 'kd_seed_initialized_v2';
  static const String _hasSeenOnboardingKey = 'kd_has_seen_onboarding';

  final Uuid _uuid = const Uuid();

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  /// Initialize storage cleanly without any fake mock data
  Future<void> initializeDemoDataIfNeeded() async {
    final prefs = await _prefs;
    final isInit = prefs.getBool(_isInitializedKey) ?? false;
    if (isInit) return;

    if (!prefs.containsKey(_groupsKey)) {
      await prefs.setString(_groupsKey, '[]');
    }

    await prefs.setBool(_isInitializedKey, true);
  }

  /// Completely wipe all stored user data, groups, and expenses
  Future<void> clearAllData() async {
    final prefs = await _prefs;
    final keys = prefs.getKeys().toList();
    for (final key in keys) {
      if (key.startsWith(_expensesPrefix) ||
          key.startsWith(_settlementsPrefix) ||
          key == _groupsKey ||
          key == _userKey) {
        await prefs.remove(key);
      }
    }
  }

  // --- User Profile ---
  Future<UserModel?> getUserProfile() async {
    final prefs = await _prefs;
    final jsonStr = prefs.getString(_userKey);
    if (jsonStr == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(jsonStr));
    } catch (_) {
      return null;
    }
  }

  Future<void> saveUserProfile(UserModel user) async {
    final prefs = await _prefs;
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  Future<void> clearUserSession() async {
    final prefs = await _prefs;
    await prefs.remove(_userKey);
  }

  // --- Groups ---
  Future<List<GroupModel>> getGroups(String currentUserId, {String? currentUserEmail}) async {
    final prefs = await _prefs;
    final jsonStr = prefs.getString(_groupsKey);
    if (jsonStr == null) return [];
    try {
      final List raw = jsonDecode(jsonStr);
      final emailLower = currentUserEmail?.toLowerCase().trim();
      final groups = raw
          .map((e) => GroupModel.fromJson(Map<String, dynamic>.from(e), currentUserId: currentUserId))
          .where((g) =>
              g.memberIds.contains(currentUserId) ||
              (emailLower != null &&
                  emailLower.isNotEmpty &&
                  g.members.values.any((m) => m.email.toLowerCase().trim() == emailLower)))
          .toList();
      groups.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return groups;
    } catch (_) {
      return [];
    }
  }

  Future<void> saveGroups(List<GroupModel> groups) async {
    final prefs = await _prefs;
    final list = groups.map((g) => g.toJson()).toList();
    await prefs.setString(_groupsKey, jsonEncode(list));
  }

  Future<GroupModel> createGroup({
    required String name,
    required String icon,
    required UserModel currentUser,
    required List<String> extraParticipants,
  }) async {
    final groupId = 'grp_${_uuid.v4().substring(0, 8)}';
    final Map<String, UserModel> members = {
      currentUser.id: currentUser.copyWith(role: 'admin'),
    };
    final List<String> memberIds = [currentUser.id];

    for (final p in extraParticipants) {
      if (p.trim().isEmpty) continue;
      final clean = p.trim();
      final isEmail = clean.contains('@');
      final shadowId = 'usr_shadow_${_uuid.v4().substring(0, 6)}';

      final shadowUser = UserModel(
        id: shadowId,
        name: isEmail ? clean.split('@')[0] : clean,
        email: isEmail ? clean : '',
        role: 'member',
        isShadow: true,
      );
      members[shadowId] = shadowUser;
      memberIds.add(shadowId);
    }

    final newGroup = GroupModel(
      id: groupId,
      name: name,
      emoji: icon,
      icon: icon,
      createdBy: currentUser.id,
      memberIds: memberIds,
      members: members,
      myRole: 'admin',
    );

    final allGroups = await getGroups(currentUser.id);
    allGroups.insert(0, newGroup);
    await saveGroups(allGroups);

    return newGroup;
  }

  Future<GroupModel?> getGroupById(String groupId, String currentUserId) async {
    final allGroups = await getGroups(currentUserId);
    try {
      return allGroups.firstWhere((g) => g.id == groupId);
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteGroup(String groupId, String currentUserId) async {
    final allGroups = await getGroups(currentUserId);
    allGroups.removeWhere((g) => g.id == groupId);
    await saveGroups(allGroups);

    final prefs = await _prefs;
    await prefs.remove('$_expensesPrefix$groupId');
    await prefs.remove('$_settlementsPrefix$groupId');
  }

  Future<void> leaveGroup(String groupId, String currentUserId) async {
    await removeMemberFromGroup(groupId, currentUserId);
  }

  Future<void> addMemberToGroup(String groupId, String participantName, String currentUserId) async {
    final group = await getGroupById(groupId, currentUserId);
    if (group == null) return;

    final shadowId = 'usr_shadow_${_uuid.v4().substring(0, 6)}';
    final shadowUser = UserModel(
      id: shadowId,
      name: participantName.trim(),
      role: 'member',
      isShadow: true,
    );

    final updatedMembers = Map<String, UserModel>.from(group.members);
    updatedMembers[shadowId] = shadowUser;

    final updatedMemberIds = List<String>.from(group.memberIds);
    if (!updatedMemberIds.contains(shadowId)) {
      updatedMemberIds.add(shadowId);
    }

    final updatedGroup = GroupModel(
      id: group.id,
      name: group.name,
      emoji: group.emoji,
      icon: group.icon,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      memberIds: updatedMemberIds,
      members: updatedMembers,
      myRole: group.myRole,
    );

    final allGroups = await getGroups(currentUserId);
    final idx = allGroups.indexWhere((g) => g.id == groupId);
    if (idx != -1) {
      allGroups[idx] = updatedGroup;
      await saveGroups(allGroups);
    }
  }

  Future<void> removeMemberFromGroup(String groupId, String memberId) async {
    final prefs = await _prefs;
    final jsonStr = prefs.getString(_groupsKey);
    if (jsonStr == null) return;
    try {
      final List raw = jsonDecode(jsonStr);
      final List<Map<String, dynamic>> updated = [];
      for (final item in raw) {
        final g = Map<String, dynamic>.from(item);
        if (g['id'] == groupId) {
          final members = Map<String, dynamic>.from(g['members'] ?? {});
          members.remove(memberId);
          final List mIds = List.from(g['memberIds'] ?? []);
          mIds.remove(memberId);
          g['members'] = members;
          g['memberIds'] = mIds;
        }
        updated.add(g);
      }
      await prefs.setString(_groupsKey, jsonEncode(updated));
    } catch (_) {}
  }

  // --- Expenses ---
  Future<List<ExpenseModel>> getExpenses(String groupId) async {
    final prefs = await _prefs;
    final jsonStr = prefs.getString('$_expensesPrefix$groupId');
    if (jsonStr == null) return [];
    try {
      final List raw = jsonDecode(jsonStr);
      final list = raw.map((e) => ExpenseModel.fromJson(Map<String, dynamic>.from(e))).toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    } catch (_) {
      return [];
    }
  }

  Future<void> saveExpenses(String groupId, List<ExpenseModel> expenses) async {
    final prefs = await _prefs;
    final list = expenses.map((e) => e.toJson()).toList();
    await prefs.setString('$_expensesPrefix$groupId', jsonEncode(list));
  }

  Future<ExpenseModel> addExpense({
    required String groupId,
    required String description,
    required double amount,
    required String paidBy,
    required String splitType,
    required List<ExpenseShare> shares,
    required PayerInfo payer,
    String note = '',
  }) async {
    final expenseId = 'exp_${_uuid.v4().substring(0, 8)}';
    final expense = ExpenseModel(
      id: expenseId,
      groupId: groupId,
      description: description,
      amount: amount,
      paidBy: paidBy,
      splitType: splitType,
      shares: shares,
      payer: payer,
      note: note,
    );

    final currentExpenses = await getExpenses(groupId);
    currentExpenses.insert(0, expense);
    await saveExpenses(groupId, currentExpenses);

    return expense;
  }

  Future<void> updateExpense(ExpenseModel updatedExpense) async {
    final currentExpenses = await getExpenses(updatedExpense.groupId);
    final idx = currentExpenses.indexWhere((e) => e.id == updatedExpense.id);
    if (idx != -1) {
      currentExpenses[idx] = updatedExpense;
      await saveExpenses(updatedExpense.groupId, currentExpenses);
    }
  }

  Future<void> deleteExpense(String groupId, String expenseId) async {
    final currentExpenses = await getExpenses(groupId);
    currentExpenses.removeWhere((e) => e.id == expenseId);
    await saveExpenses(groupId, currentExpenses);
  }

  // --- Settlements ---
  Future<List<SettlementModel>> getSettlements(String groupId) async {
    final prefs = await _prefs;
    final jsonStr = prefs.getString('$_settlementsPrefix$groupId');
    if (jsonStr == null) return [];
    try {
      final List raw = jsonDecode(jsonStr);
      return raw.map((e) => SettlementModel.fromJson(Map<String, dynamic>.from(e))).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> saveSettlements(String groupId, List<SettlementModel> settlements) async {
    final prefs = await _prefs;
    final list = settlements.map((s) => s.toJson()).toList();
    await prefs.setString('$_settlementsPrefix$groupId', jsonEncode(list));
  }

  Future<SettlementModel> recordSettlement({
    required String groupId,
    required String fromUser,
    required String toUser,
    required double amount,
  }) async {
    final settlementId = 'stl_${_uuid.v4().substring(0, 8)}';
    final settlement = SettlementModel(
      id: settlementId,
      groupId: groupId,
      fromUser: fromUser,
      toUser: toUser,
      amount: amount,
    );

    final list = await getSettlements(groupId);
    list.insert(0, settlement);
    await saveSettlements(groupId, list);

    return settlement;
  }

  // --- Global Activity Timeline ---
  Future<List<ExpenseModel>> getAllExpensesAcrossGroups(String currentUserId) async {
    final groups = await getGroups(currentUserId);
    final List<ExpenseModel> all = [];

    for (final g in groups) {
      final expenses = await getExpenses(g.id);
      for (final e in expenses) {
        all.add(ExpenseModel(
          id: e.id,
          groupId: e.groupId,
          description: e.description,
          amount: e.amount,
          paidBy: e.paidBy,
          splitType: e.splitType,
          shares: e.shares,
          payer: e.payer,
          createdAt: e.createdAt,
          note: e.note,
          groupName: g.name,
          groupEmoji: g.icon,
        ));
      }
    }

    all.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return all;
  }

  // --- Onboarding Preference ---
  Future<bool> hasSeenOnboarding() async {
    final prefs = await _prefs;
    return prefs.getBool(_hasSeenOnboardingKey) ?? false;
  }

  Future<void> setHasSeenOnboarding(bool value) async {
    final prefs = await _prefs;
    await prefs.setBool(_hasSeenOnboardingKey, value);
  }
}
