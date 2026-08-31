'use client';

import { useState } from 'react';
import { api } from '../archive/deprecated-utils/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function BalanceBoard({ groupId, balances, moves, currentUserId, totalExpenses, onSettled }) {
  const [settling, setSettling] = useState(null); // move index currently being settled
  
  const [showSummary, setShowSummary] = useState(true);
  const [showSettle, setShowSettle] = useState(true);

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
    <div className="flex flex-col gap-4 p-4">
      {/* Total Expenses Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-end">
        <p className="text-[15px]">
          <span className="font-semibold text-gray-500 uppercase tracking-widest text-[11px] mr-2">Expenses:</span>
          <span className="font-bold text-[#145C4B] text-xl">{Number(totalExpenses || 0).toFixed(2)} INR</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1 font-medium">
          Created {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <button 
          onClick={() => setShowSummary(!showSummary)}
          className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-bold text-gray-900 text-[15px]">Summary</h3>
          {showSummary ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>
        
        {showSummary && (
          <div className="flex flex-col">
            {balances.map((b, idx) => (
              <div key={b.id} className={`px-4 py-3 flex justify-between items-start ${idx !== balances.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex flex-col">
                  <span className="text-gray-800 text-[15px]">{b.name}</span>
                  <span className="text-gray-400 text-[12px] mt-0.5">
                    Charged {(b.charged || 0).toFixed(2)}, Paid {(b.paid || 0).toFixed(2)}
                  </span>
                </div>
                <span className={`font-semibold text-[15px] ${b.amount > 0 ? 'text-[#145C4B]' : b.amount < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                  {b.amount > 0 ? '+' : ''}{b.amount.toFixed(2)} INR
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to settle Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <button 
          onClick={() => setShowSettle(!showSettle)}
          className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-bold text-gray-900 text-[15px]">How to settle?</h3>
          {showSettle ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {showSettle && (
          <div className="flex flex-col">
            {moves.length === 0 ? (
              <p className="px-4 py-6 text-gray-500 text-sm text-center">No settlements needed right now.</p>
            ) : (
              moves.map((move, idx) => (
                <div key={idx} className={`px-4 py-3 flex justify-between items-center ${idx !== moves.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex flex-col cursor-pointer" onClick={() => markSettled(move, idx)}>
                    <span className="text-gray-800 font-semibold text-[15px]">{move.fromName}</span>
                    <span className="text-gray-400 text-[12px] mt-0.5">should pay to <span className="font-bold text-gray-700">{move.toName}</span></span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#145C4B] font-bold text-[15px]">{move.amount.toFixed(2)} INR</span>
                    <button
                      onClick={() => markSettled(move, idx)}
                      disabled={settling === idx}
                      className="text-[10px] font-bold uppercase tracking-widest bg-[#e6f4ed] text-[#145C4B] rounded-full px-3 py-1.5 hover:bg-[#d3ebd9] disabled:opacity-60 transition-colors"
                    >
                      {settling === idx ? 'Marking…' : 'Settle'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
