'use client';

import { useState } from 'react';
import { api } from '../lib/firebaseApi';
import { ChevronDown, ChevronUp, X, Copy, Check, IndianRupee, ArrowRight, Smartphone, ExternalLink, Download } from 'lucide-react';

export default function BalanceBoard({ groupId, balances, moves, currentUserId, totalExpenses, onSettled }) {
  const [settling, setSettling] = useState(null);
  const [showSummary, setShowSummary] = useState(true);
  const [showSettle, setShowSettle] = useState(true);

  // Confirmation modal state
  const [confirmMove, setConfirmMove] = useState(null); // the move object to confirm
  const [confirmIdx, setConfirmIdx] = useState(null);
  const [upiCopied, setUpiCopied] = useState(false);

  function exportCsv() {
    let csv = "Section,Member/Debtor,Creditor,Amount (INR)\n";
    (balances || []).forEach(b => {
      csv += `Balance,${(b.name || '').replace(/,/g, ' ')},,${(b.amount || 0).toFixed(2)}\n`;
    });
    (moves || []).forEach(m => {
      csv += `Settlement,${(m.fromName || '').replace(/,/g, ' ')},${(m.toName || '').replace(/,/g, ' ')},${(m.amount || 0).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `group-report-${groupId || 'settlements'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
    <div className="flex flex-col gap-5 p-2 sm:p-4">
      {/* Total Expenses Header */}
      <div className="bg-white rounded-[24px] shadow-sm border border-[#E2EFE9] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Group Spend</span>
          <p className="font-extrabold text-2xl sm:text-3xl text-[#145C4B] mt-0.5">
            ₹{Number(totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">
            Simplified settlement calculations active
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2.5 rounded-2xl bg-[#F0F7F4] hover:bg-[#E2EFE9] border border-[#E2EFE9] text-xs font-bold text-[#145C4B] transition-all flex items-center gap-2 active:scale-95"
        >
          <Download className="w-4 h-4 text-[#145C4B]" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-[24px] shadow-sm border border-[#E2EFE9] flex flex-col overflow-hidden">
        <button 
          onClick={() => setShowSummary(!showSummary)}
          className="w-full px-6 py-4 flex items-center justify-between border-b border-[#E2EFE9] hover:bg-[#F0F7F4]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-gray-900 text-base">Individual Net Positions</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#145C4B]/10 text-[#145C4B]">
              {balances.length} members
            </span>
          </div>
          {showSummary ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>
        
        {showSummary && (
          <div className="divide-y divide-[#E2EFE9]">
            {balances.map((b) => (
              <div key={b.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{b.name}</span>
                  <span className="text-gray-500 text-xs mt-0.5 font-medium">
                    Spent ₹{(b.paid || 0).toFixed(0)} · Share ₹{(b.charged || 0).toFixed(0)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`font-extrabold text-sm sm:text-base px-3 py-1 rounded-full ${
                      b.amount > 0
                        ? 'bg-[#E6F4ED] text-[#0D9488]'
                        : b.amount < 0
                        ? 'bg-[#FFE4E6] text-[#E11D48]'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {b.amount > 0 ? `+₹${Math.abs(b.amount).toFixed(2)}` : b.amount < 0 ? `-₹${Math.abs(b.amount).toFixed(2)}` : 'Settled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to settle Card */}
      <div className="bg-white rounded-[24px] shadow-sm border border-[#E2EFE9] flex flex-col overflow-hidden">
        <button 
          onClick={() => setShowSettle(!showSettle)}
          className="w-full px-6 py-4 flex items-center justify-between border-b border-[#E2EFE9] hover:bg-[#F0F7F4]/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-gray-900 text-base">Optimal Settlement Path</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#25D366]/20 text-[#0E382F]">
              {moves.length} transactions
            </span>
          </div>
          {showSettle ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {showSettle && (
          <div className="divide-y divide-[#E2EFE9]">
            {moves.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500 font-bold text-sm">Everyone is all settled up! 🎉</p>
                <p className="text-xs text-gray-400 mt-1">No outstanding balances or payments required.</p>
              </div>
            ) : (
              moves.map((move, idx) => {
                const isMeDebtor = currentUserId === move.from;
                const isMeCreditor = currentUserId === move.to;

                return (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-[#F0F7F4]/40 transition-colors">
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-extrabold text-gray-900 truncate">
                        <span className={isMeDebtor ? 'text-[#E11D48]' : 'text-gray-900'}>
                          {isMeDebtor ? 'You' : move.fromName}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className={isMeCreditor ? 'text-[#0D9488]' : 'text-gray-900'}>
                          {isMeCreditor ? 'You' : move.toName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium mt-0.5">
                        Direct transfer
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-base text-[#145C4B]">
                        ₹{move.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => openConfirmModal(move, idx)}
                        className={`text-xs font-bold px-4 py-2 rounded-2xl transition-all shadow-xs ${
                          isMeDebtor
                            ? 'bg-[#145C4B] text-white hover:bg-[#0E382F] active:scale-95'
                            : isMeCreditor
                            ? 'bg-[#E6F4ED] text-[#0D9488] hover:bg-[#d3ebd9] active:scale-95'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isMeDebtor ? 'Settle Up' : isMeCreditor ? 'Mark Paid' : 'Record'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Settlement Confirmation Modal */}
      {confirmMove && (() => {
        const isModalPayer = currentUserId === confirmMove.from;
        const isModalReceiver = currentUserId === confirmMove.to;

        return (
          <>
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[70]" onClick={closeConfirmModal} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm bg-white rounded-[28px] shadow-2xl z-[80] overflow-hidden border border-[#E2EFE9] animate-pop-in">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-lg text-gray-900">
                    {isModalPayer
                      ? `Settle up with ${confirmMove.toName}`
                      : isModalReceiver
                      ? `Record Payment from ${confirmMove.fromName}`
                      : 'Record Settlement'}
                  </h3>
                  <button onClick={closeConfirmModal} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>

                {/* Payment Visual */}
                <div className="bg-gradient-to-br from-[#F0F7F4] to-[#E2EFE9]/40 rounded-2xl p-5 border border-[#E2EFE9]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-extrabold text-[#145C4B] mb-1 border border-[#E2EFE9]">
                        {confirmMove.fromName?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-gray-800 text-center leading-tight">
                        {isModalPayer ? 'You' : confirmMove.fromName}
                      </span>
                    </div>
                    <div className="flex flex-col items-center px-2">
                      <ArrowRight size={20} className="text-[#145C4B] mb-1" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">pays</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-extrabold text-[#145C4B] mb-1 border border-[#E2EFE9]">
                        {confirmMove.toName?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-gray-800 text-center leading-tight">
                        {isModalReceiver ? 'You' : confirmMove.toName}
                      </span>
                    </div>
                  </div>
                  <div className="text-center pt-1">
                    <p className="text-3xl font-extrabold text-[#145C4B] tracking-tight">
                      ₹{confirmMove.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Direct UPI pay section */}
                {isModalPayer && confirmMove.toUpiId && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pay via UPI App</p>
                    
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(confirmMove.toUpiId)}&pn=${encodeURIComponent(confirmMove.toName || 'User')}&am=${confirmMove.amount.toFixed(2)}&cu=INR`}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#145C4B] text-white font-bold text-xs hover:bg-[#0E382F] transition-all shadow-md active:scale-95"
                    >
                      <Smartphone size={16} />
                      <span>Pay ₹{confirmMove.amount.toFixed(2)} via UPI App</span>
                      <ExternalLink size={14} className="opacity-80 ml-0.5" />
                    </a>

                    <div className="bg-[#F0F7F4] rounded-2xl p-3 flex items-center justify-between border border-[#E2EFE9]">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">UPI ID</span>
                        <span className="text-xs text-gray-900 font-mono font-bold truncate">{confirmMove.toUpiId}</span>
                      </div>
                      <button
                        onClick={() => copyUpiId(confirmMove.toUpiId)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E2EFE9] text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                      >
                        {upiCopied ? <Check size={14} className="text-[#0D9488]" /> : <Copy size={14} />}
                        {upiCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {/* WhatsApp reminder button for receiver */}
                {isModalReceiver && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hi ${confirmMove.fromName}! Reminder to settle your balance of ₹${confirmMove.amount.toFixed(2)} for Kaun-Dega.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-[#25D366]/15 text-[#0E382F] font-bold text-xs hover:bg-[#25D366]/25 transition-colors flex items-center justify-center gap-2 border border-[#25D366]/30"
                  >
                    Remind {confirmMove.fromName} on WhatsApp
                  </a>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={confirmSettlement}
                    disabled={settling === confirmIdx}
                    className="w-full py-3.5 rounded-2xl bg-[#145C4B] text-white font-bold text-xs hover:bg-[#0E382F] disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {settling === confirmIdx ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        {isModalPayer
                          ? "I've Paid — Mark Settled"
                          : isModalReceiver
                          ? "Confirm Received Payment"
                          : "Record Settlement"}
                      </>
                    )}
                  </button>

                  <button
                    onClick={closeConfirmModal}
                    className="w-full py-2.5 rounded-2xl text-gray-500 font-bold text-xs hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}


