// Deterministic client-side debt simplification and balance math
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
  (expenses || []).forEach((e) => {
    const shares = e.expense_shares || e.shares || [];
    const shareTotal = shares.reduce((s, x) => s + Number(x.share_amount || x.amount || 0), 0);
    const paidBy = e.paid_by || e.paidBy;
    if (paidBy) {
      net[paidBy] = (net[paidBy] || 0) + shareTotal;
      paid[paidBy] = (paid[paidBy] || 0) + shareTotal;
    }
    shares.forEach((s) => {
      const uId = s.user_id || s.userId;
      if (uId) {
        const shareAmt = Number(s.share_amount || s.amount || 0);
        net[uId] = (net[uId] || 0) - shareAmt;
        charged[uId] = (charged[uId] || 0) + shareAmt;
      }
    });
  });

  // Past settlements move money from debtor (from_user) to creditor (to_user) directly.
  (settlements || []).forEach((s) => {
    const amt = Number(s.amount || 0);
    if (amt <= 0) return;
    const from = s.from_user || s.fromUser;
    const to = s.to_user || s.toUser;
    if (from) {
      net[from] = (net[from] || 0) + amt;
      settledPaid[from] = (settledPaid[from] || 0) + amt;
    }
    if (to) {
      net[to] = (net[to] || 0) - amt;
      settledReceived[to] = (settledReceived[to] || 0) + amt;
    }
  });

  // Debt simplification: greedily match biggest creditor with biggest debtor
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

  const allIds = [
    ...(members || []).map((m) => m?.id).filter(Boolean),
    ...Object.keys(net).filter((id) => !memberIdSet.has(id)),
  ];

  const balances = [];
  for (const id of allIds) {
    const isMember = memberIdSet.has(id);
    const amount = Number((net[id] || 0).toFixed(2));
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
  const name = group?.name || 'Kaun Dega?';

  if (!moves || !moves.length) {
    return `*${name}* — Sab clear hai! No one needs to pay anything.`;
  }

  const lines = moves.map((m) => `• ${m.fromName} to pay ${m.toName} ₹${m.amount.toFixed(2)}`);
  return [`*${name}* — Hisaab Kitab:`, ...lines, '', 'Settle up on Kaun Dega:'].join('\n');
}
