// Same math the old Express backend used — now runs client-side since Supabase
// (with RLS) is the only backend. Takes plain data already fetched from Supabase.

export function computeBalances(members, expenses, settlements) {
  const names = {};
  const net = {};

  const paid = {};
  const charged = {};

  (members || []).forEach((m) => {
    if (!m) return;
    names[m.id] = m;
    net[m.id] = 0;
    paid[m.id] = 0;
    charged[m.id] = 0;
  });

  // Whoever paid gets credited the full amount; everyone with a share is debited theirs.
  (expenses || []).forEach((e) => {
    const shareTotal = (e.expense_shares || []).reduce((s, x) => s + Number(x.share_amount), 0);
    net[e.paid_by] = (net[e.paid_by] || 0) + shareTotal;
    paid[e.paid_by] = (paid[e.paid_by] || 0) + shareTotal;
    (e.expense_shares || []).forEach((s) => {
      net[s.user_id] = (net[s.user_id] || 0) - Number(s.share_amount);
      charged[s.user_id] = (charged[s.user_id] || 0) + Number(s.share_amount);
    });
  });

  // Past settlements move money from payer to receiver directly.
  (settlements || []).forEach((s) => {
    net[s.from_user] = (net[s.from_user] || 0) + Number(s.amount);
    net[s.to_user] = (net[s.to_user] || 0) - Number(s.amount);
    paid[s.from_user] = (paid[s.from_user] || 0) + Number(s.amount); // giving money to someone is like paying an expense for them
    charged[s.to_user] = (charged[s.to_user] || 0) + Number(s.amount); // receiving money is like being charged
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
      fromName: names[debtors[i].id]?.name || 'Someone',
      to: creditors[j].id,
      toName: names[creditors[j].id]?.name || 'Someone',
      toUpiId: names[creditors[j].id]?.upi_id || null,
      amount: Number(pay.toFixed(2)),
    });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return {
    balances: Object.entries(net).map(([id, amount]) => ({
      id,
      name: names[id]?.name || 'Someone',
      amount: Number(amount.toFixed(2)),
      paid: Number((paid[id] || 0).toFixed(2)),
      charged: Number((charged[id] || 0).toFixed(2)),
    })),
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
