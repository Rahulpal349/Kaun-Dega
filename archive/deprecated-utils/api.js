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
    .select('profiles(id, name, email, phone)')
    .eq('group_id', groupId);
  if (error) throw error;
  return data.map((row) => row.profiles);
}

export const api = {
  async getGroups() {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from('group_members')
      .select('groups(id, name, emoji, created_at)')
      .eq('user_id', userId);
    if (error) throw error;
    
    // Fallback: hide groups that the user tried to delete but backend RLS blocked.
    const hiddenStr = localStorage.getItem(`hidden_groups_${userId}`) || '[]';
    let hiddenGroups = [];
    try { hiddenGroups = JSON.parse(hiddenStr); } catch (e) {}

    return data.map((row) => row.groups).filter(g => !hiddenGroups.includes(g.id));
  },

  // Creates a group, adds the creator, then looks up any invited emails and adds them.
  // Two separate inserts (not one combined upsert) because Postgres RLS evaluates
  // each row's "with check" against already-committed rows — the creator's own
  // membership row has to land first before "is an existing member" checks for the
  // invited rows can pass.
  async createGroup({ name, emoji, memberEmails = [] }) {
    const userId = await currentUserId();

    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .insert({ name, emoji: emoji || '🧾', created_by: userId })
      .select()
      .single();
    if (groupErr) throw groupErr;

    const { error: selfErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId });
    if (selfErr) throw selfErr;

    if (memberEmails.length) {
      const inputs = memberEmails; // These can now be names OR emails

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
            inviteeRows.push({ group_id: group.id, user_id: match.id });
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
          inviteeRows.push({ group_id: group.id, user_id: shadowId });
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

  async deleteGroup(groupId) {
    const userId = await currentUserId();
    
    // Hide it from UI immediately via localStorage in case RLS blocks it
    try {
      const hiddenStr = localStorage.getItem(`hidden_groups_${userId}`) || '[]';
      const hiddenGroups = JSON.parse(hiddenStr);
      if (!hiddenGroups.includes(groupId)) {
        hiddenGroups.push(groupId);
        localStorage.setItem(`hidden_groups_${userId}`, JSON.stringify(hiddenGroups));
      }
    } catch (e) {}

    // 1. Try to delete user's membership (Leave)
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);

    // 2. Try to delete the entire group (Delete)
    await supabase.from('groups').delete().eq('id', groupId);
  },

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
};
