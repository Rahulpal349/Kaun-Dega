import { supabase } from './supabaseClient';
import { computeBalances, buildWhatsappText } from './balances';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

async function firebaseUidToUuid(uid) {
  const encoder = new TextEncoder();
  const data = encoder.encode(uid);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function ensureProfileExists(uuid, firebaseUser) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', uuid)
    .single();

  if (error && error.code === 'PGRST116') {
    const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
    await supabase.from('profiles').insert({
      id: uuid,
      name: name,
      email: firebaseUser.email
    });
  }
}

let cachedAuthPromise = null;

async function currentUserId() {
  if (cachedAuthPromise) return cachedAuthPromise;

  cachedAuthPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        try {
          const idToken = await user.getIdToken();
          
          const res = await fetch('/api/auth/token', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          
          if (!res.ok) {
            throw new Error('Failed to exchange Firebase token for Supabase token');
          }

          const { token, uuid } = await res.json();
          
          // Set the session globally for this Supabase client
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: ''
          });

          await ensureProfileExists(uuid, user);
          resolve(uuid);
        } catch (e) {
          cachedAuthPromise = null;
          reject(e);
        }
      } else {
        cachedAuthPromise = null;
        reject(new Error('Not logged in'));
      }
    });
  });

  return cachedAuthPromise;
}

async function fetchMembers(groupId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, role, profiles(id, name, email, phone, upi_id)')
    .eq('group_id', groupId);
  if (error) throw error;
  return data.map((row) => ({
    id: row.profiles?.id || row.user_id,
    name: row.profiles?.name || row.profiles?.email?.split('@')[0] || 'Member',
    email: row.profiles?.email || null,
    phone: row.profiles?.phone || null,
    upi_id: row.profiles?.upi_id || null,
    role: row.role,
  }));
}

export const api = {
  currentUserId,
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

  // Add a single shadow/offline member to an existing group
  async addShadowMember(groupId, input) {
    if (!input || !input.trim()) return;
    const isEmail = input.includes('@');
    
    // Check if profile exists already
    let existingProfile = null;
    const { data } = await supabase.from('profiles').select('id, name, email').eq(isEmail ? 'email' : 'name', input).limit(1);
    if (data && data.length > 0) existingProfile = data[0];

    let userId;
    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      userId = crypto.randomUUID();
      const shadowEmail = isEmail ? input : `${userId}@shadow.local`;
      const shadowName = isEmail ? input.split('@')[0] : input;

      const { error: shadowErr } = await supabase.from('profiles').insert({
        id: userId,
        name: shadowName,
        email: shadowEmail
      });
      if (shadowErr) throw shadowErr;
    }

    // Add to group
    const { error: joinErr } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member'
    });
    
    // Ignore duplicate conflict errors if already a member
    if (joinErr && joinErr.code !== '23505') throw joinErr;
    
    return true;
  },

  // ============================================================
  // GROUP DELETION & LEAVING (RPC-enforced)
  // ============================================================

  // Delete group (bypassing RPC since auth.uid() is null for Firebase users)
  async deleteGroup(groupId) {
    const { data, error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
      
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

  // Leave group (bypassing RPC since auth.uid() is null for Firebase users)
  async leaveGroup(groupId) {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return data;
  },

  async removeMember(groupId, userId) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .match({ group_id: groupId, user_id: userId });
    
    if (error) throw error;
    return true;
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
    const userId = await currentUserId();
    
    // Only fetch history for groups the user is currently a member of
    const { data: myGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    const groupIds = (myGroups || []).map(g => g.group_id);

    if (groupIds.length === 0) return [];

    const { data, error } = await supabase
      .from('expenses')
      .select('*, group:groups(name, emoji), payer:profiles!paid_by(name)')
      .in('group_id', groupIds)
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
    cachedAuthPromise = null;
    await supabase.auth.signOut(); // Also clear Supabase session
    await auth.signOut();
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
      // Equal split with any rounding remainder going to the payer (or first member).
      const equalShare = Math.floor((Number(amount) / memberIds.length) * 100) / 100;
      const remainder = Number((Number(amount) - equalShare * memberIds.length).toFixed(2));
      const remainderTargetId = memberIds.includes(paidBy) ? paidBy : memberIds[0];
      computedShares = memberIds.map((userId) => ({
        user_id: userId,
        share_amount: userId === remainderTargetId ? Number((equalShare + remainder).toFixed(2)) : equalShare,
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

  async updateExpense(expenseId, { groupId, description, amount, paidBy, splitType, shares, memberIds }) {
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
      const equalShare = Math.floor((Number(amount) / memberIds.length) * 100) / 100;
      const remainder = Number((Number(amount) - equalShare * memberIds.length).toFixed(2));
      const remainderTargetId = memberIds.includes(paidBy) ? paidBy : memberIds[0];
      computedShares = memberIds.map((userId) => ({
        user_id: userId,
        share_amount: userId === remainderTargetId ? Number((equalShare + remainder).toFixed(2)) : equalShare,
      }));
    }

    const { data: expense, error: expenseErr } = await supabase
      .from('expenses')
      .update({
        description,
        amount,
        paid_by: paidBy,
        split_type: splitType || 'equal',
      })
      .eq('id', expenseId)
      .select()
      .single();
    if (expenseErr) throw expenseErr;

    const { error: delErr } = await supabase.from('expense_shares').delete().eq('expense_id', expenseId);
    if (delErr) throw delErr;

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
        .select('paid_by, expense_shares(user_id, share_amount), payer:profiles!paid_by(id, name, upi_id)')
        .eq('group_id', groupId),
      supabase.from('settlements').select('from_user, to_user, amount').eq('group_id', groupId),
    ]);

    if (expensesRes.error) throw expensesRes.error;
    if (settlementsRes.error) throw settlementsRes.error;

    // Enrich members list with known payer profiles (in case former members paid expenses)
    const knownMembers = [...members];
    const memberIds = new Set(knownMembers.map((m) => m.id));
    (expensesRes.data || []).forEach((e) => {
      if (e.payer && e.payer.id && !memberIds.has(e.payer.id)) {
        knownMembers.push({
          id: e.payer.id,
          name: e.payer.name || 'Former Member',
          upi_id: e.payer.upi_id || null,
          role: 'former',
        });
        memberIds.add(e.payer.id);
      }
    });

    return computeBalances(knownMembers, expensesRes.data, settlementsRes.data);
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
