import { supabase } from './supabaseClient';
import { computeBalances, buildWhatsappText } from './balances';

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not logged in');
  return data.user.id;
}

async function fetchMembers(groupId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('role, profiles(id, name, email, phone, upi_id)')
    .eq('group_id', groupId);
  if (error) throw error;
  return data.map((row) => ({ ...row.profiles, role: row.role }));
}

export const api = {
  // ============================================================
  // GROUP LISTING
  // ============================================================
  async getGroups() {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from('group_members')
      .select('role, groups(id, name, emoji, created_at, invite_code)')
      .eq('user_id', userId);
    if (error) throw error;
    
    // Fallback: hide groups that the user tried to delete but backend RLS blocked.
    const hiddenStr = localStorage.getItem(`hidden_groups_${userId}`) || '[]';
    let hiddenGroups = [];
    try { hiddenGroups = JSON.parse(hiddenStr); } catch (e) {}

    return data
      .map((row) => ({ ...row.groups, myRole: row.role }))
      .filter(g => !hiddenGroups.includes(g.id));
  },

  // ============================================================
  // INVITE SYSTEM (Secure Token-based)
  // ============================================================

  // Generate a secure invite link (admin-only, enforced server-side)
  async generateInviteLink(groupId) {
    const { data, error } = await supabase.rpc('generate_invite_token', {
      p_group_id: groupId,
      p_expires_in_days: 7,
    });
    if (error) throw new Error(error.message);
    return data; // { id, token, groupId, expiresAt, createdAt }
  },

  // Get invite info for the join page (any authenticated user)
  async getInviteInfo(token) {
    const { data, error } = await supabase.rpc('get_invite_info', {
      p_token: token,
    });
    if (error) throw new Error(error.message);
    return data; // { valid, groupName, groupEmoji, invitedBy, memberCount, isAlreadyMember, error? }
  },

  // Join group using secure token (any authenticated user, enforced server-side)
  async joinGroupByToken(token) {
    const { data, error } = await supabase.rpc('join_group_by_token', {
      p_token: token,
    });
    if (error) throw new Error(error.message);
    return data; // { success, alreadyMember, groupId, groupName, message }
  },

  // Legacy: get group by old 6-char invite code (backward compat)
  async getGroupByInviteCode(code) {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, emoji, invite_code')
      .eq('invite_code', code.toUpperCase())
      .single();
    if (error) throw new Error('Invalid invite code or group not found.');
    return data;
  },

  // Legacy: join by old 6-char code (backward compat)
  async joinGroupByCode(code) {
    const userId = await currentUserId();
    const group = await this.getGroupByInviteCode(code);

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', group.id)
      .eq('user_id', userId);
    
    if (existing && existing.length > 0) {
      return { group, alreadyMember: true };
    }

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'member' });
    if (error) throw error;

    return { group, alreadyMember: false };
  },

  // ============================================================
  // GROUP CRUD
  // ============================================================

  // Creates a group, adds the creator as admin
  async createGroup({ name, emoji, memberEmails = [] }) {
    const userId = await currentUserId();

    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .insert({ name, emoji: emoji || '🧾', created_by: userId })
      .select()
      .single();
    if (groupErr) throw groupErr;

    // Add creator as admin
    const { error: selfErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'admin' });
    if (selfErr) throw selfErr;

    // Handle legacy participant adding (names/emails)
    if (memberEmails.length) {
      const inputs = memberEmails;
      const emails = inputs.filter(i => i.includes('@'));
      const names = inputs.filter(i => !i.includes('@'));

      let existingProfiles = [];
      if (emails.length) {
        const { data: byEmail } = await supabase.from('profiles').select('id, email, name').in('email', emails);
        if (byEmail) existingProfiles.push(...byEmail);
      }
      if (names.length) {
        const { data: byName } = await supabase.from('profiles').select('id, email, name').in('name', names);
        if (byName) existingProfiles.push(...byName);
      }

      const inviteeRows = [];
      for (const input of inputs) {
        const isEmail = input.includes('@');
        const match = existingProfiles.find(p => 
          isEmail ? p.email.toLowerCase() === input.toLowerCase() : p.name.toLowerCase() === input.toLowerCase()
        );

        if (match) {
          if (match.id !== userId && !inviteeRows.find(r => r.user_id === match.id)) {
            inviteeRows.push({ group_id: group.id, user_id: match.id, role: 'member' });
          }
        } else {
          // Create shadow profile
          const shadowId = crypto.randomUUID();
          const shadowEmail = isEmail ? input : `${shadowId}@shadow.local`;
          const shadowName = isEmail ? input.split('@')[0] : input;

          const { error: shadowErr } = await supabase.from('profiles').insert({
            id: shadowId,
            name: shadowName,
            email: shadowEmail
          });

          if (shadowErr) throw shadowErr;
          inviteeRows.push({ group_id: group.id, user_id: shadowId, role: 'member' });
        }
      }

      if (inviteeRows.length) {
        const { error: inviteErr } = await supabase.from('group_members').upsert(inviteeRows, {
          onConflict: 'group_id,user_id',
        });
        if (inviteErr) throw inviteErr;
      }
    }

    return group;
  },

  // ============================================================
  // GROUP DELETION & LEAVING (RPC-enforced)
  // ============================================================

  // Delete group (admin-only, enforced server-side)
  async deleteGroup(groupId) {
    const { data, error } = await supabase.rpc('delete_group_as_admin', {
      p_group_id: groupId,
    });
    if (error) throw new Error(error.message);

    // Clean up localStorage hidden groups
    const userId = await currentUserId();
    try {
      const hiddenStr = localStorage.getItem(`hidden_groups_${userId}`) || '[]';
      const hiddenGroups = JSON.parse(hiddenStr);
      if (!hiddenGroups.includes(groupId)) {
        hiddenGroups.push(groupId);
        localStorage.setItem(`hidden_groups_${userId}`, JSON.stringify(hiddenGroups));
      }
    } catch (e) {}

    return data;
  },

  // Leave group (member-only, admin cannot leave)
  async leaveGroup(groupId) {
    const { data, error } = await supabase.rpc('leave_group', {
      p_group_id: groupId,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // ============================================================
  // ROLES
  // ============================================================

  // Get current user's role in a group
  async getUserRole(groupId) {
    const { data, error } = await supabase.rpc('get_user_role_in_group', {
      p_group_id: groupId,
    });
    if (error) throw new Error(error.message);
    return data; // 'admin' | 'member' | null
  },

  // ============================================================
  // EXISTING FUNCTIONALITY (Preserved)
  // ============================================================

  async getAllHistory() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, group:groups(name, emoji), payer:profiles!paid_by(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getProfile() {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(updates) {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getMembers: fetchMembers,

  async getExpenses(groupId) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, expense_shares(user_id, share_amount), payer:profiles!paid_by(name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async addExpense({ groupId, description, amount, paidBy, splitType, shares, memberIds }) {
    let computedShares = [];

    if (splitType === 'custom') {
      if (!Array.isArray(shares) || !shares.length) {
        throw new Error('custom split requires at least one share');
      }
      const total = shares.reduce((sum, s) => sum + Number(s.amount), 0);
      if (Math.abs(total - Number(amount)) > 0.01) {
        throw new Error(
          `Custom shares (₹${total.toFixed(2)}) must add up to the total amount (₹${Number(amount).toFixed(2)})`
        );
      }
      computedShares = shares.map((s) => ({ user_id: s.userId, share_amount: Number(s.amount) }));
    } else {
      if (!Array.isArray(memberIds) || !memberIds.length) {
        throw new Error('equal split requires at least one member');
      }
      // Equal split with any rounding remainder going to the first member (the payer).
      const equalShare = Math.floor((Number(amount) / memberIds.length) * 100) / 100;
      const remainder = Number((Number(amount) - equalShare * memberIds.length).toFixed(2));
      computedShares = memberIds.map((userId, i) => ({
        user_id: userId,
        share_amount: i === 0 ? Number((equalShare + remainder).toFixed(2)) : equalShare,
      }));
    }

    const { data: expense, error: expenseErr } = await supabase
      .from('expenses')
      .insert({
        group_id: groupId,
        description,
        amount,
        paid_by: paidBy,
        split_type: splitType || 'equal',
      })
      .select()
      .single();
    if (expenseErr) throw expenseErr;

    const shareRows = computedShares.map((s) => ({ ...s, expense_id: expense.id }));
    const { error: shareErr } = await supabase.from('expense_shares').insert(shareRows);
    if (shareErr) throw shareErr;

    return { ...expense, expense_shares: shareRows };
  },

  async getBalances(groupId) {
    const [members, expensesRes, settlementsRes] = await Promise.all([
      fetchMembers(groupId),
      supabase
        .from('expenses')
        .select('paid_by, expense_shares(user_id, share_amount)')
        .eq('group_id', groupId),
      supabase.from('settlements').select('from_user, to_user, amount').eq('group_id', groupId),
    ]);

    if (expensesRes.error) throw expensesRes.error;
    if (settlementsRes.error) throw settlementsRes.error;

    return computeBalances(members, expensesRes.data, settlementsRes.data);
  },

  async addSettlement({ groupId, fromUser, toUser, amount }) {
    const { data, error } = await supabase
      .from('settlements')
      .insert({ group_id: groupId, from_user: fromUser, to_user: toUser, amount })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getWhatsappText(groupId) {
    const [{ data: group, error: groupErr }, { moves }] = await Promise.all([
      supabase.from('groups').select('name, emoji').eq('id', groupId).single(),
      this.getBalances(groupId),
    ]);
    if (groupErr) throw groupErr;
    return { text: buildWhatsappText(group, moves) };
  },

  async updateExpensePayer(expenseId, newPayerId) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ paid_by: newPayerId })
      .eq('id', expenseId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Update failed — you may not have permission.');
    return data[0];
  },

  async deleteExpense(expenseId) {
    // Delete shares first (child rows), then the expense itself
    const { error: sharesErr } = await supabase
      .from('expense_shares')
      .delete()
      .eq('expense_id', expenseId);
    if (sharesErr) throw sharesErr;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    if (error) throw error;
  },
};
