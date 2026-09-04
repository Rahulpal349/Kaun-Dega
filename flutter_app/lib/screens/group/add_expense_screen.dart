import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../config/theme.dart';
import '../../providers/app_state.dart';
import '../../models/expense_model.dart';

class AddExpenseScreen extends StatefulWidget {
  final String groupId;
  final ExpenseModel? existingExpense;

  const AddExpenseScreen({
    super.key,
    required this.groupId,
    this.existingExpense,
  });

  @override
  State<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends State<AddExpenseScreen> {
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  late String _paidBy;
  String _splitType = 'equal'; // 'equal' | 'custom'

  // Equal split selection map
  final Map<String, bool> _equalMembers = {};

  // Custom split values
  final Map<String, TextEditingController> _customAmountControllers = {};

  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final appState = Provider.of<AppState>(context, listen: false);
    final group = appState.activeGroup;
    final currentUserId = appState.currentUser?.id ?? '';

    _paidBy = widget.existingExpense?.paidBy ?? currentUserId;
    if (widget.existingExpense != null) {
      _descController.text = widget.existingExpense!.description;
      _amountController.text = widget.existingExpense!.amount.toStringAsFixed(2);
      _noteController.text = widget.existingExpense!.note;
      _splitType = widget.existingExpense!.splitType;
    }

    if (group != null) {
      for (final m in group.memberList) {
        if (widget.existingExpense != null) {
          final isIncluded = widget.existingExpense!.shares.any((s) => s.userId == m.id);
          _equalMembers[m.id] = isIncluded;

          final share = widget.existingExpense!.shares.cast<ExpenseShare?>().firstWhere(
            (s) => s?.userId == m.id,
            orElse: () => null,
          );
          _customAmountControllers[m.id] = TextEditingController(
            text: share != null ? share.amount.toStringAsFixed(2) : '',
          );
        } else {
          _equalMembers[m.id] = true;
          _customAmountControllers[m.id] = TextEditingController();
        }
      }
    }
  }

  @override
  void dispose() {
    _descController.dispose();
    _amountController.dispose();
    _noteController.dispose();
    for (final c in _customAmountControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  double get _totalAmount => double.tryParse(_amountController.text.trim()) ?? 0.0;

  int get _selectedMemberCount => _equalMembers.values.where((v) => v).length;

  double get _perPersonShare {
    final count = _selectedMemberCount;
    if (count == 0 || _totalAmount <= 0) return 0.0;
    return _totalAmount / count;
  }

  Future<void> _handleSave() async {
    final desc = _descController.text.trim();
    final amt = _totalAmount;

    if (desc.isEmpty) {
      setState(() => _errorMessage = 'Please enter what this expense was for');
      return;
    }
    if (amt <= 0) {
      setState(() => _errorMessage = 'Please enter an amount above ₹0');
      return;
    }

    final appState = Provider.of<AppState>(context, listen: false);
    final group = appState.activeGroup;
    if (group == null) return;

    List<ExpenseShare> shares = [];

    if (_splitType == 'equal') {
      final selectedIds = _equalMembers.entries.where((e) => e.value).map((e) => e.key).toList();
      if (selectedIds.isEmpty) {
        setState(() => _errorMessage = 'Please select at least one member to split with');
        return;
      }

      final equalShare = double.parse((amt / selectedIds.length).toStringAsFixed(2));
      final remainder = double.parse((amt - (equalShare * selectedIds.length)).toStringAsFixed(2));

      shares = selectedIds.map((uId) {
        final isPayer = uId == _paidBy;
        final shareAmt = isPayer ? equalShare + remainder : equalShare;
        return ExpenseShare(userId: uId, amount: shareAmt);
      }).toList();
    } else {
      double customSum = 0.0;
      for (final m in group.memberList) {
        final val = double.tryParse(_customAmountControllers[m.id]?.text.trim() ?? '') ?? 0.0;
        if (val > 0) {
          shares.add(ExpenseShare(userId: m.id, amount: val));
          customSum += val;
        }
      }

      if (shares.isEmpty) {
        setState(() => _errorMessage = 'Please enter custom split amounts');
        return;
      }

      if ((customSum - amt).abs() > 0.05) {
        setState(() => _errorMessage = 'Custom shares sum (₹${customSum.toStringAsFixed(2)}) must equal total (₹${amt.toStringAsFixed(2)})');
        return;
      }
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      if (widget.existingExpense != null) {
        final updated = ExpenseModel(
          id: widget.existingExpense!.id,
          groupId: widget.groupId,
          description: desc,
          amount: amt,
          paidBy: _paidBy,
          splitType: _splitType,
          shares: shares,
          payer: PayerInfo(
            id: _paidBy,
            name: group.members[_paidBy]?.name ?? 'Member',
            upiId: group.members[_paidBy]?.upiId,
          ),
          createdAt: widget.existingExpense!.createdAt,
          note: _noteController.text.trim(),
        );
        await appState.updateExpense(updated);
      } else {
        await appState.addExpense(
          groupId: widget.groupId,
          description: desc,
          amount: amt,
          paidBy: _paidBy,
          splitType: _splitType,
          shares: shares,
          note: _noteController.text.trim(),
        );
      }

      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final group = appState.activeGroup;
    final currentUserId = appState.currentUser?.id ?? '';
    final members = group?.memberList ?? [];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.existingExpense != null ? 'Edit Expense' : 'Add New Expense'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Main Form Card
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(color: AppColors.cardBorder),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Description
                          const Text(
                            'What was it for?',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _descController,
                            autofocus: widget.existingExpense == null,
                            decoration: const InputDecoration(
                              hintText: 'e.g. Dinner, Uber ride, Groceries',
                              prefixIcon: Icon(LucideIcons.coffee, size: 20, color: AppColors.primary),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Amount & Paid By Row
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Amount
                              Expanded(
                                flex: 5,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Amount (₹)',
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                    ),
                                    const SizedBox(height: 8),
                                    TextField(
                                      controller: _amountController,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      onChanged: (_) => setState(() {}),
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary),
                                      decoration: const InputDecoration(
                                        hintText: '0.00',
                                        prefixIcon: Icon(LucideIcons.indianRupee, size: 18, color: AppColors.primary),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 14),

                              // Paid By
                              Expanded(
                                flex: 6,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Paid by',
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: AppColors.cardBorder, width: 1.2),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: members.any((m) => m.id == _paidBy) ? _paidBy : members.firstOrNull?.id,
                                          isExpanded: true,
                                          icon: const Icon(LucideIcons.chevronDown, size: 18, color: AppColors.textMuted),
                                          items: members.map((m) {
                                            return DropdownMenuItem<String>(
                                              value: m.id,
                                              child: Text(
                                                '${m.name} ${m.id == currentUserId ? '(You)' : ''}',
                                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            );
                                          }).toList(),
                                          onChanged: (val) {
                                            if (val != null) setState(() => _paidBy = val);
                                          },
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Split Type Switcher
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceMuted,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => setState(() => _splitType = 'equal'),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 150),
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      decoration: BoxDecoration(
                                        color: _splitType == 'equal' ? AppColors.primary : Colors.transparent,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        'Split Equally',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: _splitType == 'equal' ? Colors.white : AppColors.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => setState(() => _splitType = 'custom'),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 150),
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      decoration: BoxDecoration(
                                        color: _splitType == 'custom' ? AppColors.primary : Colors.transparent,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        'Custom Shares',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: _splitType == 'custom' ? Colors.white : AppColors.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Equal Split UI
                          if (_splitType == 'equal') ...[
                            // Select All Row
                            InkWell(
                              onTap: () {
                                final allSelected = _equalMembers.values.every((v) => v);
                                setState(() {
                                  for (final m in members) {
                                    _equalMembers[m.id] = !allSelected;
                                  }
                                });
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                child: Row(
                                  children: [
                                    Icon(
                                      _equalMembers.values.every((v) => v)
                                          ? LucideIcons.checkSquare
                                          : LucideIcons.square,
                                      size: 20,
                                      color: AppColors.primary,
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'All Members (${members.length} people)',
                                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const Divider(color: AppColors.cardBorder),

                            // Member List
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: members.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 6),
                              itemBuilder: (context, idx) {
                                final m = members[idx];
                                final isSelected = _equalMembers[m.id] ?? true;
                                final share = isSelected ? _perPersonShare : 0.0;
                                final pct = isSelected && _selectedMemberCount > 0 ? (100 / _selectedMemberCount) : 0.0;

                                return InkWell(
                                  onTap: () {
                                    setState(() => _equalMembers[m.id] = !isSelected);
                                  },
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: isSelected ? AppColors.positiveBg.withValues(alpha: 0.4) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isSelected ? LucideIcons.checkSquare : LucideIcons.square,
                                          size: 18,
                                          color: isSelected ? AppColors.primary : AppColors.textMuted,
                                        ),
                                        const SizedBox(width: 10),
                                        CircleAvatar(
                                          radius: 15,
                                          backgroundColor: AppColors.positiveBg,
                                          child: Text(
                                            m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                '${m.name} ${m.id == currentUserId ? '(You)' : ''}',
                                                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                                              ),
                                              Text(
                                                '${pct.toStringAsFixed(0)}% of total',
                                                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          '₹${share.toStringAsFixed(2)}',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: isSelected ? AppColors.textPrimary : AppColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ] else ...[
                            // Custom Shares UI
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: members.length,
                              itemBuilder: (context, idx) {
                                final m = members[idx];
                                final controller = _customAmountControllers[m.id]!;

                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 16,
                                        backgroundColor: AppColors.positiveBg,
                                        child: Text(
                                          m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
                                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          '${m.name} ${m.id == currentUserId ? '(You)' : ''}',
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                      SizedBox(
                                        width: 110,
                                        child: TextField(
                                          controller: controller,
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          textAlign: TextAlign.end,
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                                          decoration: InputDecoration(
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                            hintText: '0.00',
                                            prefixText: '₹ ',
                                            prefixStyle: const TextStyle(color: AppColors.textMuted),
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ],

                          const SizedBox(height: 16),
                          // Optional Note
                          TextField(
                            controller: _noteController,
                            decoration: const InputDecoration(
                              hintText: 'Add an optional note...',
                              prefixIcon: Icon(LucideIcons.fileText, size: 18, color: AppColors.textMuted),
                            ),
                          ),

                          if (_errorMessage != null) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.negativeBg,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: AppColors.negative, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Fixed Bottom Summary Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(top: BorderSide(color: AppColors.cardBorder.withValues(alpha: 0.6))),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _paidBy == currentUserId ? 'You are paying' : 'Selected payer',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                          ),
                          Text(
                            '₹${_totalAmount.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary),
                          ),
                        ],
                      ),
                      Container(width: 1, height: 32, color: AppColors.cardBorder),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Split between $_selectedMemberCount people',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                          ),
                          Text(
                            _splitType == 'equal'
                                ? '₹${_perPersonShare.toStringAsFixed(2)} each'
                                : 'Custom shares',
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _handleSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      ),
                      child: _isSaving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(
                              widget.existingExpense != null ? 'UPDATE EXPENSE' : 'SAVE EXPENSE',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
