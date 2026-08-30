'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../archive/deprecated-utils/api';
import { X, Check } from 'lucide-react';

const THEMES = [
  { id: 'food', emoji: '🍜', label: 'Food & Drinks' },
  { id: 'trip', emoji: '✈️', label: 'Trip / Travel' },
  { id: 'home', emoji: '🏠', label: 'Household' },
  { id: 'party', emoji: '🎉', label: 'Party' },
  { id: 'other', emoji: '🧾', label: 'Other' },
];

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [theme, setTheme] = useState(THEMES[0]);
  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleAddParticipant() {
    if (currentParticipant.trim()) {
      if (!participants.includes(currentParticipant.trim())) {
        setParticipants([...participants, currentParticipant.trim()]);
      }
      setCurrentParticipant('');
    }
  }

  function handleRemoveParticipant(index) {
    setParticipants(participants.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Allow pressing enter in the input to just add the participant without submitting form
    if (document.activeElement.tagName === 'INPUT' && document.activeElement.placeholder.includes('Rahul')) {
      handleAddParticipant();
      return;
    }

    if (!name.trim()) {
      setError('Give your group a name.');
      return;
    }
    setSaving(true);
    try {
      const memberEmails = participants;
      // We send the theme's emoji as the group emoji for now to remain compatible with backend
      const group = await api.createGroup({ name: name.trim(), emoji: theme.emoji, memberEmails });
      router.push(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-dotted flex flex-col items-center py-12 px-4 sm:px-6">
      
      <div className="w-full max-w-xl">
        <div className="flex justify-end mb-4">
          <Link href="/dashboard" className="w-10 h-10 bg-offwhite border border-ink/20 rounded-full flex items-center justify-center hover:bg-ink/5 transition-colors shadow-sm">
            <X size={20} className="text-ink" />
          </Link>
        </div>

        <div className="bg-offwhite border border-ink/10 shadow-[0_12px_40px_rgba(11,43,38,0.1)] rounded-xl overflow-hidden">
          {/* Header section of the modal */}
          <div className="p-8 pb-6 border-b border-ink/10 bg-white">
            <h1 className="font-display font-bold text-4xl text-ink leading-tight mb-2">New Group</h1>
            <p className="font-display italic text-ink/60 text-xl">Who's paying this time?</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-ruled p-8 space-y-10 min-h-[400px]">
            
            {/* Group Identity */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-teal mb-3">
                Group Identity <span className="text-ink/40 normal-case tracking-normal font-medium">(e.g. Chai Chums or Roommates)</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your ledger..."
                className="w-full bg-transparent border-0 border-b-2 border-dashed border-ink/20 px-0 py-2 text-2xl font-display text-ink focus:ring-0 focus:border-ink placeholder-ink/20"
                autoFocus
              />
            </div>

            {/* Members */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-teal mb-3">
                Participants <span className="text-ink/40 normal-case tracking-normal font-medium">(Add names or emails)</span>
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  value={currentParticipant}
                  onChange={(e) => setCurrentParticipant(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddParticipant();
                    }
                  }}
                  placeholder="Rahul, Aman..."
                  className="flex-1 bg-transparent border-0 border-b-2 border-dashed border-ink/20 px-0 py-2 text-lg font-body text-ink focus:ring-0 focus:border-ink placeholder-ink/20"
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="px-6 py-2 bg-ink text-white font-mono text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-ink/80 transition-colors"
                >
                  Add
                </button>
              </div>

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white border border-ink/10 px-3 py-1.5 rounded-full shadow-sm">
                      <span className="text-sm font-medium text-ink">{p}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveParticipant(idx)}
                        className="text-ink/40 hover:text-chili transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ledger Theme */}
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-teal mb-4">
                Ledger Theme
              </label>
              <div className="flex flex-wrap gap-3">
                {THEMES.map((t) => {
                  const isSelected = theme.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-body transition-all ${
                        isSelected 
                          ? 'border-ink bg-ink text-paper shadow-[2px_2px_0px_rgba(234,179,8,1)]' // marigold shadow
                          : 'border-ink/20 bg-white text-ink/70 hover:border-ink/40 hover:bg-ink/5'
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                      {isSelected && <Check size={14} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-chili text-sm font-medium bg-white p-3 border border-chili/20 rounded-md">{error}</p>}

            <div className="pt-8">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-marigold border-2 border-ink text-ink font-mono font-bold uppercase tracking-widest text-sm py-4 hover:brightness-95 disabled:opacity-60 shadow-[4px_4px_0px_rgba(11,43,38,1)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_rgba(11,43,38,1)] transition-all flex justify-center items-center gap-2"
              >
                {saving ? 'Creating Ledger...' : 'Create Ledger'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </main>
  );
}
