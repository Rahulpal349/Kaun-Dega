import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user_model.dart';
import '../models/group_model.dart';
import '../models/expense_model.dart';
import '../models/settlement_model.dart';
import '../models/balance_model.dart';
import '../services/storage_service.dart';
import '../services/balance_service.dart';
import '../services/notification_service.dart';

class AppState extends ChangeNotifier {
  final StorageService _storage = StorageService();
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '53793768201-2q4alqb6cbqjmj74vtgo3nuga1tqvn67.apps.googleusercontent.com',
    scopes: ['email', 'profile'],
  );

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
  bool _hasSeenOnboarding = false;

  // Getters
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasSeenOnboarding => _hasSeenOnboarding;

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
      _hasSeenOnboarding = await _storage.hasSeenOnboarding();
      _currentUser = await _storage.getUserProfile();
      if (_currentUser != null) {
        _currentUser = await _storage.ensureUserProfile(_currentUser!);
        NotificationService().requestPermissions().then((_) {
          NotificationService().saveTokenForUser(
            userId: _currentUser!.id,
            userEmail: _currentUser!.email,
          );
        });
        await refreshDashboard();
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> completeOnboarding() async {
    _hasSeenOnboarding = true;
    await _storage.setHasSeenOnboarding(true);
    notifyListeners();
  }

  // --- Auth & Profile ---
  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      try {
        await _googleSignIn.signOut();
      } catch (_) {}

      final GoogleSignInAccount? account = await _googleSignIn.signIn();

      if (account == null) {
        // User cancelled the Google sign in dialog
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final email = account.email;
      final existingUser = await _storage.getUserProfileForEmail(email) ??
          await _storage.getUserProfile();

      // Deterministic user ID for the Google account
      final userId = account.id.isNotEmpty
          ? 'usr_${account.id}'
          : (email.isNotEmpty
              ? 'usr_g_${email.toLowerCase().replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}'
              : 'usr_${DateTime.now().millisecondsSinceEpoch}');

      // Preserve custom edited user profile details if previously updated
      final bool hasExisting = existingUser != null;

      final name = (hasExisting && existingUser.name.trim().isNotEmpty)
          ? existingUser.name
          : (account.displayName?.trim().isNotEmpty == true
              ? account.displayName!
              : (email.isNotEmpty ? email.split('@')[0] : 'Google User'));

      final upiId = (hasExisting && existingUser.upiId.trim().isNotEmpty)
          ? existingUser.upiId
          : (email.isNotEmpty ? '${email.split('@')[0]}@okhdfcbank' : '');

      final user = UserModel(
        id: userId,
        name: name,
        email: email,
        phone: hasExisting ? existingUser.phone : '',
        upiId: upiId,
        gender: hasExisting ? existingUser.gender : '',
        avatarUrl: (account.photoUrl?.isNotEmpty == true)
            ? account.photoUrl!
            : (hasExisting ? existingUser.avatarUrl : ''),
        createdAt: (hasExisting && existingUser.createdAt.isNotEmpty)
            ? existingUser.createdAt
            : DateTime.now().toIso8601String(),
      );

      _currentUser = await _storage.ensureUserProfile(user);
      _hasSeenOnboarding = true;
      await _storage.setHasSeenOnboarding(true);
      NotificationService().requestPermissions().then((_) {
        NotificationService().saveTokenForUser(
          userId: user.id,
          userEmail: user.email,
        );
      });
      await refreshDashboard();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> loginWithEmail(String email, String password, {String name = ''}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final emailLower = email.toLowerCase().trim();
      final existingUser = await _storage.getUserProfileForEmail(emailLower);

      final user = UserModel(
        id: existingUser?.id ?? 'usr_${DateTime.now().millisecondsSinceEpoch}',
        name: name.isNotEmpty
            ? name
            : (existingUser?.name.isNotEmpty == true ? existingUser!.name : email.split('@')[0]),
        email: email,
        phone: existingUser?.phone ?? '',
        upiId: existingUser?.upiId.isNotEmpty == true ? existingUser!.upiId : '${email.split('@')[0]}@upi',
        gender: existingUser?.gender ?? '',
        avatarUrl: existingUser?.avatarUrl ?? '',
        createdAt: existingUser?.createdAt ?? DateTime.now().toIso8601String(),
      );
      _currentUser = await _storage.ensureUserProfile(user);
      _hasSeenOnboarding = true;
      await _storage.setHasSeenOnboarding(true);
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

  StreamSubscription<List<GroupModel>>? _groupsSubscription;

  Future<void> logout() async {
    _groupsSubscription?.cancel();
    _currentUser = null;
    _groups = [];
    _activeGroup = null;
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    await _storage.clearUserSession();
    notifyListeners();
  }

  Future<void> deleteAccount() async {
    if (_currentUser == null) return;
    _groupsSubscription?.cancel();
    _currentUser = null;
    _groups = [];
    _activeGroup = null;
    try {
      await _googleSignIn.signOut();
    } catch (_) {}
    await _storage.clearUserSession();
    notifyListeners();
  }

  void _startGroupsRealtimeSubscription() {
    _groupsSubscription?.cancel();
    if (_currentUser == null) return;

    _groupsSubscription = _storage
        .streamGroups(
          currentUserId: _currentUser!.id,
          userEmail: _currentUser!.email,
        )
        .listen((updatedGroups) async {
      _groups = updatedGroups;
      await _recomputeDashboardBalances();
      notifyListeners();
    });
  }

  Future<void> _recomputeDashboardBalances() async {
    if (_currentUser == null) return;
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
  }

  // --- Dashboard & Groups ---
  Future<void> refreshDashboard() async {
    if (_currentUser == null) return;

    try {
      await _storage.claimShadowMemberships(_currentUser!);
      _groups = await _storage.getGroups(_currentUser!.id, currentUserEmail: _currentUser!.email);
      await _recomputeDashboardBalances();
      _startGroupsRealtimeSubscription();
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

  Future<void> updateActiveGroupDetails(String newName, String newIcon) async {
    if (_activeGroup == null || _currentUser == null || newName.trim().isEmpty) return;
    final cleanName = newName.trim();
    final groupId = _activeGroup!.id;

    _activeGroup = GroupModel(
      id: _activeGroup!.id,
      name: cleanName,
      emoji: newIcon,
      icon: newIcon,
      createdBy: _activeGroup!.createdBy,
      createdAt: _activeGroup!.createdAt,
      memberIds: _activeGroup!.memberIds,
      members: _activeGroup!.members,
      myRole: _activeGroup!.myRole,
    );
    notifyListeners();

    await _storage.updateGroupDetails(groupId, cleanName, newIcon, _currentUser!.id);
    await refreshDashboard();
  }

  Future<void> updateActiveGroupName(String newName) async {
    final currentIcon = _activeGroup?.icon ?? 'food';
    await updateActiveGroupDetails(newName, currentIcon);
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

  Future<void> updateMemberNameInActiveGroup(String memberId, String newName) async {
    if (_activeGroup == null) return;
    await _storage.updateMemberName(_activeGroup!.id, memberId, newName);
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
      _allExpenses = await _storage.getAllExpensesAcrossGroups(_currentUser!.id, currentUserEmail: _currentUser!.email);
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
    return await _storage.joinGroupByCode(code, _currentUser!);
  }
}
