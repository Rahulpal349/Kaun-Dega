// Same math the old Express backend used — now runs client-side since Supabase
// (with RLS) is the only backend. Takes plain data already fetched from Supabase.

export function computeBalances(members, expenses, settlements) {
  const names = {};
  const net = {};

  const paid = {};
  const charged = {};
  const settledPaid = {};
  const settledReceived = {};

  const memberIdSet = new Set();
  (members || []).forEach((m) => {
    if (!m || !m.id) return;
    memberIdSet.add(m.id);
    names[m.id] = m;
    net[m.id] = 0;
    paid[m.id] = 0;
    charged[m.id] = 0;
    settledPaid[m.id] = 0;
    settledReceived[m.id] = 0;
  });

  // Whoever paid for an expense gets credited; everyone with a share is debited theirs.
  // "Paid" and "Charged" track pure group expenses.
  (expenses || []).forEach((e) => {
    const shareTotal = (e.expense_shares || []).reduce((s, x) => s + Number(x.share_amount || 0), 0);
    const paidBy = e.paid_by;
    if (paidBy) {
      net[paidBy] = (net[paidBy] || 0) + shareTotal;
      paid[paidBy] = (paid[paidBy] || 0) + shareTotal;
    }
    (e.expense_shares || []).forEach((s) => {
      const uId = s.user_id;
      if (uId) {
        const shareAmt = Number(s.share_amount || 0);
        net[uId] = (net[uId] || 0) - shareAmt;
        charged[uId] = (charged[uId] || 0) + shareAmt;
      }
    });
  });

  // Past settlements move money from debtor (from_user) to creditor (to_user) directly.
  // Settlements settle debts — they do NOT inflate expense consumption (charged) or expense payments (paid).
  (settlements || []).forEach((s) => {
    const amt = Number(s.amount || 0);
    if (amt <= 0) return;
    if (s.from_user) {
      net[s.from_user] = (net[s.from_user] || 0) + amt;
      settledPaid[s.from_user] = (settledPaid[s.from_user] || 0) + amt;
    }
    if (s.to_user) {
      net[s.to_user] = (net[s.to_user] || 0) - amt;
      settledReceived[s.to_user] = (settledReceived[s.to_user] || 0) + amt;
    }
  });

  // Debt simplification: greedily match biggest creditor with biggest debtor,
  // so instead of everyone owing everyone, you get the minimum number of payments.
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.01)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.01)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);

  const moves = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    moves.push({
      from: debtors[i].id,
      fromName: names[debtors[i].id]?.name || 'Former Member',
      to: creditors[j].id,
      toName: names[creditors[j].id]?.name || 'Former Member',
      toUpiId: names[creditors[j].id]?.upi_id || null,
      amount: Number(pay.toFixed(2)),
    });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  // Ensure all current group members are included in balances.
  // Non-members (former participants) are only included if they have an active unsettled balance.
  const allIds = [
    ...(members || []).map((m) => m?.id).filter(Boolean),
    ...Object.keys(net).filter((id) => !memberIdSet.has(id)),
  ];

  const balances = [];
  for (const id of allIds) {
    const isMember = memberIdSet.has(id);
    const amount = Number((net[id] || 0).toFixed(2));
    // Skip former members who are already settled up (0 balance)
    if (!isMember && Math.abs(amount) < 0.01) continue;

    balances.push({
      id,
      name: names[id]?.name || 'Former Member',
      amount,
      paid: Number((paid[id] || 0).toFixed(2)),
      charged: Number((charged[id] || 0).toFixed(2)),
      settledPaid: Number((settledPaid[id] || 0).toFixed(2)),
      settledReceived: Number((settledReceived[id] || 0).toFixed(2)),
    });
  }

  return {
    balances,
    moves,
  };
}

export function buildWhatsappText(group, moves) {
  const emoji = group?.emoji || '🧾';
  const name = group?.name || 'Kaun Dega?';

  if (!moves.length) {
    return `${emoji} ${name} — sab clear hai! No one needs to pay anything. 🎉`;
  }

  const lines = moves.map((m) => `• ${m.fromName} to pay ${m.toName} ₹${m.amount.toFixed(2)}`);
  return [`${emoji} *${name}* — hisaab kitab:`, ...lines, '', 'Settle up on Kaun Dega? 👉'].join('\n');
}
