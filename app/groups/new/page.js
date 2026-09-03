'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/firebaseApi';
import { X, Check, Plane, Home, Heart, List, Camera } from 'lucide-react';

const GROUP_TYPES = [
  { id: 'trip', icon: 'trip', label: 'Trip', Icon: Plane },
  { id: 'home', icon: 'home', label: 'Home', Icon: Home },
  { id: 'couple', icon: 'couple', label: 'Couple', Icon: Heart },
  { id: 'other', icon: 'other', label: 'Other', Icon: List },
];

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState(GROUP_TYPES[0]);
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
      const group = await api.createGroup({ name: name.trim(), emoji: type.icon, groupType: type.id, icon: type.icon, memberEmails });
      router.push(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="flex justify-end mb-4">
          <Link href="/dashboard" className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-green-50 transition-colors shadow-sm">
            <X size={20} className="text-gray-500" />
          </Link>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          {/* Header section of the modal */}
          <div className="p-8 pb-6 border-b border-gray-100 bg-white">
            <h1 className="font-display font-bold text-3xl text-gray-900 leading-tight mb-2">New Group</h1>
            <p className="font-medium text-gray-500">Who's paying this time?</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 min-h-[400px]">
            {/* Group Identity */}
            <div className="flex gap-4">
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 text-gray-400 shrink-0 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors">
                <Camera size={24} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Group name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Goa Trip"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
                  autoFocus
                />
              </div>
            </div>

            {/* Group Type */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                Type
              </label>
              <div className="flex flex-wrap gap-3">
                {GROUP_TYPES.map((t) => {
                  const isSelected = type.id === t.id;
                  const TypeIcon = t.Icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-green-50'
                      }`}
                    >
                      <TypeIcon size={16} className={isSelected ? 'text-white' : 'text-[#145C4B]'} />
                      <span>{t.label}</span>
                      {isSelected && <Check size={14} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Members */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
                Participants <span className="normal-case tracking-normal font-medium text-gray-400">(Add names or emails)</span>
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
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Add
                </button>
              </div>

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-green-50 border border-gray-200 px-3 py-1.5 rounded-full">
                      <span className="text-sm font-medium text-gray-700">{p}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveParticipant(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>



            {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 border border-red-100 rounded-lg">{error}</p>}

            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-sm py-4 hover:bg-primary/90 disabled:opacity-60 shadow-md transition-colors flex justify-center items-center gap-2"
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
