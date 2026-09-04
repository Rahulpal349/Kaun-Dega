import { describe, it, expect } from 'vitest';
import { computeBalances, buildWhatsappText } from '../lib/balances';

describe('computeBalances Debt Simplification & Balance Math', () => {
  it('calculates equal split accurately among 3 members', () => {
    const members = [
      { id: 'u1', name: 'Alice', upi_id: 'alice@upi' },
      { id: 'u2', name: 'Bob', upi_id: 'bob@upi' },
      { id: 'u3', name: 'Charlie', upi_id: 'charlie@upi' },
    ];

    const expenses = [
      {
        id: 'e1',
        description: 'Dinner Party',
        paid_by: 'u1',
        expense_shares: [
          { user_id: 'u1', share_amount: 100 },
          { user_id: 'u2', share_amount: 100 },
          { user_id: 'u3', share_amount: 100 },
        ],
      },
    ];

    const { balances, moves } = computeBalances(members, expenses, []);

    const balAlice = balances.find((b) => b.id === 'u1');
    const balBob = balances.find((b) => b.id === 'u2');
    const balCharlie = balances.find((b) => b.id === 'u3');

    expect(balAlice.amount).toBe(200);
    expect(balBob.amount).toBe(-100);
    expect(balCharlie.amount).toBe(-100);

    expect(moves).toHaveLength(2);
    expect(moves.every((m) => m.to === 'u1' && m.amount === 100)).toBe(true);
    expect(moves.find((m) => m.from === 'u2')?.toUpiId).toBe('alice@upi');
  });

  it('handles custom splits with uneven participant shares', () => {
    const members = [
      { id: 'u1', name: 'Rahul' },
      { id: 'u2', name: 'Priya' },
      { id: 'u3', name: 'Amit' },
    ];

    const expenses = [
      {
        id: 'e1',
        paidBy: 'u2', // Priya pays 600
        shares: [
          { userId: 'u1', amount: 300 },
          { userId: 'u2', amount: 100 },
          { userId: 'u3', amount: 200 },
        ],
      },
    ];

    const { balances, moves } = computeBalances(members, expenses, []);

    const rahul = balances.find((b) => b.id === 'u1');
    const priya = balances.find((b) => b.id === 'u2');
    const amit = balances.find((b) => b.id === 'u3');

    expect(priya.amount).toBe(500); // 600 - 100
    expect(rahul.amount).toBe(-300);
    expect(amit.amount).toBe(-200);

    expect(moves).toHaveLength(2);
    expect(moves.find((m) => m.from === 'u1')?.amount).toBe(300);
    expect(moves.find((m) => m.from === 'u3')?.amount).toBe(200);
  });

  it('guarantees zero-sum balance conservation across complex multi-payer expenses', () => {
    const members = [
      { id: 'u1', name: 'M1' },
      { id: 'u2', name: 'M2' },
      { id: 'u3', name: 'M3' },
      { id: 'u4', name: 'M4' },
    ];

    const expenses = [
      {
        paid_by: 'u1',
        expense_shares: [
          { user_id: 'u1', share_amount: 50 },
          { user_id: 'u2', share_amount: 50 },
          { user_id: 'u3', share_amount: 50 },
          { user_id: 'u4', share_amount: 50 },
        ],
      },
      {
        paid_by: 'u3',
        expense_shares: [
          { user_id: 'u2', share_amount: 150 },
          { user_id: 'u3', share_amount: 50 },
        ],
      },
    ];

    const { balances, moves } = computeBalances(members, expenses, []);

    const netSum = balances.reduce((acc, b) => acc + b.amount, 0);
    expect(Math.abs(netSum)).toBeLessThan(0.01);

    // Verify greedy algorithm settles all debts
    const totalSettledByMoves = moves.reduce((acc, m) => acc + m.amount, 0);
    const totalPositiveNet = balances.filter((b) => b.amount > 0).reduce((acc, b) => acc + b.amount, 0);
    expect(totalSettledByMoves).toBeCloseTo(totalPositiveNet, 2);
  });

  it('correctly accounts for prior settlements between members', () => {
    const members = [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
    ];

    const expenses = [
      {
        paid_by: 'u1',
        expense_shares: [
          { user_id: 'u1', share_amount: 100 },
          { user_id: 'u2', share_amount: 100 },
        ],
      },
    ];

    const settlements = [
      {
        from_user: 'u2',
        to_user: 'u1',
        amount: 100,
      },
    ];

    const { balances, moves } = computeBalances(members, expenses, settlements);

    expect(balances.find((b) => b.id === 'u1')?.amount).toBe(0);
    expect(balances.find((b) => b.id === 'u2')?.amount).toBe(0);
    expect(moves).toHaveLength(0);
  });

  it('handles empty group and null parameters safely without errors', () => {
    const result1 = computeBalances([], [], []);
    expect(result1.balances).toEqual([]);
    expect(result1.moves).toEqual([]);

    const result2 = computeBalances(null, null, null);
    expect(result2.balances).toEqual([]);
    expect(result2.moves).toEqual([]);
  });
});

describe('buildWhatsappText', () => {
  it('returns clean confirmation message when everyone is settled', () => {
    const text = buildWhatsappText({ name: 'Goa Trip' }, []);
    expect(text).toContain('Goa Trip');
    expect(text).toContain('Sab clear hai!');
  });

  it('formats settlement bullet points and amounts accurately', () => {
    const moves = [
      { fromName: 'Bob', toName: 'Alice', amount: 250.5 },
      { fromName: 'Charlie', toName: 'Alice', amount: 120.0 },
    ];
    const text = buildWhatsappText({ name: 'Manali 2026' }, moves);

    expect(text).toContain('*Manali 2026* — Hisaab Kitab:');
    expect(text).toContain('• Bob to pay Alice ₹250.50');
    expect(text).toContain('• Charlie to pay Alice ₹120.00');
    expect(text).toContain('Settle up on Kaun Dega:');
  });
});
