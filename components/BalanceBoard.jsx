'use client';

import { useState } from 'react';
import { api } from '../archive/deprecated-utils/api';
import { ChevronDown } from 'lucide-react';

export default function BalanceBoard({ groupId, balances, moves, currentUserId, onSettled }) {
  const [settling, setSettling] = useState(null); // move index currently being settled
  const [showMore, setShowMore] = useState(false);

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
      <div className="p-6 pb-4">
        <h3 className="font-bold text-lg text-gray-900 mb-6">Who owes whom</h3>

        {moves.length === 0 ? (
          <p className="text-gray-500 text-sm font-medium">Sab clear hai — no one owes anything right now. 🎉</p>
        ) : (
          <div className="space-y-4">
            {moves.map((move, idx) => (
              <div key={`${move.from}-${move.to}-${idx}`} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    {move.fromName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-800">{move.fromName}</span>
                    <span className="text-gray-400 mx-1">owes</span>
                    <span className="font-semibold text-gray-800 uppercase">{move.toName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-red-500">₹{move.amount.toFixed(2)}</span>
                  <button
                    onClick={() => markSettled(move, idx)}
                    disabled={settling === idx}
                    className="text-xs font-semibold bg-soft-green text-primary rounded-full px-4 py-1.5 hover:bg-soft-green/80 disabled:opacity-60 transition-colors"
                  >
                    {settling === idx ? 'Marking…' : 'Mark paid'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-6 py-3">
        <button 
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronDown size={16} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          Show more balances
        </button>

        {showMore && (
          <ul className="mt-4 pb-3 space-y-2 text-sm">
            {balances.map((b) => (
              <li key={b.id} className={`flex justify-between items-center ${b.amount < 0 ? 'text-red-500' : b.amount > 0 ? 'text-primary' : 'text-gray-500'}`}>
                <span className="font-medium text-gray-700">{b.name} {b.id === currentUserId ? <span className="text-gray-400 font-normal">(you)</span> : ''}</span>
                <span className="font-semibold">{b.amount > 0 ? '+' : ''}₹{b.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
