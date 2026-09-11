'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/firebaseApi';
import { Coffee, IndianRupee, FileText } from 'lucide-react';
import AdjustSplitModal from './AdjustSplitModal';

export default function ExpenseForm({
  groupId,
  members,
  currentUserId,
  isDirect = false,
  onAdded,
  existingExpense = null,
  onUpdated,
}) {
  const otherMember = members.find((m) => m.id !== currentUserId) || members[1] || members[0];
  const currentMember = members.find((m) => m.id === currentUserId) || members[0];

  const [description, setDescription] = useState(existingExpense ? existingExpense.description : '');
  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : '');
  const [paidBy, setPaidBy] = useState(existingExpense ? existingExpense.paid_by || existingExpense.paidBy : currentUserId);
  const [splitType, setSplitType] = useState(existingExpense ? existingExpense.split_type || existingExpense.splitType : 'equal');
  const [splitData, setSplitData] = useState(existingExpense ? existingExpense.splitData : null);
  const [shares, setShares] = useState(existingExpense ? existingExpense.expense_shares || existingExpense.shares : null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [directMode, setDirectMode] = useState(() => {
    if (!existingExpense) return 'you_gave';
    const exShares = existingExpense.expense_shares || existingExpense.shares || [];
    const exPaidBy = existingExpense.paid_by || existingExpense.paidBy;
    if (exShares.length === 1 && otherMember) {
      const sUid = exShares[0].user_id || exShares[0].userId;
      if (sUid === otherMember.id && exPaidBy === currentUserId) return 'you_gave';
      if (sUid === currentUserId && exPaidBy === otherMember.id) return 'you_got';
    }
    if (existingExpense.split_type === 'equal' || existingExpense.splitType === 'equal') {
      return 'split_equal';
    }
    return 'custom';
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!description.trim() || !amount || Number(amount) <= 0) {
      setError('Add a description and an amount above ₹0.');
      return;
    }

    setSaving(true);
    try {
      const numTotal = Number(amount);
      const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

      const body = {
        groupId,
        description: description.trim(),
        amount: numTotal,
      };

      if (isDirect && otherMember && directMode !== 'custom') {
        if (directMode === 'you_gave') {
          body.paidBy = currentUserId;
          body.splitType = 'exact';
          body.splitData = { [otherMember.id]: numTotal };
          body.shares = [{ userId: otherMember.id, user_id: otherMember.id, amount: numTotal, share_amount: numTotal }];
          body.memberIds = [currentUserId, otherMember.id];
        } else if (directMode === 'you_got') {
          body.paidBy = otherMember.id;
          body.splitType = 'exact';
          body.splitData = { [currentUserId]: numTotal };
          body.shares = [{ userId: currentUserId, user_id: currentUserId, amount: numTotal, share_amount: numTotal }];
          body.memberIds = [currentUserId, otherMember.id];
        } else if (directMode === 'split_equal') {
          body.paidBy = paidBy || currentUserId;
          body.splitType = 'equal';
          const half = round2(numTotal / 2);
          const rem = round2(numTotal - half * 2);
          const isPayerCurrent = body.paidBy === currentUserId;
          const userAmt = isPayerCurrent ? round2(half + rem) : half;
          const otherAmt = !isPayerCurrent ? round2(half + rem) : half;
          body.shares = [
            { userId: currentUserId, user_id: currentUserId, amount: userAmt, share_amount: userAmt },
            { userId: otherMember.id, user_id: otherMember.id, amount: otherAmt, share_amount: otherAmt },
          ];
          body.splitData = {
            [currentUserId]: userAmt,
            [otherMember.id]: otherAmt,
          };
          body.memberIds = [currentUserId, otherMember.id];
        }
      } else {
        body.paidBy = paidBy;
        body.splitType = splitType;
        body.splitData = splitData;
        body.memberIds = members.map((m) => m.id);
        if (shares) {
          body.shares = shares;
        }
      }

      if (existingExpense) {
        await api.updateExpense(existingExpense.id, body);
        if (onUpdated) onUpdated();
        else if (onAdded) onAdded();
      } else {
        await api.addExpense(body);
        setDescription('');
        setAmount('');
        setSplitType('equal');
        setSplitData(null);
        setShares(null);
        if (isDirect) setDirectMode('you_gave');
        onAdded?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const payingMember = members.find((m) => m.id === paidBy);
  const totalAmountNum = Number(amount || 0);

  let splitSummary = 'equally';
  if (splitType === 'exact') splitSummary = 'unequally';
  if (splitType === 'percentage') splitSummary = 'by percentages';
  if (splitType === 'shares') splitSummary = 'by shares';
  if (splitType === 'adjustment') splitSummary = 'by adjustment';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-5 pb-32">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <FileText size={20} />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={existingExpense ? 'Description' : 'Enter a description (e.g. UPI, lunch, movie)'}
            className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#145C4B] focus:ring-1 focus:ring-[#145C4B] transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Amount (₹)</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#145C4B]">
              <IndianRupee size={16} />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#145C4B] focus:ring-1 focus:ring-[#145C4B] transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* In 1-on-1 Khatabook mode, Paid By is derived from transaction type toggle below, or selectable if 50/50 */}
        {(!isDirect || directMode === 'split_equal' || directMode === 'custom') ? (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Paid by</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:border-[#145C4B] focus:ring-1 focus:ring-[#145C4B] transition-all appearance-none text-sm font-medium"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.toUpperCase()} {m.id === currentUserId ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Contact</label>
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-700 text-sm font-semibold truncate flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{otherMember?.name || 'Friend'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 1-on-1 Khatabook Transaction Type Selector */}
      {isDirect && otherMember ? (
        <div className="space-y-3 pt-1">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500">
            Khatabook Transaction Type
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => {
                setDirectMode('you_gave');
                setPaidBy(currentUserId);
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                directMode === 'you_gave'
                  ? 'bg-[#DC2626] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 bg-transparent'
              }`}
            >
              <span>You Gave (diye)</span>
              <span className="text-[10px] opacity-85 truncate max-w-full font-medium">
                {otherMember.name} owes you
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirectMode('you_got');
                setPaidBy(otherMember.id);
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                directMode === 'you_got'
                  ? 'bg-[#059669] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 bg-transparent'
              }`}
            >
              <span>You Got (liye)</span>
              <span className="text-[10px] opacity-85 truncate max-w-full font-medium">
                You owe {otherMember.name}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDirectMode('split_equal')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                directMode === 'split_equal'
                  ? 'bg-[#145C4B] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 bg-transparent'
              }`}
            >
              <span>Split 50 / 50</span>
              <span className="text-[10px] opacity-85 font-medium">Shared expense</span>
            </button>
          </div>

          {/* Dynamic helper banner */}
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
              directMode === 'you_gave'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : directMode === 'you_got'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : directMode === 'split_equal'
                ? 'bg-teal-50 border-teal-200 text-teal-800'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <div>
              {directMode === 'you_gave' && (
                <p>
                  💸 Paid by <span className="font-extrabold">You</span> · <span className="font-extrabold">{otherMember.name}</span> will owe you <span className="font-extrabold">₹{totalAmountNum.toFixed(2)}</span>
                </p>
              )}
              {directMode === 'you_got' && (
                <p>
                  🤝 Paid by <span className="font-extrabold">{otherMember.name}</span> · You will owe <span className="font-extrabold">₹{totalAmountNum.toFixed(2)}</span>
                </p>
              )}
              {directMode === 'split_equal' && (
                <p>
                  ⚖️ Split equally between both · <span className="font-extrabold">₹{(totalAmountNum / 2).toFixed(2)}</span> each
                </p>
              )}
              {directMode === 'custom' && (
                <p>
                  ⚙️ Custom split configured
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setDirectMode('custom');
                setShowAdjustModal(true);
              }}
              className="text-[11px] underline font-bold shrink-0 ml-2 hover:opacity-80 cursor-pointer"
            >
              Custom Split
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => setShowAdjustModal(true)}
            className="bg-green-50 text-[#145C4B] font-semibold text-sm px-6 py-3 rounded-full border border-green-100 hover:bg-green-100 transition-colors shadow-sm"
          >
            Paid by <span className="font-bold">{paidBy === currentUserId ? 'you' : payingMember?.name}</span> and split{' '}
            <span className="font-bold">{splitSummary}</span>.
          </button>
        </div>
      )}

      <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 flex items-start gap-3">
        <div className="mt-0.5 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Add a note (optional)"
          className="bg-transparent border-none w-full text-sm focus:outline-none placeholder-gray-400 text-gray-700"
        />
      </div>

      {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">{error}</p>}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-safe z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">
                {isDirect && directMode === 'you_gave'
                  ? 'You are lending'
                  : isDirect && directMode === 'you_got'
                  ? `${otherMember?.name || 'Contact'} is paying`
                  : paidBy === currentUserId
                  ? 'You are paying'
                  : `${payingMember?.name || 'Someone'} is paying`}
              </p>
              <p className="text-xl font-bold text-[#145C4B]">₹{totalAmountNum.toFixed(2)}</p>
            </div>
            <div className="w-[1px] h-8 bg-gray-200"></div>
            <div className="text-right flex flex-col justify-center">
              <p className="text-sm font-bold text-[#145C4B]">
                {isDirect
                  ? directMode === 'you_gave'
                    ? `100% to ${otherMember?.name || 'Friend'}`
                    : directMode === 'you_got'
                    ? '100% to You'
                    : '2 people (50/50)'
                  : shares
                  ? `${shares.length} people`
                  : `${members.length} people`}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#145C4B] text-white font-bold uppercase tracking-widest py-4 hover:bg-[#145C4B]/90 disabled:opacity-60 transition-colors shadow-md"
          >
            {saving ? 'SAVING...' : existingExpense ? 'UPDATE EXPENSE' : 'SAVE EXPENSE'}
          </button>
        </div>
      </div>

      {showAdjustModal && (
        <AdjustSplitModal
          members={members}
          totalAmount={amount}
          currentSplitType={splitType}
          currentSplitData={splitData}
          onClose={() => setShowAdjustModal(false)}
          onSave={(newType, newData, computedShares) => {
            setSplitType(newType);
            setSplitData(newData);
            setShares(computedShares);
            setShowAdjustModal(false);
          }}
        />
      )}
    </form>
  );
}

