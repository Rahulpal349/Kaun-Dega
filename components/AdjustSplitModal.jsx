'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function AdjustSplitModal({ members, totalAmount, currentSplitType, currentSplitData, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState(currentSplitType || 'equal');
  
  // State for each tab type
  const [equalChecked, setEqualChecked] = useState(
    members.reduce((acc, m) => ({
      ...acc,
      [m.id]: currentSplitType === 'equal' && currentSplitData ? currentSplitData[m.id] : true
    }), {})
  );

  const [exactAmounts, setExactAmounts] = useState(
    members.reduce((acc, m) => ({
      ...acc,
      [m.id]: currentSplitType === 'exact' && currentSplitData ? currentSplitData[m.id] : ''
    }), {})
  );

  const [percentages, setPercentages] = useState(
    members.reduce((acc, m) => ({
      ...acc,
      [m.id]: currentSplitType === 'percentage' && currentSplitData ? currentSplitData[m.id] : (100 / members.length).toFixed(2)
    }), {})
  );

  const [shares, setShares] = useState(
    members.reduce((acc, m) => ({
      ...acc,
      [m.id]: currentSplitType === 'shares' && currentSplitData ? currentSplitData[m.id] : 1
    }), {})
  );

  const [adjustments, setAdjustments] = useState(
    members.reduce((acc, m) => ({
      ...acc,
      [m.id]: currentSplitType === 'adjustment' && currentSplitData ? currentSplitData[m.id] : ''
    }), {})
  );

  const [lockedExacts, setLockedExacts] = useState({});
  const [lockedPercentages, setLockedPercentages] = useState({});

  // Helper to round to 2 decimals
  const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;
  const numTotal = Number(totalAmount || 0);

  const handleExactChange = (mId, val) => {
    const newLocked = { ...lockedExacts };
    if (val === '') {
      delete newLocked[mId];
    } else {
      newLocked[mId] = true;
    }
    setLockedExacts(newLocked);
    
    let newExacts = { ...exactAmounts, [mId]: val };
    const lockedSum = Object.keys(newLocked).reduce((sum, id) => sum + Number(newExacts[id] || 0), 0);
    const remaining = numTotal - lockedSum;
    
    const unlockedMembers = members.filter(m => !newLocked[m.id]);
    if (unlockedMembers.length > 0) {
      const split = remaining / unlockedMembers.length;
      unlockedMembers.forEach(m => {
        newExacts[m.id] = split > 0 ? split.toFixed(2) : '';
      });
    }
    setExactAmounts(newExacts);
  };

  const handlePercentageChange = (mId, val) => {
    const newLocked = { ...lockedPercentages };
    if (val === '') {
      delete newLocked[mId];
    } else {
      newLocked[mId] = true;
    }
    setLockedPercentages(newLocked);
    
    let newPercents = { ...percentages, [mId]: val };
    const lockedSum = Object.keys(newLocked).reduce((sum, id) => sum + Number(newPercents[id] || 0), 0);
    const remaining = 100 - lockedSum;
    
    const unlockedMembers = members.filter(m => !newLocked[m.id]);
    if (unlockedMembers.length > 0) {
      const split = remaining / unlockedMembers.length;
      unlockedMembers.forEach(m => {
        newPercents[m.id] = split > 0 ? split.toFixed(2) : '';
      });
    }
    setPercentages(newPercents);
  };

  // Computations
  let computedShares = [];
  let isValid = true;
  let validationMessage = '';
  let subText = '';

  if (activeTab === 'equal') {
    const selectedCount = Object.values(equalChecked).filter(Boolean).length;
    if (selectedCount === 0) {
      isValid = false;
      validationMessage = 'Select at least one person';
    } else {
      const splitAmount = round2(numTotal / selectedCount);
      let remainder = round2(numTotal - (splitAmount * selectedCount));
      let firstAssigned = false;
      computedShares = members.map(m => {
        if (!equalChecked[m.id]) return { userId: m.id, amount: 0 };
        let amt = splitAmount;
        if (!firstAssigned) {
          amt = round2(amt + remainder);
          firstAssigned = true;
        }
        return { userId: m.id, amount: amt };
      });
      subText = `₹${splitAmount.toFixed(2)}/person (${selectedCount} people)`;
    }
  } else if (activeTab === 'exact') {
    const sum = Object.values(exactAmounts).reduce((acc, val) => acc + Number(val || 0), 0);
    const left = round2(numTotal - sum);
    subText = `₹${left.toFixed(2)} of ₹${numTotal.toFixed(2)} left`;
    if (Math.abs(left) > 0.01) {
      isValid = false;
    }
    computedShares = members.map(m => ({ userId: m.id, amount: Number(exactAmounts[m.id] || 0) }));
  } else if (activeTab === 'percentage') {
    const sum = Object.values(percentages).reduce((acc, val) => acc + Number(val || 0), 0);
    subText = `${round2(sum).toFixed(2)}% of 100%`;
    if (Math.abs(sum - 100) > 0.01) {
      isValid = false;
    }
    
    // Compute amounts based on percentages
    let currentSum = 0;
    computedShares = members.map((m, idx) => {
      if (idx === members.length - 1) {
        // give remainder to last person
        return { userId: m.id, amount: round2(numTotal - currentSum) };
      }
      const amt = round2((Number(percentages[m.id] || 0) / 100) * numTotal);
      currentSum += amt;
      return { userId: m.id, amount: amt };
    });
  } else if (activeTab === 'shares') {
    const totalShares = Object.values(shares).reduce((acc, val) => acc + Number(val || 0), 0);
    subText = `Total shares: ${totalShares}`;
    if (totalShares <= 0) {
      isValid = false;
      validationMessage = 'Total shares must be > 0';
    } else {
      let currentSum = 0;
      computedShares = members.map((m, idx) => {
        if (idx === members.length - 1) {
          return { userId: m.id, amount: round2(numTotal - currentSum) };
        }
        const amt = round2((Number(shares[m.id] || 0) / totalShares) * numTotal);
        currentSum += amt;
        return { userId: m.id, amount: amt };
      });
    }
  } else if (activeTab === 'adjustment') {
    const sumAdj = Object.values(adjustments).reduce((acc, val) => acc + Number(val || 0), 0);
    const remainingToSplit = numTotal - sumAdj;
    
    if (remainingToSplit < 0) {
      isValid = false;
      subText = 'Adjustments exceed total amount';
    } else {
      const splitAmount = round2(remainingToSplit / members.length);
      let remainder = round2(remainingToSplit - (splitAmount * members.length));
      subText = `₹${splitAmount.toFixed(2)}/person + adjustments`;
      
      computedShares = members.map((m, idx) => {
        let base = splitAmount;
        if (idx === 0) base = round2(base + remainder);
        return { userId: m.id, amount: round2(base + Number(adjustments[m.id] || 0)) };
      });
    }
  }

  function handleSave() {
    if (!isValid) return;
    
    let splitData = {};
    if (activeTab === 'equal') splitData = equalChecked;
    else if (activeTab === 'exact') splitData = exactAmounts;
    else if (activeTab === 'percentage') splitData = percentages;
    else if (activeTab === 'shares') splitData = shares;
    else if (activeTab === 'adjustment') splitData = adjustments;

    const finalShares = computedShares.filter(s => s.amount > 0);
    onSave(activeTab, splitData, finalShares);
  }

  const tabs = [
    { id: 'equal', label: '=', title: 'Equally' },
    { id: 'exact', label: '1.23', title: 'Unequally' },
    { id: 'percentage', label: '%', title: 'Percentages' },
    { id: 'adjustment', label: '+/-', title: 'Adjustment' },
  ];

  return (
    <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-slide-up">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-gray-50 border-b border-gray-200">
        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
          <X size={24} />
        </button>
        <h2 className="font-bold text-lg text-gray-800">Adjust split</h2>
        <button type="button" onClick={handleSave} disabled={!isValid} className={`p-1.5 rounded-full transition-colors ${isValid ? 'bg-[#145C4B] text-white hover:bg-[#145C4B]/90 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
          <Check size={24} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 overflow-x-auto gap-2">
        {tabs.map(t => (
          <button
            type="button"
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center justify-center w-[4.5rem] h-12 rounded-xl transition-all shrink-0 border ${activeTab === t.id ? 'bg-[#145C4B] border-[#145C4B] text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            <span className={`font-bold ${t.id === 'equal' ? 'text-2xl leading-none' : 'text-sm'}`}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="px-4 py-3 bg-white text-center border-b border-gray-100">
        <h3 className="font-bold text-gray-700 mb-1">Split {tabs.find(t => t.id === activeTab).title.toLowerCase()}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 bg-white">
        {members.map(m => {
          let computedAmount = computedShares.find(s => s.userId === m.id)?.amount || 0;
          return (
            <div key={m.id} className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="font-bold text-gray-600">{m.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-semibold text-gray-800 truncate">{m.name}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {activeTab === 'equal' && (
                  <label className="flex items-center cursor-pointer p-2">
                    <input
                      type="checkbox"
                      checked={equalChecked[m.id] || false}
                      onChange={(e) => setEqualChecked({...equalChecked, [m.id]: e.target.checked})}
                      className="w-6 h-6 text-[#145C4B] rounded border-gray-300 focus:ring-[#145C4B]"
                    />
                  </label>
                )}
                {activeTab === 'exact' && (
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={exactAmounts[m.id] !== undefined ? exactAmounts[m.id] : ''}
                      onChange={(e) => handleExactChange(m.id, e.target.value)}
                      className="w-24 text-right font-bold text-gray-800 border-b border-dashed border-gray-300 focus:border-[#145C4B] focus:outline-none bg-transparent"
                    />
                  </div>
                )}
                {activeTab === 'percentage' && (
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={percentages[m.id] !== undefined ? percentages[m.id] : ''}
                      onChange={(e) => handlePercentageChange(m.id, e.target.value)}
                      className="w-16 text-right font-bold text-gray-800 border-b border-dashed border-gray-300 focus:border-[#145C4B] focus:outline-none bg-transparent"
                    />
                    <span className="text-gray-500 ml-1">%</span>
                  </div>
                )}
                {activeTab === 'adjustment' && (
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={adjustments[m.id] !== undefined ? adjustments[m.id] : ''}
                      onChange={(e) => setAdjustments({...adjustments, [m.id]: e.target.value})}
                      className="w-24 text-right font-bold text-gray-800 border-b border-dashed border-gray-300 focus:border-[#145C4B] focus:outline-none bg-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Summary */}
      <div className="absolute bottom-0 left-0 w-full bg-gray-50 border-t border-gray-200 p-6 flex flex-col justify-center items-center shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
        <span className={`font-bold text-lg ${isValid ? 'text-[#145C4B]' : 'text-red-500'}`}>
          {subText}
        </span>
        {!isValid && validationMessage && (
          <span className="text-sm text-red-500 font-medium mt-1">{validationMessage}</span>
        )}
      </div>
    </div>
  );
}
