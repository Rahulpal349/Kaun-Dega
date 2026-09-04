import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../config/theme.dart';
import '../../models/user_model.dart';
import '../../providers/app_state.dart';
import '../../services/storage_service.dart';
import 'group_detail_screen.dart';

class GroupThemeOption {
  final String id;
  final String label;
  final IconData icon;

  const GroupThemeOption({required this.id, required this.label, required this.icon});
}

class NewGroupScreen extends StatefulWidget {
  const NewGroupScreen({super.key});

  @override
  State<NewGroupScreen> createState() => _NewGroupScreenState();
}

class _NewGroupScreenState extends State<NewGroupScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _participantController = TextEditingController();
  final StorageService _storageService = StorageService();

  final List<String> _participants = [];
  final Map<String, UserModel?> _registeredUserMap = {};
  String _selectedTheme = 'food';
  bool _isLoading = false;
  String? _errorMessage;

  final List<GroupThemeOption> _customCategories = [];

  static const List<GroupThemeOption> _themeOptions = [
    GroupThemeOption(id: 'food', label: 'Food & Drinks', icon: LucideIcons.utensils),
    GroupThemeOption(id: 'trip', label: 'Trip & Travel', icon: LucideIcons.plane),
    GroupThemeOption(id: 'home', label: 'Household', icon: LucideIcons.home),
    GroupThemeOption(id: 'party', label: 'Party & Outing', icon: LucideIcons.sparkles),
    GroupThemeOption(id: 'office', label: 'Work & Office', icon: LucideIcons.briefcase),
    GroupThemeOption(id: 'shopping', label: 'Shopping', icon: LucideIcons.shoppingBag),
    GroupThemeOption(id: 'movies', label: 'Movies & Show', icon: LucideIcons.clapperboard),
    GroupThemeOption(id: 'rent', label: 'Rent & Bills', icon: LucideIcons.building),
    GroupThemeOption(id: 'fuel', label: 'Fuel & Transport', icon: LucideIcons.car),
    GroupThemeOption(id: 'fitness', label: 'Fitness & Sports', icon: LucideIcons.dumbbell),
    GroupThemeOption(id: 'education', label: 'Study & Courses', icon: LucideIcons.graduationCap),
    GroupThemeOption(id: 'coffee', label: 'Coffee & Snacks', icon: LucideIcons.coffee),
    GroupThemeOption(id: 'gifts', label: 'Gifts', icon: LucideIcons.gift),
    GroupThemeOption(id: 'health', label: 'Medical & Health', icon: LucideIcons.heartPulse),
    GroupThemeOption(id: 'other', label: 'Other', icon: LucideIcons.tag),
  ];

  void _showAddCustomCategoryDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Add Custom Category', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter a custom category name for your group.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'e.g. Subscriptions, Gaming, Wedding',
                prefixIcon: Icon(LucideIcons.tag, size: 18),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              final text = controller.text.trim();
              if (text.isNotEmpty) {
                Navigator.pop(ctx);
                final customOpt = GroupThemeOption(id: text, label: text, icon: LucideIcons.tag);
                setState(() {
                  _customCategories.add(customOpt);
                  _selectedTheme = customOpt.id;
                });
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Add Category'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _participantController.dispose();
    super.dispose();
  }

  void _addParticipant() async {
    final text = _participantController.text.trim();
    if (text.isNotEmpty && !_participants.contains(text)) {
      setState(() {
        _participants.add(text);
        _participantController.clear();
      });

      if (text.contains('@')) {
        final profile = await _storageService.getUserProfileForEmail(text);
        if (mounted) {
          setState(() {
            _registeredUserMap[text.toLowerCase().trim()] = profile;
          });
        }
      }
    }
  }

  void _removeParticipant(int index) {
    setState(() {
      _participants.removeAt(index);
    });
  }

  Future<void> _handleCreateGroup() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter a name for the group');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final createdGroup = await appState.createGroup(
        name: name,
        icon: _selectedTheme,
        extraParticipants: _participants,
      );

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => GroupDetailScreen(groupId: createdGroup.id),
        ),
      );
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('New Ledger'),
        leading: IconButton(
          icon: const Icon(LucideIcons.x, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // White Card Form
              Container(
                padding: const EdgeInsets.all(24),
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
                    const Text(
                      'Group Identity',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _nameController,
                      autofocus: true,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      decoration: const InputDecoration(
                        hintText: 'e.g. Goa Beach Trip or Flat 402',
                        prefixIcon: Icon(LucideIcons.edit3, size: 20, color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Ledger Theme Selection
                    const Text(
                      'Category Theme',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 10),
                    () {
                      final allOptions = [..._themeOptions, ..._customCategories];
                      final totalCount = allOptions.length + 1; // +1 for Custom Category button
                      return GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 3.4,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                        ),
                        itemCount: totalCount,
                        itemBuilder: (context, index) {
                          if (index < allOptions.length) {
                            final opt = allOptions[index];
                            final isSelected = _selectedTheme == opt.id;
                            return InkWell(
                              onTap: () => setState(() => _selectedTheme = opt.id),
                              borderRadius: BorderRadius.circular(16),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? AppColors.primary : AppColors.surfaceMuted,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isSelected ? AppColors.primary : AppColors.cardBorder,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      opt.icon,
                                      size: 16,
                                      color: isSelected ? Colors.white : AppColors.primary,
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        opt.label,
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w700,
                                          color: isSelected ? Colors.white : AppColors.textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isSelected) ...[
                                      const SizedBox(width: 4),
                                      const Icon(LucideIcons.check, size: 14, color: Colors.white),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          } else {
                            return InkWell(
                              onTap: _showAddCustomCategoryDialog,
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AppColors.positiveBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.primary, width: 1.5),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(LucideIcons.plus, size: 16, color: AppColors.primary),
                                    SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        'Custom Category',
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }
                        },
                      );
                    }(),
                    const SizedBox(height: 28),

                    // Add Participants
                    const Text(
                      'Participants',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Add friends by name or email (Registered users will see group on dashboard instantly)',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _participantController,
                            onSubmitted: (_) => _addParticipant(),
                            decoration: const InputDecoration(
                              hintText: 'e.g. Rahul, friend@gmail.com...',
                              prefixIcon: Icon(LucideIcons.userPlus, size: 18, color: AppColors.textMuted),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          onPressed: _addParticipant,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.textPrimary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Add'),
                        ),
                      ],
                    ),

                    if (_participants.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _participants.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final rawName = entry.value;
                          final isEmail = rawName.contains('@');
                          final emailKey = rawName.toLowerCase().trim();
                          final regUser = _registeredUserMap[emailKey];
                          final isRegistered = regUser != null;

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isRegistered
                                  ? AppColors.positiveBg
                                  : isEmail
                                      ? AppColors.blueBg.withValues(alpha: 0.5)
                                      : AppColors.surfaceMuted,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isRegistered
                                    ? AppColors.positive.withValues(alpha: 0.5)
                                    : AppColors.cardBorder,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (isRegistered)
                                  const Icon(LucideIcons.checkCircle2, size: 14, color: AppColors.positive)
                                else if (isEmail)
                                  const Icon(LucideIcons.mail, size: 14, color: AppColors.blue)
                                else
                                  CircleAvatar(
                                    radius: 10,
                                    backgroundColor: AppColors.primary,
                                    child: Text(
                                      rawName.isNotEmpty ? rawName[0].toUpperCase() : '?',
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                const SizedBox(width: 6),
                                Text(
                                  isRegistered
                                      ? '🟢 Registered: ${regUser.name}'
                                      : rawName,
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: isRegistered ? FontWeight.w800 : FontWeight.w600,
                                    color: isRegistered
                                        ? AppColors.positive
                                        : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                GestureDetector(
                                  onTap: () => _removeParticipant(idx),
                                  child: const Icon(LucideIcons.x, size: 14, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ],

                    if (_errorMessage != null) ...[
                      const SizedBox(height: 20),
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

                    const SizedBox(height: 32),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleCreateGroup,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                        child: _isLoading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('CREATE LEDGER', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
