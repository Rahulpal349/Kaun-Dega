import 'package:flutter_test/flutter_test.dart';
import 'package:kaun_dega/models/user_model.dart';
import 'package:kaun_dega/models/expense_model.dart';
import 'package:kaun_dega/models/group_model.dart';
import 'package:kaun_dega/models/settlement_model.dart';

void main() {
  group('UserModel Tests', () {
    test('Correctly serializes and deserializes UserModel', () {
      final user = UserModel(
        id: 'user_123',
        name: 'Rahul Pal',
        email: 'rahul@example.com',
        phone: '+919876543210',
        upiId: 'rahul@okaxis',
        role: 'admin',
        isShadow: false,
      );

      final json = user.toJson();
      expect(json['id'], 'user_123');
      expect(json['name'], 'Rahul Pal');
      expect(json['upi_id'], 'rahul@okaxis');

      final fromJson = UserModel.fromJson(json);
      expect(fromJson.id, user.id);
      expect(fromJson.name, user.name);
      expect(fromJson.upiId, user.upiId);
      expect(fromJson.role, 'admin');
    });

    test('UserModel copyWith works properly', () {
      final user = UserModel(id: 'u1', name: 'Original', role: 'member');
      final updated = user.copyWith(name: 'Updated', upiId: 'upi@pay');

      expect(updated.id, 'u1');
      expect(updated.name, 'Updated');
      expect(updated.upiId, 'upi@pay');
      expect(updated.role, 'member');
    });
  });

  group('ExpenseModel & ExpenseShare Tests', () {
    test('ExpenseShare parsing handles both string and num amounts', () {
      final share1 = ExpenseShare.fromJson({'user_id': 'u1', 'amount': 150.50});
      final share2 = ExpenseShare.fromJson({'userId': 'u2', 'share_amount': '249.50'});

      expect(share1.userId, 'u1');
      expect(share1.amount, 150.50);
      expect(share2.userId, 'u2');
      expect(share2.amount, 249.50);
    });

    test('ExpenseModel fromJson correctly parses shares and payer details', () {
      final map = {
        'id': 'exp_99',
        'groupId': 'grp_1',
        'description': 'Zomato Biryani',
        'amount': 400.0,
        'paid_by': 'u1',
        'split_type': 'custom',
        'expense_shares': [
          {'user_id': 'u1', 'amount': 250.0},
          {'user_id': 'u2', 'amount': 150.0},
        ],
        'payer': {'id': 'u1', 'name': 'Rahul', 'upi_id': 'rahul@upi'},
        'group': {'name': 'Weekend Masti', 'emoji': '🍕'},
      };

      final expense = ExpenseModel.fromJson(map);
      expect(expense.id, 'exp_99');
      expect(expense.description, 'Zomato Biryani');
      expect(expense.amount, 400.0);
      expect(expense.splitType, 'custom');
      expect(expense.shares.length, 2);
      expect(expense.payer.name, 'Rahul');
      expect(expense.groupName, 'Weekend Masti');
      expect(expense.groupEmoji, '🍕');
    });
  });

  group('GroupModel Tests', () {
    test('GroupModel parses nested members map correctly', () {
      final groupJson = {
        'id': 'g100',
        'name': 'Manali Trip',
        'emoji': '🏔️',
        'icon': 'trip',
        'created_by': 'u_creator',
        'members': {
          'u_creator': {
            'id': 'u_creator',
            'name': 'Creator',
            'role': 'admin',
          },
          'u_friend': {
            'id': 'u_friend',
            'name': 'Friend',
            'role': 'member',
          }
        }
      };

      final group = GroupModel.fromJson(groupJson, currentUserId: 'u_creator');
      expect(group.id, 'g100');
      expect(group.name, 'Manali Trip');
      expect(group.members.length, 2);
      expect(group.memberList.length, 2);
      expect(group.myRole, 'admin');
    });
  });

  group('SettlementModel Tests', () {
    test('SettlementModel parses fields accurately', () {
      final json = {
        'id': 's_1',
        'groupId': 'g_1',
        'from_user': 'u_deb',
        'to_user': 'u_cred',
        'amount': 350.75,
      };

      final settlement = SettlementModel.fromJson(json);
      expect(settlement.id, 's_1');
      expect(settlement.fromUser, 'u_deb');
      expect(settlement.toUser, 'u_cred');
      expect(settlement.amount, 350.75);
    });
  });
}
