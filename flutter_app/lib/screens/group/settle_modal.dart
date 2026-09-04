import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../providers/app_state.dart';
import '../../models/balance_model.dart';
import '../../services/share_service.dart';

class SettleModal extends StatefulWidget {
  final String groupId;
  final SettlementMove move;
  final VoidCallback onSettled;

  const SettleModal({
    super.key,
    required this.groupId,
    required this.move,
    required this.onSettled,
  });

  @override
  State<SettleModal> createState() => _SettleModalState();
}

class _SettleModalState extends State<SettleModal> {
  bool _isCopied = false;
  bool _isRecording = false;

  void _copyUpi() {
    if (widget.move.toUpiId == null) return;
    ShareService.copyToClipboard(widget.move.toUpiId!);
    setState(() => _isCopied = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('UPI ID copied to clipboard!'),
        duration: Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isCopied = false);
    });
  }

  Future<void> _launchUpiApp() async {
    if (widget.move.toUpiId == null || widget.move.toUpiId!.isEmpty) return;

    final upiUri = Uri.parse(
      'upi://pay?pa=${widget.move.toUpiId}'
      '&pn=${Uri.encodeComponent(widget.move.toName)}'
      '&am=${widget.move.amount.toStringAsFixed(2)}'
      '&cu=INR'
      '&tn=KaunDegaSettlement',
    );

    try {
      if (await canLaunchUrl(upiUri)) {
        await launchUrl(upiUri, mode: LaunchMode.externalApplication);
      } else {
        _copyUpi();
      }
    } catch (_) {
      _copyUpi();
    }
  }

  Future<void> _recordSettlement() async {
    setState(() => _isRecording = true);
    try {
      final appState = Provider.of<AppState>(context, listen: false);
      await appState.recordSettlement(
        groupId: widget.groupId,
        fromUser: widget.move.from,
        toUser: widget.move.to,
        amount: widget.move.amount,
      );

      widget.onSettled();
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Settlement of ₹${widget.move.amount.toStringAsFixed(2)} recorded!'),
          backgroundColor: AppColors.positive,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: AppColors.negative,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isRecording = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final move = widget.move;
    final currentUserId = Provider.of<AppState>(context, listen: false).currentUser?.id;
    final isMeDebtor = currentUserId == move.from;
    final isMeCreditor = currentUserId == move.to;

    final modalTitle = isMeDebtor
        ? 'Settle up with ${move.toName}'
        : isMeCreditor
            ? 'Record Payment from ${move.fromName}'
            : 'Record Settlement';

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).padding.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.cardBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 18),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                modalTitle,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 20, color: AppColors.textMuted),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Payment Visual Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE6F4ED), Color(0xFFD1EBE1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Debtor
                    Expanded(
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.white,
                            child: Text(
                              move.fromName.isNotEmpty ? move.fromName[0].toUpperCase() : 'D',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            isMeDebtor ? 'You' : move.fromName,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),

                    // Arrow
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 10),
                      child: Column(
                        children: [
                          Icon(LucideIcons.arrowRight, size: 22, color: AppColors.primary),
                          SizedBox(height: 2),
                          Text(
                            'PAYS',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textMuted,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Creditor
                    Expanded(
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.white,
                            child: Text(
                              move.toName.isNotEmpty ? move.toName[0].toUpperCase() : 'C',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            isMeCreditor ? 'You' : move.toName,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Amount
                Text(
                  '₹${move.amount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Show Pay via UPI ONLY if current user is the payer (debtor)
          if (isMeDebtor && move.toUpiId != null && move.toUpiId!.isNotEmpty) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _launchUpiApp,
                icon: const Icon(LucideIcons.smartphone, size: 18),
                label: Text(
                  'Pay ₹${move.amount.toStringAsFixed(2)} via UPI App',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.wallet, size: 18, color: AppColors.primary),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'UPI ID',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textMuted,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          move.toUpiId!,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: _copyUpi,
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _isCopied ? AppColors.positiveBg : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _isCopied ? LucideIcons.check : LucideIcons.copy,
                            size: 14,
                            color: _isCopied ? AppColors.positive : AppColors.textPrimary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _isCopied ? 'Copied' : 'Copy',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: _isCopied ? AppColors.positive : AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          Text(
            isMeDebtor
                ? 'Pay via any UPI app or cash, then confirm below to record the settlement.'
                : isMeCreditor
                    ? 'Confirm that ${move.fromName} paid you ₹${move.amount.toStringAsFixed(2)} in cash or bank transfer.'
                    : 'Record settlement of ₹${move.amount.toStringAsFixed(2)} between ${move.fromName} and ${move.toName}.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 20),

          // Action Buttons
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isRecording ? null : _recordSettlement,
              icon: _isRecording
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(LucideIcons.checkCircle, size: 20),
              label: Text(
                _isRecording
                    ? 'Recording...'
                    : isMeDebtor
                        ? 'I\'ve Paid — Mark as Settled'
                        : isMeCreditor
                            ? 'Confirm — Received Payment'
                            : 'Record Settlement',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              ),
            ),
          ),
          if (isMeCreditor) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  final text = 'Hi ${move.fromName}! Friendly reminder to settle your balance of ₹${move.amount.toStringAsFixed(2)} on Kaun Dega.';
                  ShareService.shareToWhatsapp(text);
                },
                icon: const Icon(LucideIcons.messageSquare, size: 18, color: Color(0xFF25D366)),
                label: Text(
                  'Remind ${move.fromName} on WhatsApp',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF25D366)),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: Color(0xFF25D366)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
