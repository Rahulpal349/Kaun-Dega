'use client';

import { useState, useEffect } from 'react';
import { api } from '../archive/deprecated-utils/api';
import { Coffee, IndianRupee } from 'lucide-react';

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
      setCheckedMembers(members.reduce((acc, m) => ({ ...acc, [m.id]: true }), {}));
      setCustomRatios(members.reduce((acc, m) => ({ ...acc, [m.id]: 1 }), {}));
      
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const activeSplitClass = "bg-ink text-white border-ink shadow-sm";
  const inactiveSplitClass = "bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
      <h3 className="font-bold text-xl text-gray-900">Add an expense</h3>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">What was it for?</label>
        <div className="relative">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Chai at the tapri"
            className="w-full rounded-lg border border-gray-200 bg-white pl-4 pr-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Coffee size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Amount (₹)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 bg-white pl-4 pr-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <IndianRupee size={16} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} {m.id === currentUserId ? '(You)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSplitType('equal')}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
              splitType === 'equal' ? activeSplitClass : inactiveSplitClass
            }`}
          >
            Split equally
          </button>
          <button
            type="button"
            onClick={() => setSplitType('custom')}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
              splitType === 'custom' ? activeSplitClass : inactiveSplitClass
            }`}
          >
            Custom shares
          </button>
        </div>

        {/* EQUAL SPLIT UI */}
        {splitType === 'equal' && (
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-100/50">
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="accent-primary rounded-sm w-4 h-4 cursor-pointer"
                  checked={Object.values(checkedMembers).every(Boolean)}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setCheckedMembers(members.reduce((acc, m) => ({ ...acc, [m.id]: val }), {}));
                  }}
                />
                All ({members.length} people)
              </label>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Equal Share</span>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map((m, idx) => {
                const isChecked = checkedMembers[m.id];
                const checkedCount = Object.values(checkedMembers).filter(Boolean).length;
                const computedAmount = isChecked && checkedCount > 0 ? (Number(amount || 0) / checkedCount).toFixed(2) : '0.00';
                const percentage = isChecked && checkedCount > 0 ? (100 / checkedCount).toFixed(2) : '0.00';
                
                return (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                    <label className="flex items-center gap-4 text-sm text-gray-800 font-medium cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        className="accent-primary rounded-sm w-4 h-4 cursor-pointer"
                        checked={isChecked}
                        onChange={(e) => setCheckedMembers({...checkedMembers, [m.id]: e.target.checked})}
                      />
                      <div className="flex items-center gap-3">
                        <img src={`https://i.pravatar.cc/150?u=${m.id}`} alt={m.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                        <span>{m.name} {m.id === currentUserId && <span className="text-gray-400 font-normal">(You)</span>}</span>
                      </div>
                    </label>
                    <div className="text-right">
                      <div className="text-sm text-gray-900 font-semibold">₹{computedAmount}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOM SPLIT UI */}
        {splitType === 'custom' && (
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-100/50">
              <span className="text-sm font-semibold text-gray-700">Ratio</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Custom Share</span>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map((m) => {
                return (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img src={`https://i.pravatar.cc/150?u=${m.id}`} alt={m.name} className="w-8 h-8 rounded-full bg-gray-200 object-cover flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800 truncate">{m.name} {m.id === currentUserId && <span className="text-gray-400 font-normal">(You)</span>}</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customRatios[m.id] !== undefined ? customRatios[m.id] : ''}
                      onChange={(e) => handleRatioChange(m.id, e.target.value)}
                      className="w-16 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                        className="w-24 rounded border border-gray-200 bg-white pl-6 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-ink text-white font-bold uppercase tracking-widest py-4 hover:bg-ink/90 disabled:opacity-60 transition-colors shadow-md"
      >
        {saving ? 'Saving…' : 'ADD TO THE LEDGER'}
      </button>
    </form>
  );
}
