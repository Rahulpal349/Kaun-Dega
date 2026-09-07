import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../config/theme.dart';
import '../providers/app_state.dart';
import '../screens/group/group_detail_screen.dart';

class DirectTransactionModal extends StatefulWidget {
  const DirectTransactionModal({super.key});

  @override
  State<DirectTransactionModal> createState() => _DirectTransactionModalState();
}

class _DirectTransactionModalState extends State<DirectTransactionModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();

  bool _isYouGave = true; // true = You Gave (Lent), false = You Got (Received)
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final amountStr = _amountController.text.trim();
    final amount = double.tryParse(amountStr);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final targetGroup = await appState.addDirect1on1Transaction(
        contactName: _nameController.text.trim(),
        contactEmail: _emailController.text.trim(),
        amount: amount,
        isYouGave: _isYouGave,
        note: _noteController.text.trim(),
      );

      if (!mounted) return;
      Navigator.pop(context); // Close bottom sheet

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isYouGave
              ? 'Recorded: Gave ₹${amount.toStringAsFixed(0)} to ${_nameController.text.trim()}'
              : 'Recorded: Got ₹${amount.toStringAsFixed(0)} from ${_nameController.text.trim()}'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: _isYouGave ? AppColors.positive : AppColors.primary,
        ),
      );

      // Open 1-on-1 Ledger Screen
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => GroupDetailScreen(groupId: targetGroup.id)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}'), behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle Bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.positiveBg,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(LucideIcons.arrowUpRight, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Khatabook 1-on-1 Entry',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      Text(
                        'Direct transaction with a contact',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Direction Selection Toggle (You Gave vs You Got)
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _isYouGave = true),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: _isYouGave ? const Color(0xFFDC2626) : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _isYouGave ? const Color(0xFFDC2626) : AppColors.cardBorder,
                            width: 1.5,
                          ),
                          boxShadow: _isYouGave
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFFDC2626).withValues(alpha: 0.3),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : [],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.arrowUpRight,
                                size: 18, color: _isYouGave ? Colors.white : AppColors.textSecondary),
                            const SizedBox(width: 6),
                            Text(
                              'You Gave (diye)',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: _isYouGave ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _isYouGave = false),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: !_isYouGave ? const Color(0xFF059669) : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: !_isYouGave ? const Color(0xFF059669) : AppColors.cardBorder,
                            width: 1.5,
                          ),
                          boxShadow: !_isYouGave
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFF059669).withValues(alpha: 0.3),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ]
                              : [],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.arrowDownLeft,
                                size: 18, color: !_isYouGave ? Colors.white : AppColors.textSecondary),
                            const SizedBox(width: 6),
                            Text(
                              'You Got (mile)',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: !_isYouGave ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Contact Name
              TextFormField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  labelText: 'Contact / Friend Name *',
                  hintText: 'e.g. Rahul, Priya, Alex',
                  prefixIcon: const Icon(LucideIcons.user, size: 18),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Enter contact name' : null,
              ),
              const SizedBox(height: 14),

              // Contact Email or Phone (Optional)
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email or Phone (Optional)',
                  hintText: 'e.g. rahul@gmail.com (Auto-syncs when they join)',
                  prefixIcon: const Icon(LucideIcons.mail, size: 18),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
              const SizedBox(height: 14),

              // Amount
              TextFormField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                decoration: InputDecoration(
                  labelText: 'Amount *',
                  prefixText: '₹ ',
                  prefixStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Enter amount';
                  if (double.tryParse(val.trim()) == null) return 'Enter valid number';
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Note / Description
              TextFormField(
                controller: _noteController,
                decoration: InputDecoration(
                  labelText: 'Note / Reason (Optional)',
                  hintText: 'e.g. Dinner, Chai, Travel cash',
                  prefixIcon: const Icon(LucideIcons.fileText, size: 18),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isYouGave ? const Color(0xFFDC2626) : const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : Text(
                          _isYouGave ? 'Save "You Gave ₹${_amountController.text}"' : 'Save "You Got ₹${_amountController.text}"',
                          style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
