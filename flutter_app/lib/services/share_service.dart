import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';

class ShareService {
  /// Opens WhatsApp with pre-filled settlement text
  static Future<bool> shareToWhatsapp(String text) async {
    final encoded = Uri.encodeComponent(text);
    final whatsappUri = Uri.parse('whatsapp://send?text=$encoded');
    final webWhatsappUri = Uri.parse('https://api.whatsapp.com/send?text=$encoded');

    try {
      if (await canLaunchUrl(whatsappUri)) {
        return await launchUrl(whatsappUri, mode: LaunchMode.externalApplication);
      } else if (await canLaunchUrl(webWhatsappUri)) {
        return await launchUrl(webWhatsappUri, mode: LaunchMode.externalApplication);
      } else {
        // Fallback to system share sheet
        await Share.share(text);
        return true;
      }
    } catch (_) {
      try {
        await Share.share(text);
        return true;
      } catch (e) {
        await Clipboard.setData(ClipboardData(text: text));
        return false;
      }
    }
  }

  /// Copies text to clipboard
  static Future<void> copyToClipboard(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
  }

  /// Share invite link
  static Future<void> shareInvite({required String groupName, required String inviteCode}) async {
    final text = '👋 Join my expense group "*$groupName*" on *Kaun Dega?* to easily split bills!\n\nInvite Code: $inviteCode\n\nDownload Kaun Dega app to get started.';
    await shareToWhatsapp(text);
  }
}
