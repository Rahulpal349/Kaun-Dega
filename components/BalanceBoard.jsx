'use client';

import { useState } from 'react';
import { api } from '../lib/firebaseApi';
import { ChevronDown, ChevronUp, X, Copy, Check, IndianRupee, ArrowRight } from 'lucide-react';

export default function BalanceBoard({ groupId, balances, moves, currentUserId, totalExpenses, onSettled }) {
  const [settling, setSettling] = useState(null);
  const [showSummary, setShowSummary] = useState(true);
  const [showSettle, setShowSettle] = useState(true);

  // Confirmation modal state
  const [confirmMove, setConfirmMove] = useState(null); // the move object to confirm
  const [confirmIdx, setConfirmIdx] = useState(null);
  const [upiCopied, setUpiCopied] = useState(false);

  function openConfirmModal(move, idx) {
    setConfirmMove(move);
    setConfirmIdx(idx);
    setUpiCopied(false);
  }

  function closeConfirmModal() {
    setConfirmMove(null);
    setConfirmIdx(null);
    setUpiCopied(false);
  }

  async function copyUpiId(upiId) {
    try {
      await navigator.clipboard.writeText(upiId);
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2000);
    } catch (err) {
      prompt('Copy this UPI ID:', upiId);
    }
  }

  async function confirmSettlement() {
    if (!confirmMove) return;
    setSettling(confirmIdx);
    try {
      await api.addSettlement({
        groupId,
        fromUser: confirmMove.from,
        toUser: confirmMove.to,
        amount: confirmMove.amount,
      });
      closeConfirmModal();
      onSettled?.();
    } catch (err) {
      alert('Failed to record settlement: ' + err.message);
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
                    {b.settledPaid > 0 ? ` · Settled ₹${b.settledPaid.toFixed(2)}` : ''}
                    {b.settledReceived > 0 ? ` · Received ₹${b.settledReceived.toFixed(2)}` : ''}
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
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-semibold text-[15px]">{move.fromName}</span>
                    <span className="text-gray-400 text-[12px] mt-0.5">should pay to <span className="font-bold text-gray-700">{move.toName}</span></span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#145C4B] font-bold text-[15px]">{move.amount.toFixed(2)} INR</span>
                    <button
                      onClick={() => openConfirmModal(move, idx)}
                      className="text-[10px] font-bold uppercase tracking-widest bg-[#e6f4ed] text-[#145C4B] rounded-full px-3 py-1.5 hover:bg-[#d3ebd9] transition-colors"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Settlement Confirmation Modal */}
      {confirmMove && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[70]" onClick={closeConfirmModal} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm bg-white rounded-2xl shadow-2xl z-[80] overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-900">Confirm Settlement</h3>
                <button onClick={closeConfirmModal} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Payment Visual */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-5 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-bold text-[#145C4B] mb-1.5 border border-green-100">
                      {confirmMove.fromName?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{confirmMove.fromName}</span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <ArrowRight size={20} className="text-[#145C4B] mb-1" />
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">pays</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-bold text-[#145C4B] mb-1.5 border border-green-100">
                      {confirmMove.toName?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{confirmMove.toName}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#145C4B] tracking-tight">
                    <span className="text-lg mr-0.5">₹</span>{confirmMove.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* UPI ID copy section */}
              {confirmMove.toUpiId && (
                <div className="mb-5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pay via UPI</p>
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 border border-gray-100">
                    <span className="text-sm text-gray-700 flex-1 font-mono truncate">{confirmMove.toUpiId}</span>
                    <button
                      onClick={() => copyUpiId(confirmMove.toUpiId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        upiCopied 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {upiCopied ? <Check size={14} /> : <Copy size={14} />}
                      {upiCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Info text */}
              <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
                {confirmMove.toUpiId
                  ? 'Pay using any UPI app (GPay, PhonePe, Paytm etc.) and then confirm below.'
                  : 'Pay the above amount offline or via any method, then confirm below to record the settlement.'
                }
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmSettlement}
                  disabled={settling === confirmIdx}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#145C4B] text-white font-bold text-sm hover:bg-[#145C4B]/90 disabled:opacity-60 transition-colors shadow-sm"
                >
                  {settling === confirmIdx ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      I've Paid — Mark as Settled
                    </>
                  )}
                </button>
                <button
                  onClick={closeConfirmModal}
                  className="w-full py-3 rounded-xl text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

