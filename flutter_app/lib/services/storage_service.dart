import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
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

  bool get _isFirebaseInitialized {
    try {
      return Firebase.apps.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  Future<void> _ensureFirebaseAuth() async {
    if (!_isFirebaseInitialized) return;
    try {
      if (FirebaseAuth.instance.currentUser == null) {
        await FirebaseAuth.instance.signInAnonymously();
      }
    } catch (_) {}
  }

  FirebaseFirestore get _firestore => FirebaseFirestore.instance;

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  /// Initialize storage cleanly
  Future<void> initializeDemoDataIfNeeded() async {
    final prefs = await _prefs;
    final isInit = prefs.getBool(_isInitializedKey) ?? false;
    if (isInit) return;

    if (!prefs.containsKey(_groupsKey)) {
      await prefs.setString(_groupsKey, '[]');
    }

    await prefs.setBool(_isInitializedKey, true);
  }

  /// Completely wipe all local stored user data, groups, and expenses
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
      final user = UserModel.fromJson(jsonDecode(jsonStr));
      // Try background update from Firestore if network is online
      _syncUserProfileFromFirestore(user.id).catchError((_) => null);
      return user;
    } catch (_) {
      return null;
    }
  }

  Future<UserModel?> _syncUserProfileFromFirestore(String uid) async {
    if (!_isFirebaseInitialized || uid.isEmpty) return null;
    try {
      final snap = await _firestore.collection('users').doc(uid).get();
      if (snap.exists && snap.data() != null) {
        final data = snap.data()!;
        final user = UserModel.fromJson({'id': snap.id, ...data});
        final prefs = await _prefs;
        await prefs.setString(_userKey, jsonEncode(user.toJson()));
        return user;
      }
    } catch (e) {
      if (kDebugMode) print('Error syncing user profile from Firestore: $e');
    }
    return null;
  }

  Future<UserModel?> getUserProfileForEmail(String email) async {
    final emailLower = email.toLowerCase().trim();
    if (emailLower.isEmpty) return null;

    if (_isFirebaseInitialized) {
      try {
        final snap = await _firestore
            .collection('users')
            .where('email_lower', isEqualTo: emailLower)
            .limit(1)
            .get();
        if (snap.docs.isNotEmpty) {
          final d = snap.docs.first;
          return UserModel.fromJson({'id': d.id, ...d.data()});
        }
      } catch (_) {}
    }

    final prefs = await _prefs;
    final jsonStr = prefs.getString('kd_user_profile_email_$emailLower');
    if (jsonStr != null) {
      try {
        return UserModel.fromJson(jsonDecode(jsonStr));
      } catch (_) {}
    }
    return null;
  }

  Future<UserModel?> ensureUserProfile(UserModel user, {Map<String, dynamic>? extraData}) async {
    if (user.id.isEmpty) return null;
    if (!_isFirebaseInitialized) {
      await saveUserProfile(user);
      return user;
    }
    await _ensureFirebaseAuth();

    final emailLower = user.email.toLowerCase().trim();

    try {
      final userRef = _firestore.collection('users').doc(user.id);
      final snap = await userRef.get();
      UserModel profile;
      if (!snap.exists) {
        profile = UserModel(
          id: user.id,
          name: (extraData?['name'] as String?)?.trim().isNotEmpty == true
              ? extraData!['name']
              : (user.name.isNotEmpty ? user.name : (user.email.isNotEmpty ? user.email.split('@')[0] : 'User')),
          email: user.email,
          phone: extraData?['phone'] ?? user.phone,
          upiId: extraData?['upi_id'] ?? extraData?['upiId'] ?? user.upiId,
          gender: extraData?['gender'] ?? user.gender,
          avatarUrl: extraData?['avatar_url'] ?? extraData?['avatarUrl'] ?? user.avatarUrl,
          createdAt: DateTime.now().toIso8601String(),
        );

        final firestoreData = {
          'id': profile.id,
          'name': profile.name,
          'email': profile.email,
          'email_lower': emailLower,
          'phone': profile.phone,
          'upi_id': profile.upiId,
          'gender': profile.gender,
          'avatar_url': profile.avatarUrl,
          'created_at': profile.createdAt,
        };
        await userRef.set(firestoreData, SetOptions(merge: true));
      } else {
        final data = snap.data() ?? {};
        profile = UserModel.fromJson({'id': snap.id, ...data});
        if (emailLower.isNotEmpty && data['email_lower'] != emailLower) {
          await userRef.update({'email_lower': emailLower});
        }
      }

      await saveUserProfile(profile);

      if (emailLower.isNotEmpty) {
        claimShadowMemberships(profile).catchError((e) {
          if (kDebugMode) print('claimShadowMemberships background error: $e');
        });
      }
      return profile;
    } catch (err) {
      if (kDebugMode) print('ensureUserProfile error: $err');
      await saveUserProfile(user);
      return user;
    }
  }

  Future<void> claimShadowMemberships(UserModel user) async {
    if (user.id.isEmpty || user.email.isEmpty) return;
    final userEmail = user.email.toLowerCase().trim();

    try {
      final groupsMap = <String, Map<String, dynamic>>{};

      // 1. Query groups by memberEmails array
      try {
        final snapEmails = await _firestore
            .collection('groups')
            .where('memberEmails', arrayContains: userEmail)
            .get();
        for (final doc in snapEmails.docs) {
          groupsMap[doc.id] = {'id': doc.id, ...doc.data()};
        }
      } catch (e) {
        if (kDebugMode) print('Query by memberEmails error: $e');
      }

      // 2. Scan groups for shadow member matching user email
      try {
        final snapAll = await _firestore.collection('groups').get();
        for (final doc in snapAll.docs) {
          final data = doc.data();
          final members = data['members'];
          bool hasMatchingEmail = false;
          if (members is Map) {
            hasMatchingEmail = members.values.any((m) {
              if (m is Map) {
                final em = (m['email'] as String? ?? '').toLowerCase().trim();
                return em == userEmail;
              }
              return false;
            });
          }
          if (hasMatchingEmail) {
            groupsMap[doc.id] = {'id': doc.id, ...data};
          }
        }
      } catch (e) {
        if (kDebugMode) print('Scan all groups error: $e');
      }

      for (final entry in groupsMap.entries) {
        final groupId = entry.key;
        final group = entry.value;
        final members = Map<String, dynamic>.from(group['members'] ?? {});
        final shadowKeysToReplace = <String>[];

        members.forEach((key, val) {
          if (val is Map) {
            final mEmail = (val['email'] as String? ?? '').toLowerCase().trim();
            if (mEmail == userEmail && key != user.id) {
              shadowKeysToReplace.add(key);
            }
          }
        });

        if (shadowKeysToReplace.isNotEmpty) {
          final firstShadow = members[shadowKeysToReplace[0]] as Map? ?? {};
          members[user.id] = {
            'id': user.id,
            'name': user.name.isNotEmpty
                ? user.name
                : (firstShadow['name'] as String? ?? userEmail.split('@')[0]),
            'email': user.email,
            'phone': user.phone.isNotEmpty ? user.phone : (firstShadow['phone'] ?? ''),
            'upi_id': user.upiId.isNotEmpty ? user.upiId : (firstShadow['upi_id'] ?? firstShadow['upiId'] ?? ''),
            'role': firstShadow['role'] ?? 'member',
            'avatar_url': user.avatarUrl.isNotEmpty ? user.avatarUrl : (firstShadow['avatar_url'] ?? ''),
            'isShadow': false,
            'joined_at': firstShadow['joined_at'] ?? DateTime.now().toIso8601String(),
          };

          List<String> memberIds = List<String>.from(group['memberIds'] ?? []);
          for (final oldKey in shadowKeysToReplace) {
            members.remove(oldKey);
            memberIds.remove(oldKey);
          }
          if (!memberIds.contains(user.id)) memberIds.add(user.id);

          List<String> memberEmails = List<String>.from(group['memberEmails'] ?? []);
          if (!memberEmails.contains(userEmail)) memberEmails.add(userEmail);

          await _firestore.collection('groups').doc(groupId).update({
            'members': members,
            'memberIds': memberIds,
            'memberEmails': memberEmails,
          });

          // Migrate expenses referencing old shadow keys
          for (final oldKey in shadowKeysToReplace) {
            final expSnap = await _firestore
                .collection('expenses')
                .where('groupId', isEqualTo: groupId)
                .get();
            for (final expDoc in expSnap.docs) {
              final exp = expDoc.data();
              bool modified = false;
              String paidBy = exp['paid_by'] ?? exp['paidBy'] ?? '';
              if (paidBy == oldKey) {
                paidBy = user.id;
                modified = true;
              }

              final rawShares = exp['expense_shares'] ?? exp['shares'] ?? [];
              final updatedShares = <Map<String, dynamic>>[];
              if (rawShares is List) {
                for (final s in rawShares) {
                  if (s is Map) {
                    final sm = Map<String, dynamic>.from(s);
                    if (sm['user_id'] == oldKey || sm['userId'] == oldKey) {
                      sm['user_id'] = user.id;
                      sm['userId'] = user.id;
                      modified = true;
                    }
                    updatedShares.add(sm);
                  }
                }
              }

              final payer = Map<String, dynamic>.from(exp['payer'] ?? {});
              if (payer['id'] == oldKey) {
                payer['id'] = user.id;
                payer['name'] = user.name;
                modified = true;
              }

              if (modified) {
                await _firestore.collection('expenses').doc(expDoc.id).update({
                  'paid_by': paidBy,
                  'paidBy': paidBy,
                  'expense_shares': updatedShares,
                  'shares': updatedShares,
                  'payer': payer,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      if (kDebugMode) print('Error in claimShadowMemberships: $e');
    }
  }

  Future<void> saveUserProfile(UserModel user) async {
    final prefs = await _prefs;
    final userJson = jsonEncode(user.toJson());

    // Local cache
    await prefs.setString(_userKey, userJson);

    if (user.email.isNotEmpty) {
      final emailLower = user.email.toLowerCase().trim();
      await prefs.setString('kd_user_profile_email_$emailLower', userJson);
    }
    if (user.id.isNotEmpty) {
      await prefs.setString('kd_user_profile_id_${user.id}', userJson);
    }

    // Save to Firestore users collection
    if (user.id.isNotEmpty) {
      try {
        final emailLower = user.email.toLowerCase().trim();
        final firestoreData = {
          'id': user.id,
          'name': user.name,
          'email': user.email,
          'email_lower': emailLower,
          'phone': user.phone,
          'upi_id': user.upiId,
          'gender': user.gender,
          'avatar_url': user.avatarUrl,
          'updated_at': DateTime.now().toIso8601String(),
        };
        await _firestore.collection('users').doc(user.id).set(firestoreData, SetOptions(merge: true));

        // Also update member info in Firestore groups where this user is present
        final groupsSnap = await _firestore
            .collection('groups')
            .where('memberIds', arrayContains: user.id)
            .get();

        for (final gDoc in groupsSnap.docs) {
          final gData = gDoc.data();
          final members = Map<String, dynamic>.from(gData['members'] ?? {});
          if (members.containsKey(user.id)) {
            final mVal = Map<String, dynamic>.from(members[user.id] ?? {});
            mVal['name'] = user.name;
            mVal['email'] = user.email;
            mVal['phone'] = user.phone;
            mVal['upi_id'] = user.upiId;
            mVal['gender'] = user.gender;
            mVal['avatar_url'] = user.avatarUrl;
            members[user.id] = mVal;
            await _firestore.collection('groups').doc(gDoc.id).update({'members': members});
          }
        }
      } catch (e) {
        if (kDebugMode) print('Error saving user profile to Firestore: $e');
      }
    }

    // Update user representation inside all locally stored groups
    final jsonStr = prefs.getString(_groupsKey);
    if (jsonStr != null) {
      try {
        final List raw = jsonDecode(jsonStr);
        final List<Map<String, dynamic>> updatedGroups = [];
        final emailLower = user.email.toLowerCase().trim();

        for (final item in raw) {
          final g = Map<String, dynamic>.from(item);
          final membersMap = Map<String, dynamic>.from(g['members'] ?? {});
          bool changed = false;

          for (final entry in membersMap.entries) {
            final mKey = entry.key;
            final mVal = Map<String, dynamic>.from(entry.value);
            final mEmail = (mVal['email'] as String? ?? '').toLowerCase().trim();

            if (mKey == user.id || (emailLower.isNotEmpty && mEmail == emailLower)) {
              mVal['name'] = user.name;
              mVal['email'] = user.email;
              mVal['phone'] = user.phone;
              mVal['upiId'] = user.upiId;
              mVal['upi_id'] = user.upiId;
              mVal['gender'] = user.gender;
              if (user.avatarUrl.isNotEmpty) {
                mVal['avatarUrl'] = user.avatarUrl;
                mVal['avatar_url'] = user.avatarUrl;
              }
              membersMap[mKey] = mVal;
              changed = true;
            }
          }

          if (changed) {
            g['members'] = membersMap;
          }
          updatedGroups.add(g);
        }

        await prefs.setString(_groupsKey, jsonEncode(updatedGroups));
      } catch (_) {}
    }
  }

  Future<void> clearUserSession() async {
    final prefs = await _prefs;
    await prefs.remove(_userKey);
  }

  // --- Groups ---
  Future<List<GroupModel>> getGroups(String currentUserId, {String? currentUserEmail}) async {
    final userEmailLower = currentUserEmail?.toLowerCase().trim() ?? '';
    final groupsMap = <String, GroupModel>{};

    if (_isFirebaseInitialized && currentUserId.isNotEmpty) {
      await _ensureFirebaseAuth();
      try {
        // Query Firestore by memberIds
        final q1 = await _firestore
            .collection('groups')
            .where('memberIds', arrayContains: currentUserId)
            .get();

        for (final doc in q1.docs) {
          final g = GroupModel.fromJson({'id': doc.id, ...doc.data()}, currentUserId: currentUserId);
          groupsMap[g.id] = g;
        }

        // Query Firestore by memberEmails
        if (userEmailLower.isNotEmpty) {
          final q2 = await _firestore
              .collection('groups')
              .where('memberEmails', arrayContains: userEmailLower)
              .get();
          for (final doc in q2.docs) {
            if (!groupsMap.containsKey(doc.id)) {
              final g = GroupModel.fromJson({'id': doc.id, ...doc.data()}, currentUserId: currentUserId);
              groupsMap[g.id] = g;
            }
          }
        }

        final firestoreGroups = groupsMap.values.toList();
        firestoreGroups.sort((a, b) => b.createdAt.compareTo(a.createdAt));

        if (firestoreGroups.isNotEmpty) {
          await saveGroups(firestoreGroups);
          return firestoreGroups;
        }
      } catch (e) {
        if (kDebugMode) print('Error fetching groups from Firestore: $e');
      }
    }

    // Fallback to local cache
    final prefs = await _prefs;
    final jsonStr = prefs.getString(_groupsKey);
    if (jsonStr == null) return [];
    try {
      final List raw = jsonDecode(jsonStr);
      final groups = raw
          .map((e) => GroupModel.fromJson(Map<String, dynamic>.from(e), currentUserId: currentUserId))
          .where((g) =>
              g.memberIds.contains(currentUserId) ||
              (userEmailLower.isNotEmpty &&
                  g.members.values.any((m) => m.email.toLowerCase().trim() == userEmailLower)))
          .toList();
      groups.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return groups;
    } catch (_) {
      return [];
    }
  }

  Stream<List<GroupModel>> streamGroups({
    required String currentUserId,
    required String userEmail,
  }) {
    final emailLower = userEmail.toLowerCase().trim();
    if (!_isFirebaseInitialized || (currentUserId.isEmpty && emailLower.isEmpty)) {
      return Stream.value([]);
    }

    final groupsMap = <String, GroupModel>{};
    final controller = StreamController<List<GroupModel>>.broadcast();

    void emitLatest() async {
      final list = groupsMap.values.toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      if (!controller.isClosed) {
        controller.add(list);
      }
      await saveGroups(list);
    }

    StreamSubscription? sub1;
    if (currentUserId.isNotEmpty) {
      sub1 = _firestore
          .collection('groups')
          .where('memberIds', arrayContains: currentUserId)
          .snapshots()
          .listen((snap) {
        for (final doc in snap.docs) {
          final g = GroupModel.fromJson({'id': doc.id, ...doc.data()}, currentUserId: currentUserId);
          groupsMap[doc.id] = g;
        }
        final currentIds = snap.docs.map((d) => d.id).toSet();
        groupsMap.removeWhere((id, g) => !currentIds.contains(id) && !g.memberEmails.contains(emailLower));
        emitLatest();
      }, onError: (e) {
        if (kDebugMode) print('streamGroups sub1 error: $e');
      });
    }

    StreamSubscription? sub2;
    if (emailLower.isNotEmpty) {
      sub2 = _firestore
          .collection('groups')
          .where('memberEmails', arrayContains: emailLower)
          .snapshots()
          .listen((snap) {
        for (final doc in snap.docs) {
          final g = GroupModel.fromJson({'id': doc.id, ...doc.data()}, currentUserId: currentUserId);
          groupsMap[doc.id] = g;
        }
        emitLatest();
      }, onError: (e) {
        if (kDebugMode) print('streamGroups sub2 error: $e');
      });
    }

    controller.onCancel = () {
      sub1?.cancel();
      sub2?.cancel();
    };

    return controller.stream;
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
    await _ensureFirebaseAuth();
    final groupId = _firestore.collection('groups').doc().id;
    final myEmailLower = currentUser.email.toLowerCase().trim();

    final Map<String, dynamic> members = {
      currentUser.id: {
        'id': currentUser.id,
        'name': currentUser.name.isNotEmpty ? currentUser.name : 'You',
        'email': currentUser.email,
        'phone': currentUser.phone,
        'upi_id': currentUser.upiId,
        'role': 'admin',
        'isShadow': false,
        'joined_at': DateTime.now().toIso8601String(),
      },
    };
    final List<String> memberIds = [currentUser.id];
    final List<String> memberEmails = myEmailLower.isNotEmpty ? [myEmailLower] : [];

    for (final input in extraParticipants) {
      if (input.trim().isEmpty) continue;
      final cleanInput = input.trim();
      final inputLower = cleanInput.toLowerCase();
      final isEmail = cleanInput.contains('@');

      if (isEmail && !memberEmails.contains(inputLower)) {
        memberEmails.add(inputLower);
      }

      // Check if user exists in Firestore
      UserModel? existingUser;
      if (isEmail) {
        try {
          final snap = await _firestore
              .collection('users')
              .where('email_lower', isEqualTo: inputLower)
              .limit(1)
              .get();
          if (snap.docs.isNotEmpty) {
            existingUser = UserModel.fromJson({'id': snap.docs.first.id, ...snap.docs.first.data()});
          }
        } catch (_) {}
      }

      if (existingUser != null && existingUser.id != currentUser.id) {
        if (!memberIds.contains(existingUser.id)) {
          memberIds.add(existingUser.id);
          members[existingUser.id] = {
            'id': existingUser.id,
            'name': existingUser.name.isNotEmpty ? existingUser.name : cleanInput.split('@')[0],
            'email': existingUser.email.isNotEmpty ? existingUser.email : cleanInput,
            'phone': existingUser.phone,
            'upi_id': existingUser.upiId,
            'role': 'member',
            'isShadow': false,
            'joined_at': DateTime.now().toIso8601String(),
          };
        }
      } else {
        // Shadow user
        final shadowId = 'shadow_${_firestore.collection('shadow_users').doc().id}';
        memberIds.add(shadowId);
        members[shadowId] = {
          'id': shadowId,
          'name': isEmail ? cleanInput.split('@')[0] : cleanInput,
          'email': isEmail ? cleanInput : '',
          'role': 'member',
          'isShadow': true,
          'joined_at': DateTime.now().toIso8601String(),
        };
      }
    }

    final groupData = {
      'id': groupId,
      'name': name,
      'emoji': icon,
      'icon': icon,
      'groupType': 'other',
      'created_by': currentUser.id,
      'created_at': DateTime.now().toIso8601String(),
      'memberIds': memberIds,
      'memberEmails': memberEmails,
      'members': members,
    };

    // Save to Firestore
    try {
      await _firestore.collection('groups').doc(groupId).set(groupData);

      // Send notifications to invited members
      for (final email in memberEmails) {
        if (email != myEmailLower) {
          sendNotificationToUser(
            targetEmail: email,
            title: 'New Group Invite 🎉',
            body: '${currentUser.name.isNotEmpty ? currentUser.name : "A friend"} added you to "$name"',
            groupId: groupId,
          );
        }
      }
    } catch (e) {
      if (kDebugMode) print('Error saving new group to Firestore: $e');
    }

    final newGroup = GroupModel.fromJson(groupData, currentUserId: currentUser.id);

    // Save to local cache
    final allGroups = await getGroups(currentUser.id, currentUserEmail: currentUser.email);
    allGroups.insert(0, newGroup);
    await saveGroups(allGroups);

    return newGroup;
  }

  Future<void> updateGroupDetails(String groupId, String newName, String newIcon, String currentUserId) async {
    final cleanName = newName.trim();
    if (cleanName.isEmpty) return;

    if (_isFirebaseInitialized) {
      try {
        await _firestore.collection('groups').doc(groupId).update({
          'name': cleanName,
          'icon': newIcon,
          'emoji': newIcon,
          'groupType': newIcon,
        });

        // Get group details and admin name to log activity & send notifications
        final groupSnap = await _firestore.collection('groups').doc(groupId).get();
        if (groupSnap.exists && groupSnap.data() != null) {
          final groupData = groupSnap.data()!;
          final members = groupData['members'] as Map<String, dynamic>? ?? {};
          final adminName = (members[currentUserId]?['name'] as String?) ?? 'Admin';
          final memberEmails = List<String>.from(groupData['memberEmails'] ?? []);
          final currentAdminEmail = (members[currentUserId]?['email'] as String? ?? '').toLowerCase().trim();

          // 1. Log Group Update Activity Entry into Firestore expenses collection
          final activityId = _firestore.collection('expenses').doc().id;
          final activityDoc = {
            'id': activityId,
            'groupId': groupId,
            'description': 'Group updated to "$cleanName"',
            'amount': 0.0,
            'paid_by': currentUserId,
            'paidBy': currentUserId,
            'split_type': 'equal',
            'shares': [],
            'payer': {
              'id': currentUserId,
              'name': adminName,
            },
            'created_at': DateTime.now().toIso8601String(),
            'note': 'Group name/theme updated by $adminName',
            'type': 'group_update',
          };
          await _firestore.collection('expenses').doc(activityId).set(activityDoc);

          // 2. Notify all other members of the group
          for (final email in memberEmails) {
            final cleanEmail = email.toLowerCase().trim();
            if (cleanEmail.isNotEmpty && cleanEmail != currentAdminEmail) {
              sendNotificationToUser(
                targetEmail: cleanEmail,
                title: 'Group Updated ✏️',
                body: '$adminName updated group name to "$cleanName"',
                groupId: groupId,
              );
            }
          }
        }
      } catch (e) {
        if (kDebugMode) print('Error updating group details in Firestore: $e');
      }
    }

    try {
      final allGroups = await getGroups(currentUserId);
      final index = allGroups.indexWhere((g) => g.id == groupId);
      if (index != -1) {
        final g = allGroups[index];
        final updatedGroup = GroupModel(
          id: g.id,
          name: cleanName,
          emoji: newIcon,
          icon: newIcon,
          createdBy: g.createdBy,
          createdAt: g.createdAt,
          memberIds: g.memberIds,
          members: g.members,
          myRole: g.myRole,
        );
        allGroups[index] = updatedGroup;
        await saveGroups(allGroups);
      }
    } catch (e) {
      if (kDebugMode) print('Error updating group details in local cache: $e');
    }
  }

  Future<void> updateGroupName(String groupId, String newName, String currentUserId) async {
    await updateGroupDetails(groupId, newName, 'food', currentUserId);
  }

  Future<GroupModel?> getGroupById(String groupId, String currentUserId) async {
    try {
      final snap = await _firestore.collection('groups').doc(groupId).get();
      if (snap.exists && snap.data() != null) {
        return GroupModel.fromJson({'id': snap.id, ...snap.data()!}, currentUserId: currentUserId);
      }
    } catch (_) {}

    final allGroups = await getGroups(currentUserId);
    try {
      return allGroups.firstWhere((g) => g.id == groupId);
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteGroup(String groupId, String currentUserId) async {
    try {
      await _firestore.collection('groups').doc(groupId).delete();

      final expSnap = await _firestore.collection('expenses').where('groupId', isEqualTo: groupId).get();
      for (final d in expSnap.docs) {
        await d.reference.delete();
      }

      final setSnap = await _firestore.collection('settlements').where('groupId', isEqualTo: groupId).get();
      for (final d in setSnap.docs) {
        await d.reference.delete();
      }
    } catch (e) {
      if (kDebugMode) print('Error deleting group from Firestore: $e');
    }

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

  Future<void> addMemberToGroup(String groupId, String participantNameOrEmail, String currentUserId) async {
    if (participantNameOrEmail.trim().isEmpty) return;
    final cleanInput = participantNameOrEmail.trim();
    final inputLower = cleanInput.toLowerCase();
    final isEmail = cleanInput.contains('@');

    try {
      final groupRef = _firestore.collection('groups').doc(groupId);
      final snap = await groupRef.get();
      if (snap.exists && snap.data() != null) {
        final group = snap.data()!;
        final members = Map<String, dynamic>.from(group['members'] ?? {});
        final memberIds = List<String>.from(group['memberIds'] ?? []);
        final memberEmails = List<String>.from(group['memberEmails'] ?? []);

        String memberId = '';
        Map<String, dynamic> memberData = {};

        if (isEmail) {
          final userSnap = await _firestore
              .collection('users')
              .where('email_lower', isEqualTo: inputLower)
              .limit(1)
              .get();
          if (userSnap.docs.isNotEmpty) {
            final uDoc = userSnap.docs.first;
            final uData = uDoc.data();
            memberId = uDoc.id;
            memberData = {
              'id': memberId,
              'name': (uData['name'] as String? ?? '').isNotEmpty ? uData['name'] : cleanInput.split('@')[0],
              'email': uData['email'] ?? cleanInput,
              'phone': uData['phone'] ?? '',
              'upi_id': uData['upi_id'] ?? '',
              'role': 'member',
              'isShadow': false,
              'joined_at': DateTime.now().toIso8601String(),
            };
          }
        }

        if (memberId.isEmpty) {
          memberId = 'shadow_${_firestore.collection('shadow_users').doc().id}';
          memberData = {
            'id': memberId,
            'name': isEmail ? cleanInput.split('@')[0] : cleanInput,
            'email': isEmail ? cleanInput : '',
            'role': 'member',
            'isShadow': true,
            'joined_at': DateTime.now().toIso8601String(),
          };
        }

        members[memberId] = memberData;
        if (!memberIds.contains(memberId)) memberIds.add(memberId);
        if (isEmail && !memberEmails.contains(inputLower)) memberEmails.add(inputLower);

        await groupRef.update({
          'members': members,
          'memberIds': memberIds,
          'memberEmails': memberEmails,
        });

        if (isEmail) {
          sendNotificationToUser(
            targetEmail: inputLower,
            title: 'Added to Group 🎉',
            body: 'You were added to group "${group['name'] ?? 'Ledger'}"',
            groupId: groupId,
          );
        }
      }
    } catch (e) {
      if (kDebugMode) print('Error adding member to Firestore group: $e');
    }

    final group = await getGroupById(groupId, currentUserId);
    if (group == null) return;

    final shadowId = 'usr_shadow_${_uuid.v4().substring(0, 6)}';
    final shadowUser = UserModel(
      id: shadowId,
      name: participantNameOrEmail.trim(),
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

  Future<void> updateMemberName(String groupId, String memberId, String newName) async {
    try {
      final groupRef = _firestore.collection('groups').doc(groupId);
      final snap = await groupRef.get();
      if (snap.exists && snap.data() != null) {
        final group = snap.data()!;
        final members = Map<String, dynamic>.from(group['members'] ?? {});
        if (members.containsKey(memberId)) {
          final memberData = Map<String, dynamic>.from(members[memberId] as Map);
          memberData['name'] = newName;
          members[memberId] = memberData;
          await groupRef.update({'members': members});
        }
      }
    } catch (e) {
      if (kDebugMode) print('Error updating member name in Firestore: $e');
    }

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
          if (members.containsKey(memberId)) {
            final memberData = Map<String, dynamic>.from(members[memberId] as Map);
            memberData['name'] = newName;
            members[memberId] = memberData;
            g['members'] = members;
          }
        }
        updated.add(g);
      }
      await prefs.setString(_groupsKey, jsonEncode(updated));
    } catch (_) {}
  }

  Future<void> removeMemberFromGroup(String groupId, String memberId) async {
    try {
      final groupRef = _firestore.collection('groups').doc(groupId);
      final snap = await groupRef.get();
      if (snap.exists && snap.data() != null) {
        final group = snap.data()!;
        final members = Map<String, dynamic>.from(group['members'] ?? {});
        final removedMember = members[memberId] as Map?;
        members.remove(memberId);

        final memberIds = List<String>.from(group['memberIds'] ?? [])..remove(memberId);
        final removedEmail = (removedMember?['email'] as String? ?? '').toLowerCase().trim();
        final memberEmails = List<String>.from(group['memberEmails'] ?? []);
        if (removedEmail.isNotEmpty) {
          memberEmails.removeWhere((e) => e.toLowerCase().trim() == removedEmail);
        }

        await groupRef.update({
          'members': members,
          'memberIds': memberIds,
          'memberEmails': memberEmails,
        });
      }
    } catch (e) {
      if (kDebugMode) print('Error removing member from Firestore group: $e');
    }

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
    try {
      final snap = await _firestore
          .collection('expenses')
          .where('groupId', isEqualTo: groupId)
          .get();

      final list = snap.docs.map((d) => ExpenseModel.fromJson({'id': d.id, ...d.data()})).toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      if (list.isNotEmpty) {
        await saveExpenses(groupId, list);
        return list;
      }
    } catch (e) {
      if (kDebugMode) print('Error fetching expenses from Firestore: $e');
    }

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
    final expenseId = _firestore.collection('expenses').doc().id;
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

    try {
      await _firestore.collection('expenses').doc(expenseId).set(expense.toJson());

      // Trigger notifications for group members
      final groupSnap = await _firestore.collection('groups').doc(groupId).get();
      if (groupSnap.exists && groupSnap.data() != null) {
        final groupData = groupSnap.data()!;
        final memberEmails = List<String>.from(groupData['memberEmails'] ?? []);
        final groupName = groupData['name'] as String? ?? 'Ledger';
        final members = groupData['members'] as Map<String, dynamic>? ?? {};
        final payerEmail = (members[paidBy]?['email'] as String? ?? '').toLowerCase().trim();

        for (final email in memberEmails) {
          final cleanEmail = email.toLowerCase().trim();
          if (cleanEmail.isNotEmpty && cleanEmail != payerEmail) {
            sendNotificationToUser(
              targetEmail: cleanEmail,
              title: 'New Expense in $groupName 💸',
              body: '${payer.name} added "$description" (₹${amount.toStringAsFixed(2)})',
              groupId: groupId,
            );
          }
        }
      }
    } catch (e) {
      if (kDebugMode) print('Error adding expense to Firestore: $e');
    }

    final currentExpenses = await getExpenses(groupId);
    currentExpenses.insert(0, expense);
    await saveExpenses(groupId, currentExpenses);

    return expense;
  }

  Future<void> updateExpense(ExpenseModel updatedExpense) async {
    final updateActivityId = _uuid.v4();
    final updateNote = 'Expense updated to ₹${updatedExpense.amount.toStringAsFixed(2)}';
    
    try {
      await _firestore.collection('expenses').doc(updatedExpense.id).update(updatedExpense.toJson());

      // 1. Create activity entry in Firestore for Activity Timeline
      final activityDoc = {
        'id': updateActivityId,
        'groupId': updatedExpense.groupId,
        'description': 'Expense updated: "${updatedExpense.description}"',
        'amount': 0.0,
        'paid_by': updatedExpense.paidBy,
        'paidBy': updatedExpense.paidBy,
        'split_type': updatedExpense.splitType,
        'shares': [],
        'payer': updatedExpense.payer.toJson(),
        'created_at': DateTime.now().toIso8601String(),
        'note': updateNote,
        'type': 'expense_update',
      };
      await _firestore.collection('expenses').doc(updateActivityId).set(activityDoc);

      // 2. Notify all group members
      final groupSnap = await _firestore.collection('groups').doc(updatedExpense.groupId).get();
      if (groupSnap.exists && groupSnap.data() != null) {
        final groupData = groupSnap.data()!;
        final memberEmails = List<String>.from(groupData['memberEmails'] ?? []);
        final groupName = groupData['name'] as String? ?? 'Ledger';

        for (final email in memberEmails) {
          final cleanEmail = email.toLowerCase().trim();
          if (cleanEmail.isNotEmpty) {
            sendNotificationToUser(
              targetEmail: cleanEmail,
              title: 'Expense Updated 📝',
              body: '"${updatedExpense.description}" was updated (₹${updatedExpense.amount.toStringAsFixed(2)}) in "$groupName"',
              groupId: updatedExpense.groupId,
            );
          }
        }
      }
    } catch (e) {
      if (kDebugMode) print('Error updating expense in Firestore: $e');
    }

    final currentExpenses = await getExpenses(updatedExpense.groupId);
    final idx = currentExpenses.indexWhere((e) => e.id == updatedExpense.id);
    if (idx != -1) {
      currentExpenses[idx] = updatedExpense;
    }

    // 3. Add activity entry to local expense cache so it appears immediately in timeline
    final updateActivity = ExpenseModel(
      id: updateActivityId,
      groupId: updatedExpense.groupId,
      description: 'Expense updated: "${updatedExpense.description}"',
      amount: 0.0,
      paidBy: updatedExpense.paidBy,
      payer: updatedExpense.payer,
      createdAt: DateTime.now().toIso8601String(),
      note: updateNote,
    );
    currentExpenses.insert(0, updateActivity);
    await saveExpenses(updatedExpense.groupId, currentExpenses);
  }

  Future<void> deleteExpense(String groupId, String expenseId) async {
    try {
      final expSnap = await _firestore.collection('expenses').doc(expenseId).get();
      String desc = 'Expense';
      String paidBy = '';
      Map<String, dynamic> payerMap = {'id': '', 'name': 'Member'};
      if (expSnap.exists) {
        final data = expSnap.data();
        if (data != null) {
          desc = data['description'] as String? ?? 'Expense';
          paidBy = (data['paidBy'] ?? data['paid_by'] ?? '') as String;
          if (data['payer'] is Map) {
            payerMap = Map<String, dynamic>.from(data['payer']);
          }
        }
      }

      await _firestore.collection('expenses').doc(expenseId).delete();

      // Log deletion activity entry into Firestore
      final deleteActivityId = _uuid.v4();
      final deleteDoc = {
        'id': deleteActivityId,
        'groupId': groupId,
        'description': 'Expense deleted: "$desc"',
        'amount': 0.0,
        'paid_by': paidBy,
        'paidBy': paidBy,
        'split_type': 'equal',
        'shares': [],
        'payer': payerMap,
        'created_at': DateTime.now().toIso8601String(),
        'note': 'Expense "$desc" removed from ledger',
        'type': 'expense_delete',
      };
      await _firestore.collection('expenses').doc(deleteActivityId).set(deleteDoc);
    } catch (e) {
      if (kDebugMode) print('Error deleting expense from Firestore: $e');
    }

    final currentExpenses = await getExpenses(groupId);
    currentExpenses.removeWhere((e) => e.id == expenseId);
    await saveExpenses(groupId, currentExpenses);
  }

  // --- Settlements ---
  Future<List<SettlementModel>> getSettlements(String groupId) async {
    try {
      final snap = await _firestore
          .collection('settlements')
          .where('groupId', isEqualTo: groupId)
          .get();

      final list = snap.docs.map((d) => SettlementModel.fromJson({'id': d.id, ...d.data()})).toList();
      if (list.isNotEmpty) {
        await saveSettlements(groupId, list);
        return list;
      }
    } catch (e) {
      if (kDebugMode) print('Error fetching settlements from Firestore: $e');
    }

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
    final settlementId = _firestore.collection('settlements').doc().id;
    final settlement = SettlementModel(
      id: settlementId,
      groupId: groupId,
      fromUser: fromUser,
      toUser: toUser,
      amount: amount,
    );

    try {
      await _firestore.collection('settlements').doc(settlementId).set(settlement.toJson());

      // Notify group members about the settlement
      final groupSnap = await _firestore.collection('groups').doc(groupId).get();
      if (groupSnap.exists && groupSnap.data() != null) {
        final groupData = groupSnap.data()!;
        final memberEmails = List<String>.from(groupData['memberEmails'] ?? []);
        final groupName = groupData['name'] as String? ?? 'Ledger';
        final members = groupData['members'] as Map<String, dynamic>? ?? {};
        final fromName = (members[fromUser]?['name'] as String?) ?? 'Member';
        final toName = (members[toUser]?['name'] as String?) ?? 'Member';

        for (final email in memberEmails) {
          final cleanEmail = email.toLowerCase().trim();
          if (cleanEmail.isNotEmpty) {
            sendNotificationToUser(
              targetEmail: cleanEmail,
              title: 'Settlement Recorded 🤝',
              body: '$fromName paid ₹${amount.toStringAsFixed(2)} to $toName in "$groupName"',
              groupId: groupId,
            );
          }
        }
      }
    } catch (e) {
      if (kDebugMode) print('Error recording settlement in Firestore: $e');
    }

    final list = await getSettlements(groupId);
    list.insert(0, settlement);
    await saveSettlements(groupId, list);

    return settlement;
  }

  // --- Global Activity Timeline ---
  Future<List<ExpenseModel>> getAllExpensesAcrossGroups(String currentUserId, {String? currentUserEmail}) async {
    final groups = await getGroups(currentUserId, currentUserEmail: currentUserEmail);
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

  // --- Notification Helper ---
  Future<void> sendNotificationToUser({
    required String targetEmail,
    required String title,
    required String body,
    String? groupId,
  }) async {
    final emailClean = targetEmail.toLowerCase().trim();
    if (emailClean.isEmpty) return;
    try {
      await _firestore.collection('notifications').add({
        'targetEmail': emailClean,
        'title': title,
        'body': body,
        'groupId': groupId,
        'created_at': DateTime.now().toIso8601String(),
        'read': false,
      });
    } catch (_) {}
  }

  // --- Join via Code ---
  Future<GroupModel?> joinGroupByCode(String groupId, UserModel currentUser) async {
    if (groupId.trim().isEmpty) return null;
    final cleanId = groupId.trim();
    try {
      final groupRef = _firestore.collection('groups').doc(cleanId);
      final snap = await groupRef.get();
      if (snap.exists && snap.data() != null) {
        final data = snap.data()!;
        final members = Map<String, dynamic>.from(data['members'] ?? {});
        final memberIds = List<String>.from(data['memberIds'] ?? []);
        final memberEmails = List<String>.from(data['memberEmails'] ?? []);

        if (!memberIds.contains(currentUser.id)) {
          members[currentUser.id] = {
            'id': currentUser.id,
            'name': currentUser.name.isNotEmpty ? currentUser.name : 'Member',
            'email': currentUser.email,
            'phone': currentUser.phone,
            'upi_id': currentUser.upiId,
            'role': 'member',
            'isShadow': false,
            'joined_at': DateTime.now().toIso8601String(),
          };
          memberIds.add(currentUser.id);
          final emailLower = currentUser.email.toLowerCase().trim();
          if (emailLower.isNotEmpty && !memberEmails.contains(emailLower)) {
            memberEmails.add(emailLower);
          }

          await groupRef.update({
            'members': members,
            'memberIds': memberIds,
            'memberEmails': memberEmails,
          });
        }

        final updatedSnap = await groupRef.get();
        final group = GroupModel.fromJson({'id': updatedSnap.id, ...updatedSnap.data()!}, currentUserId: currentUser.id);

        final allGroups = await getGroups(currentUser.id, currentUserEmail: currentUser.email);
        if (!allGroups.any((g) => g.id == group.id)) {
          allGroups.insert(0, group);
          await saveGroups(allGroups);
        }
        return group;
      }
    } catch (e) {
      if (kDebugMode) print('Error joining group by code: $e');
    }
    return null;
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


