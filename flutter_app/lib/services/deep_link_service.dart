import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';

/// Handles incoming deep links for group invite URLs.
///
/// Listens for:
///   https://kaun-dega.vercel.app/join/[groupId]
///
/// Usage:
///   final code = await DeepLinkService.instance.getInitialCode();
///   DeepLinkService.instance.codeStream.listen((code) { ... });
class DeepLinkService {
  DeepLinkService._();
  static final DeepLinkService instance = DeepLinkService._();

  final _appLinks = AppLinks();
  final _codeController = StreamController<String>.broadcast();

  /// Stream of group invite codes from incoming links (foreground / background).
  Stream<String> get codeStream => _codeController.stream;

  /// Cached initial code when app was cold-started from a deep link.
  String? _initialCode;
  bool _initialChecked = false;

  /// Call once at app startup (before runApp or right after).
  Future<void> init() async {
    // Handle foreground / background links
    _appLinks.uriLinkStream.listen((uri) {
      final code = _extractCode(uri);
      if (code != null) {
        if (kDebugMode) print('[DeepLink] foreground link → code: $code');
        _codeController.add(code);
      }
    }, onError: (err) {
      if (kDebugMode) print('[DeepLink] stream error: $err');
    });
  }

  /// Returns the group code if the app was opened cold via a deep link.
  /// Returns null if the app was opened normally.
  Future<String?> getInitialCode() async {
    if (_initialChecked) return _initialCode;
    _initialChecked = true;
    try {
      final uri = await _appLinks.getInitialLink();
      _initialCode = uri != null ? _extractCode(uri) : null;
      if (kDebugMode) print('[DeepLink] initial link: $uri → code: $_initialCode');
    } catch (e) {
      if (kDebugMode) print('[DeepLink] getInitialLink error: $e');
      _initialCode = null;
    }
    return _initialCode;
  }

  /// Clears the cached initial code after it has been handled.
  void consumeInitialCode() {
    _initialCode = null;
  }

  /// Extracts the group invite code or group ID from a URL.
  /// Handles:
  ///   https://kaun-dega.vercel.app/join/abc123  →  "abc123"
  ///   https://kaun-dega.vercel.app/groups/abc123 → "abc123"
  ///   kaundega://join/abc123                   →  "abc123"
  ///   kaundega://groups/abc123                 →  "abc123"
  String? _extractCode(Uri uri) {
    // 1. Handle kaundega://join/[code] or kaundega://groups/[code]
    if (uri.scheme == 'kaundega' && (uri.host == 'join' || uri.host == 'groups')) {
      final pathCode = uri.path.replaceAll('/', '').trim();
      if (pathCode.isNotEmpty) return pathCode;
    }

    // 2. Handle /join/[code] or /groups/[code] path segments
    final segments = uri.pathSegments;
    for (final prefix in ['join', 'groups']) {
      final idx = segments.indexOf(prefix);
      if (idx != -1 && segments.length > idx + 1) {
        final code = segments[idx + 1].trim();
        if (code.isNotEmpty) return code;
      }
    }

    // Fallback: if path contains /join/ or /groups/
    for (final prefix in ['/join/', '/groups/']) {
      if (uri.path.contains(prefix)) {
        final parts = uri.path.split(prefix);
        if (parts.length > 1) {
          final code = parts[1].split('/')[0].split('?')[0].trim();
          if (code.isNotEmpty) return code;
        }
      }
    }

    return null;
  }

  void dispose() {
    _codeController.close();
  }
}
