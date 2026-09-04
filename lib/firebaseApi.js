import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { computeBalances, buildWhatsappText } from './balances';

// Helper to wait for and get current Firebase user ID
function currentUserId() {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve(auth.currentUser.uid);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
      } else {
        reject(new Error('Not logged in'));
      }
    });
  });
}

// Helper to get current Firebase User object
function currentUser() {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        reject(new Error('Not logged in'));
      }
    });
  });
}

// Ensure user profile document exists in Firestore
async function ensureUserProfile(user, extraData = {}) {
  if (!user || !user.uid) return null;
  const userRef = doc(db, 'users', user.uid);
  const emailLower = (user.email || '').toLowerCase().trim();
  try {
    const snap = await getDoc(userRef);
    let profile;
    if (!snap.exists()) {
      profile = {
        id: user.uid,
        name: extraData.name || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        email_lower: emailLower,
        phone: extraData.phone || user.phoneNumber || '',
        upi_id: extraData.upi_id || '',
        gender: extraData.gender || '',
        avatar_url: extraData.avatar_url || user.photoURL || '',
        created_at: new Date().toISOString(),
      };
      await setDoc(userRef, profile);
    } else {
      profile = { id: snap.id, ...snap.data() };
      if (emailLower && profile.email_lower !== emailLower) {
        await updateDoc(userRef, { email_lower: emailLower });
        profile.email_lower = emailLower;
      }
    }

    // Automatically claim any groups where this email was added as a shadow member
    if (emailLower) {
      claimShadowMemberships(user).catch((e) => console.warn('claimShadowMemberships background error:', e));
    }

    return profile;
  } catch (err) {
    console.warn('ensureUserProfile non-fatal warning:', err.message);
    return {
      id: user.uid,
      name: extraData.name || user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatar_url: user.photoURL || '',
    };
  }
}

// Auto-claim any groups where user's email was added by another member
async function claimShadowMemberships(user) {
  if (!user || !user.email) return;
  const uid = user.uid;
  const userEmail = user.email.toLowerCase().trim();

  try {
    const groupsToProcess = new Map();

    // 1. Query groups by memberEmails array
    try {
      const qEmails = query(
        collection(db, 'groups'),
        where('memberEmails', 'array-contains', userEmail)
      );
      const snapEmails = await getDocs(qEmails);
      snapEmails.forEach((d) => groupsToProcess.set(d.id, { id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Query by memberEmails:', e.message);
    }

    // 2. Scan recent groups in case memberEmails wasn't set on legacy groups
    try {
      const snapAll = await getDocs(collection(db, 'groups'));
      snapAll.forEach((d) => {
        const data = d.data();
        const hasMatchingEmail =
          (Array.isArray(data.memberEmails) && data.memberEmails.includes(userEmail)) ||
          Object.values(data.members || {}).some(
            (m) => m && m.email && m.email.toLowerCase().trim() === userEmail
          );
        if (hasMatchingEmail) {
          groupsToProcess.set(d.id, { id: d.id, ...data });
        }
      });
    } catch (e) {
      console.warn('Scan all groups for shadow members:', e.message);
    }

    for (const [groupId, group] of groupsToProcess.entries()) {
      let needsUpdate = false;
      const members = { ...(group.members || {}) };
      let memberIds = Array.from(new Set([...(group.memberIds || [])]));
      let memberEmails = Array.from(
        new Set(
          (group.memberEmails || [])
            .map((e) => (typeof e === 'string' ? e.toLowerCase().trim() : ''))
            .filter(Boolean)
        )
      );

      // Look for shadow member keys matching this email
      const shadowKeysToReplace = [];
      for (const [key, m] of Object.entries(members)) {
        if (
          m &&
          m.email &&
          m.email.toLowerCase().trim() === userEmail &&
          key !== uid
        ) {
          shadowKeysToReplace.push(key);
        }
      }

      if (shadowKeysToReplace.length > 0) {
        const shadowMember = members[shadowKeysToReplace[0]];
        members[uid] = {
          id: uid,
          name: user.displayName || shadowMember.name || userEmail.split('@')[0],
          email: user.email,
          phone: user.phoneNumber || shadowMember.phone || '',
          upi_id: shadowMember.upi_id || '',
          role: shadowMember.role || 'member',
          avatar_url: user.photoURL || shadowMember.avatar_url || '',
          isShadow: false,
          joined_at: shadowMember.joined_at || new Date().toISOString(),
        };

        for (const oldKey of shadowKeysToReplace) {
          delete members[oldKey];
          memberIds = memberIds.filter((id) => id !== oldKey);
        }

        if (!memberIds.includes(uid)) {
          memberIds.push(uid);
        }

        if (!memberEmails.includes(userEmail)) {
          memberEmails.push(userEmail);
        }

        // Migrate expenses referencing old shadow keys
        for (const oldKey of shadowKeysToReplace) {
          try {
            const expQ = query(collection(db, 'expenses'), where('groupId', '==', groupId));
            const expSnap = await getDocs(expQ);
            for (const expDoc of expSnap.docs) {
              const exp = expDoc.data();
              let expModified = false;
              let updatedPaidBy = exp.paidBy || exp.paid_by;
              let updatedPayer = exp.payer;
              let updatedShares = exp.shares ? [...exp.shares] : [];

              if (updatedPaidBy === oldKey) {
                updatedPaidBy = uid;
                updatedPayer = {
                  id: uid,
                  name: user.displayName || shadowMember.name || 'Member',
                  upi_id: shadowMember.upi_id || null,
                };
                expModified = true;
              }

              updatedShares = updatedShares.map((s) => {
                if (s.id === oldKey || s.userId === oldKey) {
                  expModified = true;
                  return { ...s, id: uid, userId: uid };
                }
                return s;
              });

              if (expModified) {
                await updateDoc(doc(db, 'expenses', expDoc.id), {
                  paidBy: updatedPaidBy,
                  paid_by: updatedPaidBy,
                  payer: updatedPayer,
                  shares: updatedShares,
                });
              }
            }
          } catch (e) {
            console.warn('Error migrating expenses for shadow member:', e.message);
          }
        }

        needsUpdate = true;
      } else if (!memberIds.includes(uid)) {
        // User was found by email but was not in memberIds
        memberIds.push(uid);
        if (!members[uid]) {
          members[uid] = {
            id: uid,
            name: user.displayName || userEmail.split('@')[0],
            email: user.email,
            phone: user.phoneNumber || '',
            upi_id: '',
            role: 'member',
            avatar_url: user.photoURL || '',
            isShadow: false,
            joined_at: new Date().toISOString(),
          };
        }
        if (!memberEmails.includes(userEmail)) {
          memberEmails.push(userEmail);
        }
        needsUpdate = true;
      }

      if (needsUpdate) {
        await updateDoc(doc(db, 'groups', groupId), {
          members,
          memberIds,
          memberEmails,
        });
      }
    }
  } catch (err) {
    console.error('Error claiming shadow memberships:', err);
  }
}

// Send notification entry to target email user
async function sendNotificationToUser({ targetEmail, title, body, groupId }) {
  if (!targetEmail) return;
  const emailLower = targetEmail.toLowerCase().trim();
  try {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      id: notifRef.id,
      targetEmail: emailLower,
      title,
      body,
      groupId: groupId || null,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('sendNotificationToUser non-fatal error:', e.message);
  }
}

export const api = {
  currentUserId,
  currentUser,
  ensureUserProfile,
  claimShadowMemberships,

  // ============================================================
  // USER PROFILE
  // ============================================================
  async getProfile(targetUid) {
    const uid = targetUid || (await currentUserId());
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const user = await currentUser();
      return await ensureUserProfile(user);
    }
    return { id: snap.id, ...snap.data() };
  },

  async updateProfile(updates) {
    const uid = await currentUserId();
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    const updatedSnap = await getDoc(userRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
  },

  async logout() {
    await signOut(auth);
  },

  // ============================================================
  // GROUPS
  // ============================================================
  async getGroups() {
    const user = await currentUser();
    const uid = user.uid;
    const userEmail = (user.email || '').toLowerCase().trim();

    if (userEmail) {
      await claimShadowMemberships(user);
    }

    const groupsMap = new Map();

    const q1 = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', uid)
    );
    const snap1 = await getDocs(q1);
    snap1.forEach((docSnap) => {
      const data = docSnap.data();
      const myRole = data.members?.[uid]?.role || 'member';
      groupsMap.set(docSnap.id, {
        id: docSnap.id,
        ...data,
        myRole,
      });
    });

    if (userEmail) {
      try {
        const q2 = query(
          collection(db, 'groups'),
          where('memberEmails', 'array-contains', userEmail)
        );
        const snap2 = await getDocs(q2);
        snap2.forEach((docSnap) => {
          if (!groupsMap.has(docSnap.id)) {
            const data = docSnap.data();
            const myRole = data.members?.[uid]?.role || 'member';
            groupsMap.set(docSnap.id, {
              id: docSnap.id,
              ...data,
              myRole,
            });
          }
        });
      } catch (_) {}
    }

    const groups = Array.from(groupsMap.values());
    groups.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return groups;
  },

  subscribeGroups(callback) {
    let unsubscribeSnapshots = [];
    currentUser()
      .then((user) => {
        const uid = user.uid;
        const userEmail = (user.email || '').toLowerCase().trim();

        if (userEmail) {
          claimShadowMemberships(user).catch(() => {});
        }

        const groupsMap = new Map();

        const emitGroups = () => {
          const groups = Array.from(groupsMap.values());
          groups.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          callback(groups);
        };

        // 1. Subscribe by memberIds
        const q1 = query(
          collection(db, 'groups'),
          where('memberIds', 'array-contains', uid)
        );
        const unsub1 = onSnapshot(q1, (snap) => {
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const myRole = data.members?.[uid]?.role || 'member';
            groupsMap.set(docSnap.id, {
              id: docSnap.id,
              ...data,
              myRole,
            });
          });
          const currentIds = new Set(snap.docs.map((d) => d.id));
          for (const gid of groupsMap.keys()) {
            if (!currentIds.has(gid)) {
              const g = groupsMap.get(gid);
              if (!g?.memberEmails?.includes(userEmail)) {
                groupsMap.delete(gid);
              }
            }
          }
          emitGroups();
        }, (err) => {
          console.error('Groups subscription error (memberIds):', err);
        });
        unsubscribeSnapshots.push(unsub1);

        // 2. Subscribe by memberEmails
        if (userEmail) {
          const q2 = query(
            collection(db, 'groups'),
            where('memberEmails', 'array-contains', userEmail)
          );
          const unsub2 = onSnapshot(q2, (snap) => {
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              const myRole = data.members?.[uid]?.role || 'member';
              groupsMap.set(docSnap.id, {
                id: docSnap.id,
                ...data,
                myRole,
              });
            });
            emitGroups();
          }, (err) => {
            console.error('Groups subscription error (memberEmails):', err);
          });
          unsubscribeSnapshots.push(unsub2);
        }
      })
      .catch(() => {});

    return () => {
      unsubscribeSnapshots.forEach((unsub) => unsub());
    };
  },

  async getGroup(groupId) {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) throw new Error('Group not found');
    return { id: snap.id, ...snap.data() };
  },

  subscribeGroup(groupId, callback) {
    const groupRef = doc(db, 'groups', groupId);
    return onSnapshot(groupRef, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    });
  },

  async createGroup({ name, emoji, icon, groupType, memberEmails = [] }) {
    const user = await currentUser();
    const myProfile = await this.getProfile(user.uid);
    const groupId = doc(collection(db, 'groups')).id;

    const myEmail = (user.email || '').toLowerCase().trim();
    const members = {
      [user.uid]: {
        id: user.uid,
        name: myProfile.name || user.displayName || 'You',
        email: user.email || '',
        phone: myProfile.phone || '',
        upi_id: myProfile.upi_id || '',
        role: 'admin',
        joined_at: new Date().toISOString(),
      },
    };
    const memberIds = [user.uid];
    const normalizedMemberEmails = myEmail ? [myEmail] : [];

    // Add extra participants (shadow members or matched profiles)
    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      for (const input of memberEmails) {
        if (!input || !input.trim()) continue;
        const cleanInput = input.trim();
        const inputLower = cleanInput.toLowerCase();
        const isEmail = cleanInput.includes('@');

        if (isEmail && !normalizedMemberEmails.includes(inputLower)) {
          normalizedMemberEmails.push(inputLower);
        }

        // Look up if an existing user has this email
        let existingUser = null;
        if (isEmail) {
          let uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', inputLower)));
          if (uSnap.empty) {
            uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', cleanInput)));
          }
          if (uSnap.empty) {
            uSnap = await getDocs(query(collection(db, 'users'), where('email_lower', '==', inputLower)));
          }
          if (!uSnap.empty) {
            existingUser = { id: uSnap.docs[0].id, ...uSnap.docs[0].data() };
          }
        }

        if (existingUser && existingUser.id !== user.uid) {
          if (!memberIds.includes(existingUser.id)) {
            memberIds.push(existingUser.id);
            members[existingUser.id] = {
              id: existingUser.id,
              name: existingUser.name || cleanInput.split('@')[0],
              email: existingUser.email || cleanInput,
              phone: existingUser.phone || '',
              upi_id: existingUser.upi_id || '',
              role: 'member',
              isShadow: false,
              joined_at: new Date().toISOString(),
            };
          }
        } else {
          // Offline / shadow member
          const shadowId = `shadow_${doc(collection(db, 'shadow_users')).id}`;
          memberIds.push(shadowId);
          members[shadowId] = {
            id: shadowId,
            name: isEmail ? cleanInput.split('@')[0] : cleanInput,
            email: isEmail ? cleanInput : '',
            role: 'member',
            isShadow: true,
            joined_at: new Date().toISOString(),
          };
        }
      }
    }

    const groupData = {
      name,
      emoji: emoji || icon || '🧾',
      icon: icon || emoji || '🧾',
      groupType: groupType || 'other',
      created_by: user.uid,
      created_at: new Date().toISOString(),
      memberIds,
      memberEmails: normalizedMemberEmails,
      members,
    };

    await setDoc(doc(db, 'groups', groupId), groupData);

    // Trigger notification to invited members
    for (const email of normalizedMemberEmails) {
      if (email !== myEmail) {
        sendNotificationToUser({
          targetEmail: email,
          title: 'New Group Invite 🎉',
          body: `${myProfile.name || user.displayName || 'A friend'} added you to "${name}"`,
          groupId,
        });
      }
    }

    return { id: groupId, ...groupData };
  },

  async addShadowMember(groupId, input) {
    if (!input || !input.trim()) return;
    const cleanInput = input.trim();
    const inputLower = cleanInput.toLowerCase();
    const isEmail = cleanInput.includes('@');

    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error('Group not found');
    const group = groupSnap.data();

    // Check if an existing registered user matches
    let memberId = null;
    let memberData = null;

    if (isEmail) {
      let uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', inputLower)));
      if (uSnap.empty) {
        uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', cleanInput)));
      }
      if (uSnap.empty) {
        uSnap = await getDocs(query(collection(db, 'users'), where('email_lower', '==', inputLower)));
      }
      if (!uSnap.empty) {
        const u = { id: uSnap.docs[0].id, ...uSnap.docs[0].data() };
        memberId = u.id;
        memberData = {
          id: u.id,
          name: u.name || cleanInput.split('@')[0],
          email: u.email || cleanInput,
          phone: u.phone || '',
          upi_id: u.upi_id || '',
          role: 'member',
          isShadow: false,
          joined_at: new Date().toISOString(),
        };
      }
    }

    if (!memberId) {
      memberId = `shadow_${doc(collection(db, 'shadow_users')).id}`;
      memberData = {
        id: memberId,
        name: isEmail ? cleanInput.split('@')[0] : cleanInput,
        email: isEmail ? cleanInput : '',
        role: 'member',
        isShadow: true,
        joined_at: new Date().toISOString(),
      };
    }

    const updatedMembers = { ...(group.members || {}), [memberId]: memberData };
    const updatedMemberIds = Array.from(new Set([...(group.memberIds || []), memberId]));
    const updatedMemberEmails = Array.from(
      new Set([
        ...(group.memberEmails || []).map((e) => (typeof e === 'string' ? e.toLowerCase().trim() : '')),
        isEmail ? inputLower : '',
      ].filter(Boolean))
    );

    await updateDoc(groupRef, {
      members: updatedMembers,
      memberIds: updatedMemberIds,
      memberEmails: updatedMemberEmails,
    });

    if (isEmail) {
      sendNotificationToUser({
        targetEmail: inputLower,
        title: 'Added to Group 🎉',
        body: `You were added to group "${group.name || 'Ledger'}"`,
        groupId,
      });
    }

    return true;
  },

  async removeMember(groupId, memberIdToRemove) {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) throw new Error('Group not found');
    const group = snap.data();

    const members = { ...(group.members || {}) };
    const removedMember = members[memberIdToRemove];
    delete members[memberIdToRemove];
    const memberIds = (group.memberIds || []).filter((id) => id !== memberIdToRemove);
    const removedEmail = (removedMember?.email || '').toLowerCase().trim();
    const memberEmails = (group.memberEmails || []).filter(
      (e) => !removedEmail || e.toLowerCase().trim() !== removedEmail
    );

    await updateDoc(groupRef, {
      members,
      memberIds,
      memberEmails,
    });
    return true;
  },

  async deleteGroup(groupId) {
    // Delete group document
    await deleteDoc(doc(db, 'groups', groupId));

    // Delete associated expenses
    const expQ = query(collection(db, 'expenses'), where('groupId', '==', groupId));
    const expSnap = await getDocs(expQ);
    const delPromises = [];
    expSnap.forEach((d) => delPromises.push(deleteDoc(d.ref)));

    // Delete associated settlements
    const setQ = query(collection(db, 'settlements'), where('groupId', '==', groupId));
    const setSnap = await getDocs(setQ);
    setSnap.forEach((d) => delPromises.push(deleteDoc(d.ref)));

    await Promise.all(delPromises);
    return true;
  },

  async leaveGroup(groupId) {
    const uid = await currentUserId();
    return this.removeMember(groupId, uid);
  },

  async getMembers(groupId) {
    const group = await this.getGroup(groupId);
    const membersMap = group.members || {};
    return Object.values(membersMap);
  },

  async getUserRole(groupId) {
    const uid = await currentUserId();
    const group = await this.getGroup(groupId);
    return group.members?.[uid]?.role || null;
  },

  // ============================================================
  // EXPENSES
  // ============================================================
  async getExpenses(groupId) {
    const q = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId)
    );
    const snap = await getDocs(q);
    const expenses = [];
    snap.forEach((d) => {
      expenses.push({ id: d.id, ...d.data() });
    });
    // Sort descending by created_at
    expenses.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return expenses;
  },

  subscribeExpenses(groupId, callback) {
    const q = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId)
    );
    return onSnapshot(q, (snap) => {
      const expenses = [];
      snap.forEach((d) => {
        expenses.push({ id: d.id, ...d.data() });
      });
      expenses.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      callback(expenses);
    });
  },

  async addExpense({ groupId, description, amount, paidBy, splitType, shares, memberIds }) {
    const group = await this.getGroup(groupId);
    const payerMember = group.members?.[paidBy] || { id: paidBy, name: 'Member' };

    let computedShares = [];
    if (splitType === 'custom') {
      if (!Array.isArray(shares) || !shares.length) {
        throw new Error('Custom split requires at least one share');
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
        throw new Error('Equal split requires at least one member');
      }
      const equalShare = Math.floor((Number(amount) / memberIds.length) * 100) / 100;
      const remainder = Number((Number(amount) - equalShare * memberIds.length).toFixed(2));
      const remainderTargetId = memberIds.includes(paidBy) ? paidBy : memberIds[0];
      computedShares = memberIds.map((userId) => ({
        user_id: userId,
        share_amount: userId === remainderTargetId ? Number((equalShare + remainder).toFixed(2)) : equalShare,
      }));
    }

    const expenseId = doc(collection(db, 'expenses')).id;
    const expenseData = {
      groupId,
      description,
      amount: Number(amount),
      paid_by: paidBy,
      paidBy,
      split_type: splitType || 'equal',
      splitType: splitType || 'equal',
      expense_shares: computedShares,
      shares: computedShares,
      payer: {
        id: payerMember.id || paidBy,
        name: payerMember.name || 'Member',
        upi_id: payerMember.upi_id || null,
      },
      created_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'expenses', expenseId), expenseData);
    return { id: expenseId, ...expenseData };
  },

  async updateExpense(expenseId, { groupId, description, amount, paidBy, splitType, shares, memberIds }) {
    const group = await this.getGroup(groupId);
    const payerMember = group.members?.[paidBy] || { id: paidBy, name: 'Member' };

    let computedShares = [];
    if (splitType === 'custom') {
      if (!Array.isArray(shares) || !shares.length) {
        throw new Error('Custom split requires at least one share');
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
        throw new Error('Equal split requires at least one member');
      }
      const equalShare = Math.floor((Number(amount) / memberIds.length) * 100) / 100;
      const remainder = Number((Number(amount) - equalShare * memberIds.length).toFixed(2));
      const remainderTargetId = memberIds.includes(paidBy) ? paidBy : memberIds[0];
      computedShares = memberIds.map((userId) => ({
        user_id: userId,
        share_amount: userId === remainderTargetId ? Number((equalShare + remainder).toFixed(2)) : equalShare,
      }));
    }

    const updates = {
      description,
      amount: Number(amount),
      paid_by: paidBy,
      paidBy,
      split_type: splitType || 'equal',
      splitType: splitType || 'equal',
      expense_shares: computedShares,
      shares: computedShares,
      payer: {
        id: payerMember.id || paidBy,
        name: payerMember.name || 'Member',
        upi_id: payerMember.upi_id || null,
      },
      updated_at: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'expenses', expenseId), updates);
    const updatedSnap = await getDoc(doc(db, 'expenses', expenseId));
    return { id: updatedSnap.id, ...updatedSnap.data() };
  },

  async updateExpensePayer(expenseId, newPayerId) {
    const expenseRef = doc(db, 'expenses', expenseId);
    const snap = await getDoc(expenseRef);
    if (!snap.exists()) throw new Error('Expense not found');
    const exp = snap.data();

    const group = await this.getGroup(exp.groupId);
    const payerMember = group.members?.[newPayerId] || { id: newPayerId, name: 'Member' };

    await updateDoc(expenseRef, {
      paid_by: newPayerId,
      paidBy: newPayerId,
      payer: {
        id: payerMember.id || newPayerId,
        name: payerMember.name || 'Member',
        upi_id: payerMember.upi_id || null,
      },
      updated_at: new Date().toISOString(),
    });
    return true;
  },

  async deleteExpense(expenseId) {
    await deleteDoc(doc(db, 'expenses', expenseId));
    return true;
  },

  // ============================================================
  // BALANCES & SETTLEMENTS
  // ============================================================
  async getBalances(groupId) {
    const [group, expenses, setSnap] = await Promise.all([
      this.getGroup(groupId),
      this.getExpenses(groupId),
      getDocs(query(collection(db, 'settlements'), where('groupId', '==', groupId))),
    ]);

    const settlements = [];
    setSnap.forEach((d) => settlements.push({ id: d.id, ...d.data() }));

    const members = Object.values(group.members || {});
    const knownMembers = [...members];
    const memberIds = new Set(knownMembers.map((m) => m.id));

    expenses.forEach((e) => {
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

    return computeBalances(knownMembers, expenses, settlements);
  },

  subscribeSettlements(groupId, callback) {
    const q = query(collection(db, 'settlements'), where('groupId', '==', groupId));
    return onSnapshot(q, (snap) => {
      const settlements = [];
      snap.forEach((d) => settlements.push({ id: d.id, ...d.data() }));
      callback(settlements);
    });
  },

  async addSettlement({ groupId, fromUser, toUser, amount }) {
    const settlementId = doc(collection(db, 'settlements')).id;
    const settlementData = {
      groupId,
      from_user: fromUser,
      fromUser,
      to_user: toUser,
      toUser,
      amount: Number(amount),
      created_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'settlements', settlementId), settlementData);
    return { id: settlementId, ...settlementData };
  },

  async getWhatsappText(groupId) {
    const [group, { moves }] = await Promise.all([
      this.getGroup(groupId),
      this.getBalances(groupId),
    ]);
    return { text: buildWhatsappText(group, moves) };
  },

  // ============================================================
  // ACTIVITY & HISTORY
  // ============================================================
  async getAllHistory() {
    const groups = await this.getGroups();
    const groupMap = {};
    groups.forEach((g) => {
      groupMap[g.id] = g;
    });

    const groupIds = Object.keys(groupMap);
    if (groupIds.length === 0) return [];

    // Firestore allows 'in' queries up to 30 elements
    const batches = [];
    for (let i = 0; i < groupIds.length; i += 30) {
      batches.push(groupIds.slice(i, i + 30));
    }

    const allExpenses = [];
    for (const batch of batches) {
      const q = query(collection(db, 'expenses'), where('groupId', 'in', batch));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const exp = { id: d.id, ...d.data() };
        exp.group = {
          name: groupMap[exp.groupId]?.name || 'Group',
          emoji: groupMap[exp.groupId]?.emoji || '🧾',
        };
        allExpenses.push(exp);
      });
    }

    allExpenses.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return allExpenses;
  },

  // ============================================================
  // INVITES & JOINING
  // ============================================================
  async getInviteInfo(groupId) {
    const uid = await currentUserId();
    const group = await this.getGroup(groupId);
    const members = Object.values(group.members || {});
    const creator = group.members?.[group.created_by] || { name: 'Admin' };

    return {
      valid: true,
      groupId: group.id,
      groupName: group.name,
      groupEmoji: group.emoji,
      invitedBy: creator.name || 'Admin',
      memberCount: members.length,
      isAlreadyMember: (group.memberIds || []).includes(uid),
    };
  },

  async joinGroupByCode(groupId) {
    const user = await currentUser();
    const profile = await this.getProfile(user.uid);
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) throw new Error('Invite link is invalid or expired.');

    const group = snap.data();
    if ((group.memberIds || []).includes(user.uid)) {
      return { group: { id: snap.id, ...group }, alreadyMember: true };
    }

    const updatedMembers = {
      ...(group.members || {}),
      [user.uid]: {
        id: user.uid,
        name: profile.name || user.displayName || 'Member',
        email: user.email || '',
        phone: profile.phone || '',
        upi_id: profile.upi_id || '',
        role: 'member',
        joined_at: new Date().toISOString(),
      },
    };
    const updatedMemberIds = [...(group.memberIds || []), user.uid];

    await updateDoc(groupRef, {
      members: updatedMembers,
      memberIds: updatedMemberIds,
    });

    return { group: { id: snap.id, ...group }, alreadyMember: false };
  },
};

export default api;
