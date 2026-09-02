'use client';

import { useState, useEffect } from 'react';
import { api } from '../archive/deprecated-utils/api';
import { Coffee, IndianRupee } from 'lucide-react';

export default function ExpenseForm({ groupId, members, currentUserId, onAdded, existingExpense = null, onUpdated }) {
  const [description, setDescription] = useState(existingExpense ? existingExpense.description : '');
  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : '');
  const [paidBy, setPaidBy] = useState(existingExpense ? existingExpense.paid_by : currentUserId);
  const [splitType, setSplitType] = useState(existingExpense ? existingExpense.split_type : 'equal');
  
  // Equal Split State
  const [checkedMembers, setCheckedMembers] = useState(
    members.reduce((acc, m) => {
      let isChecked = true;
      if (existingExpense && existingExpense.split_type === 'equal') {
        isChecked = existingExpense.expense_shares.some(s => s.user_id === m.id);
      }
      return { ...acc, [m.id]: isChecked };
    }, {})
  );

  // Custom Split State
  const [customRatios, setCustomRatios] = useState(
    members.reduce((acc, m) => ({ ...acc, [m.id]: 1 }), {})
  );
  const [customAmounts, setCustomAmounts] = useState(
    members.reduce((acc, m) => {
      let amt = '';
      if (existingExpense && existingExpense.split_type === 'custom') {
        const share = existingExpense.expense_shares.find(s => s.user_id === m.id);
        if (share) amt = String(share.share_amount);
      }
      return { ...acc, [m.id]: amt };
    }, {})
  );
  const [lockedMembers, setLockedMembers] = useState(new Set());

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset locks if total amount changes significantly? We can just leave them locked.
  useEffect(() => {
    if (splitType === 'custom') {
      const totalAmount = Number(amount || 0);
      const totalRatio = Object.values(customRatios).reduce((sum, r) => sum + Number(r || 0), 0);
      
      if (totalRatio > 0) {
        // If we are using ratios, everything is unlocked
        setLockedMembers(new Set());
        const newAmounts = {};
        members.forEach(m => {
          const r = Number(customRatios[m.id] || 0);
          newAmounts[m.id] = ((r / totalRatio) * totalAmount).toFixed(2);
        });
        setCustomAmounts(newAmounts);
      } else if (lockedMembers.size > 0 && lockedMembers.size < members.length) {
        // If total amount changes, adjust unlocked members to balance the new total
        const currentLocked = Array.from(lockedMembers);
        const sumLocked = currentLocked.reduce((sum, id) => sum + Number(customAmounts[id] || 0), 0);
        const remainingAmount = Math.max(0, totalAmount - sumLocked);
        
        const unlockedMembers = members.filter(m => !lockedMembers.has(m.id));
        if (unlockedMembers.length > 0) {
          const splitForUnlocked = (remainingAmount / unlockedMembers.length).toFixed(2);
          const remainder = Number((remainingAmount - (Number(splitForUnlocked) * unlockedMembers.length)).toFixed(2));
          
          const newAmounts = { ...customAmounts };
          unlockedMembers.forEach((m, idx) => {
            newAmounts[m.id] = idx === 0 
              ? (Number(splitForUnlocked) + remainder).toFixed(2) 
              : splitForUnlocked;
          });
          setCustomAmounts(newAmounts);
        }
      }
    }
  }, [amount, customRatios, splitType, members]); // Note: omitted lockedMembers and customAmounts to avoid cycles on load

  function handleRatioChange(memberId, val) {
    setCustomRatios(prev => ({ ...prev, [memberId]: val }));
  }

  function handleAmountChange(memberId, val) {
    const newAmounts = { ...customAmounts, [memberId]: val };
    
    // Update locks
    const newLocked = new Set(lockedMembers);
    if (val === '') {
      newLocked.delete(memberId);
    } else {
      newLocked.add(memberId);
    }
    setLockedMembers(newLocked);

    // Calculate remaining for unlocked members
    const totalAmount = Number(amount || 0);
    const currentLocked = Array.from(newLocked);
    
    if (currentLocked.length > 0 && currentLocked.length < members.length) {
      const sumLocked = currentLocked.reduce((sum, id) => sum + Number(newAmounts[id] || 0), 0);
      const remainingAmount = Math.max(0, totalAmount - sumLocked);
      
      const unlockedMembers = members.filter(m => !newLocked.has(m.id));
      if (unlockedMembers.length > 0) {
        const splitForUnlocked = (remainingAmount / unlockedMembers.length).toFixed(2);
        
        // Adjust for rounding error by adding remainder to the first unlocked member
        const remainder = Number((remainingAmount - (Number(splitForUnlocked) * unlockedMembers.length)).toFixed(2));
        
        unlockedMembers.forEach((m, idx) => {
          newAmounts[m.id] = idx === 0 
            ? (Number(splitForUnlocked) + remainder).toFixed(2) 
            : splitForUnlocked;
        });
      }
    }

    setCustomAmounts(newAmounts);
    // Clear all ratios when user types an exact amount so it doesn't get overwritten
    setCustomRatios(members.reduce((acc, m) => ({ ...acc, [m.id]: '' }), {}));
  }

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
      };

      if (splitType === 'custom') {
        body.shares = members.map((m) => ({
          userId: m.id,
          amount: Number(customAmounts[m.id] || 0),
        })).filter(s => s.amount > 0);
      } else {
        const selectedIds = members.filter(m => checkedMembers[m.id]).map(m => m.id);
        if (selectedIds.length === 0) {
          throw new Error('Please select at least one member for the split.');
        }
        body.memberIds = selectedIds;
      }

      if (existingExpense) {
        await api.updateExpense(existingExpense.id, body);
        if (onUpdated) onUpdated();
        else if (onAdded) onAdded();
      } else {
        await api.addExpense(body);
        setDescription('');
        setAmount('');
        setCheckedMembers(members.reduce((acc, m) => ({ ...acc, [m.id]: true }), {}));
        setCustomRatios(members.reduce((acc, m) => ({ ...acc, [m.id]: 1 }), {}));
        
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

  // Compute total selected for bottom bar
  const payingMember = members.find(m => m.id === paidBy);
  const totalAmountNum = Number(amount || 0);
  let splitAmount = '0.00';
  let splitPeopleCount = 0;
  
  if (splitType === 'equal') {
    const checkedCount = Object.values(checkedMembers).filter(Boolean).length;
    splitPeopleCount = checkedCount;
    splitAmount = checkedCount > 0 ? (totalAmountNum / checkedCount).toFixed(2) : '0.00';
  } else {
    // Custom split just shows how many people have > 0 amount
    const activeCustom = members.filter(m => Number(customAmounts[m.id] || 0) > 0);
    splitPeopleCount = activeCustom.length;
    splitAmount = 'Custom'; // or omit
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-5 pb-32">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">What was it for?</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Coffee size={20} />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={existingExpense ? "Description" : "Chai at the tapri"}
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

      <div>
        <div className="flex bg-gray-50/80 p-1 rounded-xl mb-4 border border-gray-100">
          <button
            type="button"
            onClick={() => setSplitType('equal')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              splitType === 'equal' ? activeSplitClass : inactiveSplitClass
            }`}
          >
            Split equally
          </button>
          <button
            type="button"
            onClick={() => setSplitType('custom')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              splitType === 'custom' ? activeSplitClass : inactiveSplitClass
            }`}
          >
            Custom shares
          </button>
        </div>

        {/* EQUAL SPLIT UI */}
        {splitType === 'equal' && (
          <div className="bg-gray-50/50 rounded-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-800 cursor-pointer">
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${Object.values(checkedMembers).every(Boolean) ? 'bg-[#145C4B]' : 'bg-white border-2 border-gray-300'}`}>
                  {Object.values(checkedMembers).every(Boolean) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={Object.values(checkedMembers).every(Boolean)}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setCheckedMembers(members.reduce((acc, m) => ({ ...acc, [m.id]: val }), {}));
                  }}
                />
                All ({members.length} people)
              </label>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#145C4B]">Equal Share</span>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map((m, idx) => {
                const isChecked = checkedMembers[m.id];
                const checkedCount = Object.values(checkedMembers).filter(Boolean).length;
                const computedAmount = isChecked && checkedCount > 0 ? (Number(amount || 0) / checkedCount).toFixed(2) : '0.00';
                const percentage = isChecked && checkedCount > 0 ? (100 / checkedCount).toFixed(2) : '0.00';
                
                return (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                    <label className="flex items-center gap-3 text-sm text-gray-800 font-semibold cursor-pointer flex-1">
                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isChecked ? 'bg-[#145C4B]' : 'bg-white border-2 border-gray-300'}`}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isChecked}
                        onChange={(e) => setCheckedMembers({...checkedMembers, [m.id]: e.target.checked})}
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{m.name} {m.id === currentUserId && <span className="text-[#145C4B] font-medium">(You)</span>}</span>
                      </div>
                    </label>
                    <div className="text-right">
                      <div className="text-sm text-gray-900 font-semibold">₹{computedAmount}</div>
                      <div className="text-[11px] text-gray-400 font-medium">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOM SPLIT UI */}
        {splitType === 'custom' && (
          <div className="bg-gray-50/50 rounded-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Ratio</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#145C4B]">Custom Share</span>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map((m) => {
                return (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 truncate">{m.name} {m.id === currentUserId && <span className="text-[#145C4B] font-medium">(You)</span>}</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customRatios[m.id] !== undefined ? customRatios[m.id] : ''}
                      onChange={(e) => handleRatioChange(m.id, e.target.value)}
                      className="w-16 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#145C4B] focus:ring-1 focus:ring-[#145C4B] transition-all"
                    />
                    <div className="relative">
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customAmounts[m.id] || ''}
                        onChange={(e) => handleAmountChange(m.id, e.target.value)}
                        placeholder="0.00"
                        className="w-24 rounded border border-gray-200 bg-white pl-6 pr-2 py-1.5 text-sm text-right focus:outline-none focus:border-[#145C4B] focus:ring-1 focus:ring-[#145C4B] transition-all font-semibold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Split between {splitPeopleCount} people</p>
              <p className="text-sm font-bold text-[#145C4B]">
                {splitType === 'equal' ? `₹${splitAmount} each` : 'Custom amounts'}
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
    </form>
  );
}
