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

  /// Returns full web join link
  static String getInviteUrl(String inviteCode) {
    return 'https://kaun-dega.vercel.app/join/$inviteCode';
  }

  /// Share invite link
  static Future<void> shareInvite({required String groupName, required String inviteCode}) async {
    final url = getInviteUrl(inviteCode);
    final text = '👋 Join my expense group "*$groupName*" on *Kaun Dega?* to easily split bills!\n\n🔗 Join Link: $url\n\n🔑 Invite Code: $inviteCode';
    await shareToWhatsapp(text);
  }

  /// Exports Group Report as formatted CSV and opens system share sheet
  static Future<void> exportGroupReportCsv({
    required String groupName,
    required List<dynamic> memberBalances,
    required List<dynamic> moves,
    required List<dynamic> expenses,
  }) async {
    final buffer = StringBuffer();

    // Header
    buffer.writeln('GROUP REPORT: $groupName');
    buffer.writeln('Generated on: ${DateTime.now().toString().split('.')[0]}');
    buffer.writeln('');

    // Member Balances Section
    buffer.writeln('--- MEMBER BALANCES ---');
    buffer.writeln('Name,Net Balance (INR),Charged (INR),Paid (INR)');
    for (final b in memberBalances) {
      final name = b.name.toString().replaceAll(',', ' ');
      final net = (b.amount ?? 0.0).toStringAsFixed(2);
      final charged = (b.charged ?? 0.0).toStringAsFixed(2);
      final paid = (b.paid ?? 0.0).toStringAsFixed(2);
      buffer.writeln('$name,$net,$charged,$paid');
    }
    buffer.writeln('');

    // Settlement Moves Section
    buffer.writeln('--- RECOMMENDED SETTLEMENTS ---');
    buffer.writeln('Debtor,Creditor,Amount (INR)');
    for (final m in moves) {
      final from = m.fromName.toString().replaceAll(',', ' ');
      final to = m.toName.toString().replaceAll(',', ' ');
      final amt = m.amount.toStringAsFixed(2);
      buffer.writeln('$from,$to,$amt');
    }
    buffer.writeln('');

    // Expense Log Section
    buffer.writeln('--- EXPENSE LOG ---');
    buffer.writeln('Description,Paid By,Amount (INR),Split Type,Note');
    for (final e in expenses) {
      final desc = e.description.toString().replaceAll(',', ' ');
      final payer = e.payer?.name ?? 'Member';
      final amt = e.amount.toStringAsFixed(2);
      final type = e.splitType;
      final note = (e.note ?? '').toString().replaceAll(',', ' ');
      buffer.writeln('$desc,$payer,$amt,$type,$note');
    }

    final csvText = buffer.toString();
    await Share.share(
      csvText,
      subject: '$groupName - Kaun Dega Expense Report.csv',
    );
  }
}
