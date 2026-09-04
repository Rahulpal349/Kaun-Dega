'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/firebaseApi';
import { X, Check, Plane, Home, Heart, List, Mail, User, Plus, Info } from 'lucide-react';

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
      const value = currentParticipant.trim();
      if (!participants.includes(value)) {
        setParticipants([...participants, value]);
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

    // Append any unadded participant left in input box
    let finalParticipants = [...participants];
    if (currentParticipant.trim() && !finalParticipants.includes(currentParticipant.trim())) {
      finalParticipants.push(currentParticipant.trim());
    }

    if (!name.trim()) {
      setError('Give your group a name.');
      return;
    }

    setSaving(true);
    try {
      const iconUrl = type.icon;
      const group = await api.createGroup({
        name: name.trim(),
        emoji: type.icon,
        groupType: type.id,
        icon: iconUrl,
        memberEmails: finalParticipants,
      });
      router.push(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  }

  const isEmailInput = currentParticipant.trim().includes('@');

  return (
    <main className="min-h-screen bg-green-50 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="flex justify-end mb-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-green-50 transition-colors shadow-sm"
          >
            <X size={20} className="text-gray-500" />
          </Link>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          {/* Header section of the modal */}
          <div className="p-8 pb-6 border-b border-gray-100 bg-white">
            <h1 className="font-display font-bold text-3xl text-gray-900 leading-tight mb-2">New Group</h1>
            <p className="font-medium text-gray-500">Create a ledger and invite friends by name or email.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 min-h-[400px]">
            {/* Group Identity */}
            <div className="flex gap-4">
              <div className="w-16 h-16 border border-gray-200 rounded-xl flex items-center justify-center bg-[#145C4B]/5 shrink-0 transition-colors">
                {(() => {
                  const TypeIcon = type.Icon;
                  return <TypeIcon size={28} className="text-[#145C4B]" />;
                })()}
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

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-400">
                  Participants
                </label>
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <Mail size={12} /> Add by Email or Name
                </span>
              </div>

              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    value={currentParticipant}
                    onChange={(e) => setCurrentParticipant(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddParticipant();
                      }
                    }}
                    placeholder="e.g. Rahul, friend@gmail.com"
                    className="w-full rounded-xl border border-gray-200 bg-white pl-4 pr-10 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-gray-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isEmailInput ? <Mail size={18} className="text-primary" /> : <User size={18} />}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="px-5 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {isEmailInput && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                  <Mail size={14} className="shrink-0" />
                  Email detected! An invite notification will be sent automatically.
                </p>
              )}

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {participants.map((p, idx) => {
                    const isEmail = p.includes('@');
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          isEmail
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        }`}
                      >
                        {isEmail ? <Mail size={13} className="text-emerald-600" /> : <User size={13} className="text-gray-500" />}
                        <span>{p}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                          title="Remove participant"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Info size={12} className="shrink-0" />
                Adding email addresses automatically links this ledger to your friends' accounts when they log in.
              </p>
            </div>

            {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 border border-red-100 rounded-lg">{error}</p>}

            <div className="pt-4">
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
