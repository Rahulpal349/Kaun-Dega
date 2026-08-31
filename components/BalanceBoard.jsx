'use client';

import { useState } from 'react';
import { api } from '../archive/deprecated-utils/api';
import Chit from './Chit';

export default function BalanceBoard({ groupId, balances, moves, currentUserId, onSettled }) {
  const [settling, setSettling] = useState(null); // move index currently being settled

  async function markSettled(move, idx) {
    setSettling(idx);
    try {
      await api.addSettlement({
        groupId,
        fromUser: move.from,
        toUser: move.to,
        amount: move.amount,
      });
      onSettled?.();
    } finally {
      setSettling(null);
    }
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg text-ink">Who owes whom</h3>
      </div>

      {moves.length === 0 ? (
        <Chit>
          <p className="text-ink/70 font-body">Sab clear hai — no one owes anything right now. 🎉</p>
        </Chit>
      ) : (
        moves.map((move, idx) => (
          <Chit key={`${move.from}-${move.to}-${idx}`} className="flex items-center justify-between">
            <div>
              <span className="font-medium text-ink">{move.fromName}</span>
              <span className="text-ink/50"> owes </span>
              <span className="font-medium text-ink">{move.toName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-semibold text-chili">₹{move.amount.toFixed(2)}</span>
              <button
                onClick={() => markSettled(move, idx)}
                disabled={settling === idx}
                className="text-xs font-medium bg-sage text-ink rounded-full px-2.5 py-1 hover:brightness-95 disabled:opacity-60"
              >
                {settling === idx ? 'Marking…' : 'Mark paid'}
              </button>
            </div>
          </Chit>
        ))
      )}

      <details className="mt-4 text-sm text-ink/60">
        <summary className="cursor-pointer">Show raw balances</summary>
        <ul className="mt-2 space-y-1 font-mono">
          {balances.map((b) => (
            <li key={b.id} className={b.amount < 0 ? 'text-chili' : b.amount > 0 ? 'text-teal' : ''}>
              {b.name}: {b.amount > 0 ? '+' : ''}₹{b.amount.toFixed(2)} {b.id === currentUserId ? '(you)' : ''}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
