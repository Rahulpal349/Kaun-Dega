import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) {
    print('Handling a background message: ${message.messageId}');
  }
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'kaun_dega_group_invites',
    'Group Invites & Activity',
    description: 'Notifications when added to a group or split expenses',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Initialize local notifications plugin
      const initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const initializationSettingsDarwin = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsDarwin,
      );

      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: (response) {
          if (kDebugMode) {
            print('Notification tapped: ${response.payload}');
          }
        },
      );

      // Create high importance channel for Android
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        final notification = message.notification;

        if (notification != null) {
          showNotification(
            id: notification.hashCode,
            title: notification.title ?? 'Kaun Dega?',
            body: notification.body ?? '',
            payload: jsonEncode(message.data),
          );
        }
      });

      _initialized = true;
    } catch (e) {
      if (kDebugMode) {
        print('NotificationService initialize error: $e');
      }
    }
  }

  Future<bool> requestPermissions() async {
    try {
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      return settings.authorizationStatus == AuthorizationStatus.authorized;
    } catch (_) {
      return false;
    }
  }

  Future<void> saveTokenForUser({
    required String userId,
    required String userEmail,
  }) async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token == null || token.isEmpty) return;

      final emailLower = userEmail.toLowerCase().trim();
      final firestore = FirebaseFirestore.instance;

      // Save FCM token to Firestore user document
      final userRef = firestore.collection('users').doc(userId);
      await userRef.set({
        'fcmTokens': FieldValue.arrayUnion([token]),
        'lastTokenUpdated': DateTime.now().toIso8601String(),
        'email_lower': emailLower,
      }, SetOptions(merge: true));

      if (kDebugMode) {
        print('Saved FCM token for $userId / $userEmail');
      }

      listenForUserNotifications(userId: userId, userEmail: userEmail);
    } catch (e) {
      if (kDebugMode) {
        print('Error saving FCM token: $e');
      }
    }
  }

  StreamSubscription<QuerySnapshot>? _notifSubscription;

  void listenForUserNotifications({
    required String userId,
    required String userEmail,
  }) {
    _notifSubscription?.cancel();
    final emailLower = userEmail.toLowerCase().trim();
    if (emailLower.isEmpty && userId.isEmpty) return;

    final firestore = FirebaseFirestore.instance;

    _notifSubscription = firestore
        .collection('notifications')
        .where('targetEmail', isEqualTo: emailLower)
        .snapshots()
        .listen((snapshot) {
      for (final change in snapshot.docChanges) {
        if (change.type == DocumentChangeType.added) {
          final data = change.doc.data();
          if (data != null) {
            final title = data['title'] as String? ?? 'Kaun Dega?';
            final body = data['body'] as String? ?? 'You have a new update';
            final isRead = data['read'] == true;

            if (!isRead) {
              showNotification(
                id: change.doc.id.hashCode,
                title: title,
                body: body,
              );
            }
          }
        }
      }
    }, onError: (e) {
      if (kDebugMode) print('Notification listener error: $e');
    });
  }

  Future<void> showNotification({
    int id = 0,
    required String title,
    required String body,
    String? payload,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(id, title, body, details, payload: payload);
  }
}
