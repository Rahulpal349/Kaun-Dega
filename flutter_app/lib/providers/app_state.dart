import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../models/group_model.dart';
import '../models/expense_model.dart';
import '../models/settlement_model.dart';
import '../models/balance_model.dart';
import '../services/storage_service.dart';
import '../services/balance_service.dart';

class AppState extends ChangeNotifier {
  final StorageService _storage = StorageService();

  UserModel? _currentUser;
  bool _isLoading = true;
  String? _error;

  List<GroupModel> _groups = [];
  double _consolidatedBalance = 0.0;
  double _totalSpent = 0.0;

  // Active Group Details
  GroupModel? _activeGroup;
  List<ExpenseModel> _activeExpenses = [];
  List<SettlementModel> _activeSettlements = [];
  GroupBalanceReport _activeBalanceReport = GroupBalanceReport(balances: [], moves: []);
  bool _isActiveGroupLoading = false;

  // Global Activity Timeline
  List<ExpenseModel> _allExpenses = [];
  bool _isActivityLoading = false;

  // Getters
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<GroupModel> get groups => _groups;
  double get consolidatedBalance => _consolidatedBalance;
  double get totalSpent => _totalSpent;

  GroupModel? get activeGroup => _activeGroup;
  List<ExpenseModel> get activeExpenses => _activeExpenses;
  List<SettlementModel> get activeSettlements => _activeSettlements;
  GroupBalanceReport get activeBalanceReport => _activeBalanceReport;
  bool get isActiveGroupLoading => _isActiveGroupLoading;

  List<ExpenseModel> get allExpenses => _allExpenses;
  bool get isActivityLoading => _isActivityLoading;

  AppState() {
    init();
  }

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _storage.initializeDemoDataIfNeeded();
      _currentUser = await _storage.getUserProfile();
      if (_currentUser != null) {
        await refreshDashboard();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // --- Auth & Profile ---
  Future<void> loginWithGoogle() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Simulate/Authenticate Google sign-in
      var user = await _storage.getUserProfile();
      user ??= UserModel(
        id: 'usr_${DateTime.now().millisecondsSinceEpoch}',
        name: 'Google User',
        email: 'user@gmail.com',
        upiId: 'user@okhdfcbank',
      );
      _currentUser = user;
      await _storage.saveUserProfile(user);
      await refreshDashboard();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loginWithEmail(String email, String password, {String name = ''}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = UserModel(
        id: 'usr_${DateTime.now().millisecondsSinceEpoch}',
        name: name.isNotEmpty ? name : email.split('@')[0],
        email: email,
        upiId: '${email.split('@')[0]}@upi',
      );
      _currentUser = user;
      await _storage.saveUserProfile(user);
      await refreshDashboard();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({
    required String name,
    String? phone,
    String? upiId,
    String? gender,
    String? avatarUrl,
  }) async {
    if (_currentUser == null) return;

    final updated = _currentUser!.copyWith(
      name: name,
      phone: phone,
      upiId: upiId,
      gender: gender,
      avatarUrl: avatarUrl,
    );

    _currentUser = updated;
    await _storage.saveUserProfile(updated);
    await refreshDashboard();
    notifyListeners();
  }

  Future<void> logout() async {
    _currentUser = null;
    _groups = [];
    _activeGroup = null;
    await _storage.clearUserSession();
    notifyListeners();
  }

  // --- Dashboard & Groups ---
  Future<void> refreshDashboard() async {
    if (_currentUser == null) return;

    try {
      _groups = await _storage.getGroups(_currentUser!.id);

      double totalBal = 0.0;
      double totalCharged = 0.0;

      for (final g in _groups) {
        final expenses = await _storage.getExpenses(g.id);
        final settlements = await _storage.getSettlements(g.id);
        final report = BalanceService.computeBalances(
          members: g.memberList,
          expenses: expenses,
          settlements: settlements,
        );

        final myBal = report.balances.cast<UserBalance?>().firstWhere(
          (b) => b?.id == _currentUser!.id,
          orElse: () => null,
        );

        if (myBal != null) {
          totalBal += myBal.amount;
          totalCharged += myBal.charged;
        }
      }

      _consolidatedBalance = double.parse(totalBal.toStringAsFixed(2));
      _totalSpent = double.parse(totalCharged.toStringAsFixed(2));
    } catch (e) {
      _error = e.toString();
    }
    notifyListeners();
  }

  Future<GroupModel> createGroup({
    required String name,
    required String icon,
    required List<String> extraParticipants,
  }) async {
    if (_currentUser == null) throw Exception('Must be logged in');

    final group = await _storage.createGroup(
      name: name,
      icon: icon,
      currentUser: _currentUser!,
      extraParticipants: extraParticipants,
    );

    await refreshDashboard();
    return group;
  }

  Future<void> deleteGroup(String groupId) async {
    if (_currentUser == null) return;
    await _storage.deleteGroup(groupId, _currentUser!.id);
    if (_activeGroup?.id == groupId) {
      _activeGroup = null;
    }
    await refreshDashboard();
  }

  Future<void> leaveGroup(String groupId) async {
    if (_currentUser == null) return;
    await _storage.leaveGroup(groupId, _currentUser!.id);
    if (_activeGroup?.id == groupId) {
      _activeGroup = null;
    }
    await refreshDashboard();
  }

  // --- Active Group Details ---
  Future<void> loadGroupDetails(String groupId) async {
    if (_currentUser == null) return;
    _isActiveGroupLoading = true;
    notifyListeners();

    try {
      _activeGroup = await _storage.getGroupById(groupId, _currentUser!.id);
      if (_activeGroup != null) {
        _activeExpenses = await _storage.getExpenses(groupId);
        _activeSettlements = await _storage.getSettlements(groupId);
        _recomputeActiveBalances();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isActiveGroupLoading = false;
      notifyListeners();
    }
  }

  void _recomputeActiveBalances() {
    if (_activeGroup == null) return;
    _activeBalanceReport = BalanceService.computeBalances(
      members: _activeGroup!.memberList,
      expenses: _activeExpenses,
      settlements: _activeSettlements,
    );
  }

  Future<void> addShadowMemberToActiveGroup(String name) async {
    if (_activeGroup == null || _currentUser == null) return;
    await _storage.addMemberToGroup(_activeGroup!.id, name, _currentUser!.id);
    await loadGroupDetails(_activeGroup!.id);
    await refreshDashboard();
  }

  Future<void> removeMemberFromActiveGroup(String memberId) async {
    if (_activeGroup == null) return;
    await _storage.removeMemberFromGroup(_activeGroup!.id, memberId);
    await loadGroupDetails(_activeGroup!.id);
    await refreshDashboard();
  }

  // --- Expense Operations ---
  Future<void> addExpense({
    required String groupId,
    required String description,
    required double amount,
    required String paidBy,
    required String splitType,
    required List<ExpenseShare> shares,
    String note = '',
  }) async {
    if (_activeGroup == null) return;

    final payerMember = _activeGroup!.members[paidBy];
    final payerInfo = PayerInfo(
      id: paidBy,
      name: payerMember?.name ?? 'Member',
      upiId: payerMember?.upiId,
    );

    await _storage.addExpense(
      groupId: groupId,
      description: description,
      amount: amount,
      paidBy: paidBy,
      splitType: splitType,
      shares: shares,
      payer: payerInfo,
      note: note,
    );

    await loadGroupDetails(groupId);
    await refreshDashboard();
  }

  Future<void> updateExpense(ExpenseModel updatedExpense) async {
    await _storage.updateExpense(updatedExpense);
    await loadGroupDetails(updatedExpense.groupId);
    await refreshDashboard();
  }

  Future<void> updateExpensePayer(String expenseId, String newPayerId) async {
    if (_activeGroup == null) return;
    final exp = _activeExpenses.firstWhere((e) => e.id == expenseId);
    final newPayer = _activeGroup!.members[newPayerId];

    final updated = ExpenseModel(
      id: exp.id,
      groupId: exp.groupId,
      description: exp.description,
      amount: exp.amount,
      paidBy: newPayerId,
      splitType: exp.splitType,
      shares: exp.shares,
      payer: PayerInfo(
        id: newPayerId,
        name: newPayer?.name ?? 'Member',
        upiId: newPayer?.upiId,
      ),
      createdAt: exp.createdAt,
      note: exp.note,
    );

    await updateExpense(updated);
  }

  Future<void> deleteExpense(String expenseId) async {
    if (_activeGroup == null) return;
    await _storage.deleteExpense(_activeGroup!.id, expenseId);
    await loadGroupDetails(_activeGroup!.id);
    await refreshDashboard();
  }

  // --- Settlements ---
  Future<void> recordSettlement({
    required String groupId,
    required String fromUser,
    required String toUser,
    required double amount,
  }) async {
    await _storage.recordSettlement(
      groupId: groupId,
      fromUser: fromUser,
      toUser: toUser,
      amount: amount,
    );
    await loadGroupDetails(groupId);
    await refreshDashboard();
  }

  // --- Global Activity Timeline ---
  Future<void> loadAllActivity() async {
    if (_currentUser == null) return;
    _isActivityLoading = true;
    notifyListeners();

    try {
      _allExpenses = await _storage.getAllExpensesAcrossGroups(_currentUser!.id);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isActivityLoading = false;
      notifyListeners();
    }
  }

  // --- Join via Code ---
  Future<GroupModel?> joinGroupByCode(String code) async {
    if (_currentUser == null) return null;
    // Look up group or join demo
    final groups = await _storage.getGroups(_currentUser!.id);
    try {
      return groups.firstWhere((g) => g.id.toLowerCase().contains(code.toLowerCase()));
    } catch (_) {
      return null;
    }
  }
}
