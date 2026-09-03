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

  final Uuid _uuid = const Uuid();

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  /// Initialize default demo seeds if fresh install
  Future<void> initializeDemoDataIfNeeded() async {
    final prefs = await _prefs;
    final isInit = prefs.getBool(_isInitializedKey) ?? false;
    if (isInit) return;

    // Create current user profile
    final currentUser = UserModel(
      id: 'usr_me_01',
      name: 'Manas Dey',
      email: 'manas@example.com',
      phone: '+91 98765 43210',
      upiId: 'manas@okhdfcbank',
      gender: 'Male',
      createdAt: DateTime.now().subtract(const Duration(days: 30)).toIso8601String(),
    );
    await saveUserProfile(currentUser);

    // Member pool
    final rahul = UserModel(id: 'usr_rahul', name: 'Rahul Pal', email: 'rahul@example.com', upiId: 'rahul@upi');
    final aman = UserModel(id: 'usr_aman', name: 'Aman Sharma', email: 'aman@example.com', upiId: 'aman@ybl');
    final priya = UserModel(id: 'usr_priya', name: 'Priya Singh', email: 'priya@example.com', upiId: 'priya@paytm');
    final rohit = UserModel(id: 'usr_rohit', name: 'Rohit Verma', email: 'rohit@example.com', upiId: 'rohit@okaxis');

    // Group 1: Goa Beach Trip 🏖️
    final goaGroupId = 'grp_goa_01';
    final goaGroup = GroupModel(
      id: goaGroupId,
      name: 'Goa Beach Trip 🏖️',
      emoji: 'trip',
      icon: 'trip',
      createdBy: currentUser.id,
      memberIds: [currentUser.id, rahul.id, aman.id, priya.id],
      members: {
        currentUser.id: currentUser.copyWith(role: 'admin'),
        rahul.id: rahul,
        aman.id: aman,
        priya.id: priya,
      },
      createdAt: DateTime.now().subtract(const Duration(days: 5)).toIso8601String(),
    );

    // Group 2: Flat 402 Roommates 🏠
    final flatGroupId = 'grp_flat_02';
    final flatGroup = GroupModel(
      id: flatGroupId,
      name: 'Flat 402 Roommates 🏠',
      emoji: 'home',
      icon: 'home',
      createdBy: currentUser.id,
      memberIds: [currentUser.id, rahul.id, rohit.id],
      members: {
        currentUser.id: currentUser.copyWith(role: 'admin'),
        rahul.id: rahul,
        rohit.id: rohit,
      },
      createdAt: DateTime.now().subtract(const Duration(days: 20)).toIso8601String(),
    );

    // Group 3: Office Chai & Samosa ☕
    final chaiGroupId = 'grp_chai_03';
    final chaiGroup = GroupModel(
      id: chaiGroupId,
      name: 'Office Chai Club ☕',
      emoji: 'food',
      icon: 'food',
      createdBy: rahul.id,
      memberIds: [currentUser.id, rahul.id, aman.id, rohit.id],
      members: {
        currentUser.id: currentUser,
        rahul.id: rahul.copyWith(role: 'admin'),
        aman.id: aman,
        rohit.id: rohit,
      },
      createdAt: DateTime.now().subtract(const Duration(days: 15)).toIso8601String(),
    );

    await saveGroups([goaGroup, flatGroup, chaiGroup]);

    // Add sample expenses for Goa Group
    final goaExpenses = [
      ExpenseModel(
        id: 'exp_01',
        groupId: goaGroupId,
        description: 'Beach Shack Seafood & Drinks',
        amount: 3600.0,
        paidBy: currentUser.id,
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: currentUser.id, amount: 900.0),
          ExpenseShare(userId: rahul.id, amount: 900.0),
          ExpenseShare(userId: aman.id, amount: 900.0),
          ExpenseShare(userId: priya.id, amount: 900.0),
        ],
        payer: PayerInfo(id: currentUser.id, name: currentUser.name, upiId: currentUser.upiId),
        createdAt: DateTime.now().subtract(const Duration(days: 2, hours: 3)).toIso8601String(),
      ),
      ExpenseModel(
        id: 'exp_02',
        groupId: goaGroupId,
        description: 'Scooty Rental (2 Bikes)',
        amount: 2000.0,
        paidBy: rahul.id,
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: currentUser.id, amount: 500.0),
          ExpenseShare(userId: rahul.id, amount: 500.0),
          ExpenseShare(userId: aman.id, amount: 500.0),
          ExpenseShare(userId: priya.id, amount: 500.0),
        ],
        payer: PayerInfo(id: rahul.id, name: rahul.name, upiId: rahul.upiId),
        createdAt: DateTime.now().subtract(const Duration(days: 3, hours: 5)).toIso8601String(),
      ),
      ExpenseModel(
        id: 'exp_03',
        groupId: goaGroupId,
        description: 'Scuba Diving Advance',
        amount: 6000.0,
        paidBy: priya.id,
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: currentUser.id, amount: 1500.0),
          ExpenseShare(userId: rahul.id, amount: 1500.0),
          ExpenseShare(userId: aman.id, amount: 1500.0),
          ExpenseShare(userId: priya.id, amount: 1500.0),
        ],
        payer: PayerInfo(id: priya.id, name: priya.name, upiId: priya.upiId),
        createdAt: DateTime.now().subtract(const Duration(days: 4, hours: 1)).toIso8601String(),
      ),
    ];
    await saveExpenses(goaGroupId, goaExpenses);

    // Add sample expenses for Flat Group
    final flatExpenses = [
      ExpenseModel(
        id: 'exp_11',
        groupId: flatGroupId,
        description: 'High Speed WiFi Bill',
        amount: 1200.0,
        paidBy: currentUser.id,
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: currentUser.id, amount: 400.0),
          ExpenseShare(userId: rahul.id, amount: 400.0),
          ExpenseShare(userId: rohit.id, amount: 400.0),
        ],
        payer: PayerInfo(id: currentUser.id, name: currentUser.name, upiId: currentUser.upiId),
        createdAt: DateTime.now().subtract(const Duration(days: 8)).toIso8601String(),
      ),
      ExpenseModel(
        id: 'exp_12',
        groupId: flatGroupId,
        description: 'Grocery & Domestic Supplies',
        amount: 2850.0,
        paidBy: rohit.id,
        splitType: 'equal',
        shares: [
          ExpenseShare(userId: currentUser.id, amount: 950.0),
          ExpenseShare(userId: rahul.id, amount: 950.0),
          ExpenseShare(userId: rohit.id, amount: 950.0),
        ],
        payer: PayerInfo(id: rohit.id, name: rohit.name, upiId: rohit.upiId),
        createdAt: DateTime.now().subtract(const Duration(days: 12)).toIso8601String(),
      ),
    ];
    await saveExpenses(flatGroupId, flatExpenses);

    // Mark seeded
    await prefs.setBool(_isInitializedKey, true);
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
  Future<List<GroupModel>> getGroups(String currentUserId) async {
    final prefs = await _prefs;
    final jsonStr = prefs.getString(_groupsKey);
    if (jsonStr == null) return [];
    try {
      final List raw = jsonDecode(jsonStr);
      final groups = raw
          .map((e) => GroupModel.fromJson(Map<String, dynamic>.from(e), currentUserId: currentUserId))
          .where((g) => g.memberIds.contains(currentUserId))
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
}
