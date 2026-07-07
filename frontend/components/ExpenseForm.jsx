'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ExpenseForm({ groupId, members, currentUserId, onAdded }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitType, setSplitType] = useState('equal');
  
  // Equal Split State
  const [checkedMembers, setCheckedMembers] = useState(
    members.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
  );

  // Custom Split State
  const [customRatios, setCustomRatios] = useState(
    members.reduce((acc, m) => ({ ...acc, [m.id]: 1 }), {})
  );
  const [customAmounts, setCustomAmounts] = useState({});

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Re-calculate custom amounts when main amount changes or ratio changes
  useEffect(() => {
    if (splitType === 'custom') {
      const totalAmount = Number(amount || 0);
      const totalRatio = Object.values(customRatios).reduce((sum, r) => sum + Number(r || 0), 0);
      
      if (totalRatio > 0) {
        const newAmounts = {};
        members.forEach(m => {
          const r = Number(customRatios[m.id] || 0);
          newAmounts[m.id] = ((r / totalRatio) * totalAmount).toFixed(2);
        });
        setCustomAmounts(newAmounts);
      }
    }
  }, [amount, customRatios, splitType, members]);

  function handleRatioChange(memberId, val) {
    setCustomRatios(prev => ({ ...prev, [memberId]: val }));
  }

  function handleAmountChange(memberId, val) {
    setCustomAmounts(prev => ({ ...prev, [memberId]: val }));
    // Clear ratio so it doesn't auto-update from ratio anymore for this user
    setCustomRatios(prev => ({ ...prev, [memberId]: '' }));
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

      await api.addExpense(body);
      setDescription('');
      setAmount('');
      // Reset splits
      setCheckedMembers(members.reduce((acc, m) => ({ ...acc, [m.id]: true }), {}));
      setCustomRatios(members.reduce((acc, m) => ({ ...acc, [m.id]: 1 }), {}));
      
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="chit rounded-sm p-5 space-y-4 shadow-[0_4px_20px_rgba(11,43,38,0.08)]">
      <h3 className="font-display text-lg text-ink">Add a chit</h3>

      <div>
        <label className="block text-sm font-medium text-ink/70 mb-1">What was it for?</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Chai at the tapri"
          className="w-full rounded-sm border border-ink/15 bg-white px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-sm border border-ink/15 bg-white px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-sm border border-ink/15 bg-white px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-teal"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex gap-2 mb-3 mt-2">
          <button
            type="button"
            onClick={() => setSplitType('equal')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              splitType === 'equal' ? 'bg-teal text-paper border-teal' : 'border-ink/20 text-ink/70'
            }`}
          >
            Split evenly
          </button>
          <button
            type="button"
            onClick={() => setSplitType('custom')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              splitType === 'custom' ? 'bg-blue-500 text-white border-blue-500' : 'border-ink/20 text-ink/70'
            }`}
          >
            Custom shares
          </button>
        </div>

        {/* EQUAL SPLIT UI */}
        {splitType === 'equal' && (
          <div className="border border-teal/30 bg-teal/5 rounded-sm overflow-hidden mb-4">
            <div className="flex items-center justify-between bg-teal/10 px-3 py-2 border-b border-teal/20">
              <label className="flex items-center gap-2 text-sm font-semibold text-teal-900 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="accent-teal rounded-sm w-4 h-4"
                  checked={Object.values(checkedMembers).every(Boolean)}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setCheckedMembers(members.reduce((acc, m) => ({ ...acc, [m.id]: val }), {}));
                  }}
                />
                All
              </label>
              <span className="text-xs font-mono uppercase tracking-wider text-teal-700 font-bold">Equal</span>
            </div>
            <div className="divide-y divide-teal/10">
              {members.map((m) => {
                const isChecked = checkedMembers[m.id];
                const checkedCount = Object.values(checkedMembers).filter(Boolean).length;
                const computedAmount = isChecked && checkedCount > 0 ? (Number(amount || 0) / checkedCount).toFixed(2) : '0.00';
                
                return (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-white/40 hover:bg-white/60 transition-colors">
                    <label className="flex items-center gap-3 text-sm text-ink/90 cursor-pointer w-full">
                      <input 
                        type="checkbox" 
                        className="accent-teal rounded-sm w-4 h-4"
                        checked={isChecked}
                        onChange={(e) => setCheckedMembers({...checkedMembers, [m.id]: e.target.checked})}
                      />
                      {m.name}
                    </label>
                    <span className="font-mono text-sm text-ink/70">{computedAmount} INR</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOM SPLIT UI (Ratio) */}
        {splitType === 'custom' && (
          <div className="border border-blue-200 bg-blue-50/50 rounded-sm overflow-hidden mb-4">
            <div className="flex items-center justify-between bg-blue-100 px-3 py-2 border-b border-blue-200">
              <span className="text-sm font-semibold text-blue-900">Ratio</span>
              <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">Custom</span>
            </div>
            <div className="divide-y divide-blue-100">
              {members.map((m) => {
                return (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-white/60 gap-4">
                    <span className="text-sm text-ink/90 flex-1 min-w-0 truncate pr-2">{m.name}</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customRatios[m.id] !== undefined ? customRatios[m.id] : ''}
                      onChange={(e) => handleRatioChange(m.id, e.target.value)}
                      className="w-16 rounded-sm border-b-2 border-ink/20 bg-transparent px-1 py-1 font-mono text-sm text-center focus:outline-none focus:border-ink transition-colors"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customAmounts[m.id] || ''}
                        onChange={(e) => handleAmountChange(m.id, e.target.value)}
                        placeholder="0.00"
                        className="w-20 rounded-sm border-b-2 border-ink/20 bg-transparent px-1 py-1 font-mono text-sm text-right focus:outline-none focus:border-ink transition-colors"
                      />
                      <span className="text-xs text-ink/40 font-mono">INR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-chili text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-sm bg-marigold text-ink font-bold uppercase tracking-widest py-3 hover:brightness-95 disabled:opacity-60 transition-all shadow-[2px_2px_0px_rgba(11,43,38,0.2)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none"
      >
        {saving ? 'Saving…' : 'Add to the ledger'}
      </button>
    </form>
  );
}
