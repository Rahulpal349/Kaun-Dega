'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/firebaseApi';
import { Coffee, IndianRupee, FileText } from 'lucide-react';
import AdjustSplitModal from './AdjustSplitModal';

export default function ExpenseForm({ groupId, members, currentUserId, onAdded, existingExpense = null, onUpdated }) {
  const [description, setDescription] = useState(existingExpense ? existingExpense.description : '');
  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : '');
  const [paidBy, setPaidBy] = useState(existingExpense ? existingExpense.paid_by : currentUserId);
  const [splitType, setSplitType] = useState(existingExpense ? existingExpense.split_type : 'equal');
  const [splitData, setSplitData] = useState(existingExpense ? existingExpense.splitData : null);
  const [shares, setShares] = useState(existingExpense ? existingExpense.expense_shares : null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!description.trim() || !amount || Number(amount) <= 0) {
      setError('Add a description and an amount above ₹0.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        groupId,
        description: description.trim(),
        amount: Number(amount),
        paidBy,
        splitType,
        splitData,
      };

      if (shares) {
        body.shares = shares;
      } else {
        body.memberIds = members.map(m => m.id);
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
        
        onAdded?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const activeSplitClass = "bg-[#145C4B] text-white shadow-sm";
  const inactiveSplitClass = "text-gray-500 hover:text-gray-700 bg-transparent";

  const payingMember = members.find(m => m.id === paidBy);
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
            placeholder={existingExpense ? "Description" : "Enter a description"}
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
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:border-[#145C4B] focus:ring-1 focus:ring-[#145C4B] transition-all appearance-none text-sm font-medium"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name.toUpperCase()} {m.id === currentUserId ? '(You)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={() => setShowAdjustModal(true)}
          className="bg-green-50 text-[#145C4B] font-semibold text-sm px-6 py-3 rounded-full border border-green-100 hover:bg-green-100 transition-colors shadow-sm"
        >
          Paid by <span className="font-bold">{paidBy === currentUserId ? 'you' : payingMember?.name}</span> and split <span className="font-bold">{splitSummary}</span>.
        </button>
      </div>

      <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 flex items-start gap-3">
        <div className="mt-0.5 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
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
                {paidBy === currentUserId ? 'You are paying' : `${payingMember?.name || 'Someone'} is paying`}
              </p>
              <p className="text-xl font-bold text-[#145C4B]">₹{totalAmountNum.toFixed(2)}</p>
            </div>
            <div className="w-[1px] h-8 bg-gray-200"></div>
            <div className="text-right flex flex-col justify-center">
              <p className="text-sm font-bold text-[#145C4B]">
                {shares ? `${shares.length} people` : `${members.length} people`}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#145C4B] text-white font-bold uppercase tracking-widest py-4 hover:bg-[#145C4B]/90 disabled:opacity-60 transition-colors shadow-md"
          >
            {saving ? 'SAVING...' : (existingExpense ? 'UPDATE EXPENSE' : 'SAVE EXPENSE')}
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
