'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/firebaseApi';
import { X, Check, Plane, Home, Heart, List, Mail, User, Plus, Info, CheckCircle2, UserCheck, Loader2, Utensils, Sparkles, Briefcase, ShoppingBag, Film, Building, Car, Dumbbell, GraduationCap, Coffee, Gift, Tag } from 'lucide-react';

const GROUP_TYPES = [
  { id: 'food', icon: 'food', label: 'Food & Drinks', Icon: Utensils },
  { id: 'trip', icon: 'trip', label: 'Trip & Travel', Icon: Plane },
  { id: 'home', icon: 'home', label: 'Household', Icon: Home },
  { id: 'party', icon: 'party', label: 'Party & Outing', Icon: Sparkles },
  { id: 'office', icon: 'office', label: 'Work & Office', Icon: Briefcase },
  { id: 'shopping', icon: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { id: 'movies', icon: 'movies', label: 'Movies & Show', Icon: Film },
  { id: 'rent', icon: 'rent', label: 'Rent & Bills', Icon: Building },
  { id: 'fuel', icon: 'fuel', label: 'Fuel & Transport', Icon: Car },
  { id: 'fitness', icon: 'fitness', label: 'Fitness & Sports', Icon: Dumbbell },
  { id: 'education', icon: 'education', label: 'Study & Courses', Icon: GraduationCap },
  { id: 'coffee', icon: 'coffee', label: 'Coffee & Snacks', Icon: Coffee },
  { id: 'gifts', icon: 'gifts', label: 'Gifts', Icon: Gift },
  { id: 'other', icon: 'other', label: 'Other', Icon: Tag },
];

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState(GROUP_TYPES[0]);
  const [customTypes, setCustomTypes] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState('');
  const [emailCheckResult, setEmailCheckResult] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Debounced check as user types an email address
  useEffect(() => {
    const text = currentParticipant.trim();
    if (!text.includes('@') || !text.includes('.')) {
      setEmailCheckResult(null);
      return;
    }

    setEmailCheckResult({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUserByEmail(text);
        setEmailCheckResult({ checking: false, exists: res.exists, name: res.name });
      } catch (_) {
        setEmailCheckResult(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentParticipant]);

  async function checkAndCacheEmail(email) {
    if (!email.includes('@')) return;
    try {
      const res = await api.checkUserByEmail(email);
      setUserMap((prev) => ({
        ...prev,
        [email.toLowerCase().trim()]: { isRegistered: res.exists, name: res.name },
      }));
    } catch (_) {}
  }

  function handleAddParticipant() {
    if (currentParticipant.trim()) {
      const value = currentParticipant.trim();
      if (!participants.includes(value)) {
        setParticipants([...participants, value]);
        if (value.includes('@')) {
          checkAndCacheEmail(value);
        }
      }
      setCurrentParticipant('');
      setEmailCheckResult(null);
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
                Category Theme
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[...GROUP_TYPES, ...customTypes].map((t) => {
                  const isSelected = type.id === t.id;
                  const TypeIcon = t.Icon || Tag;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all w-full text-left ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TypeIcon size={16} className={isSelected ? 'text-white shrink-0' : 'text-[#145C4B] shrink-0'} />
                        <span className="truncate">{t.label}</span>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0 ml-1" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowCustomModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-primary bg-emerald-50 text-primary text-sm font-bold hover:bg-emerald-100 transition-all w-full"
                >
                  <Plus size={16} className="shrink-0" />
                  <span className="truncate">Custom Category</span>
                </button>
              </div>
            </div>

            {/* Custom Category Modal */}
            {showCustomModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Add Custom Category</h3>
                  <p className="text-xs text-gray-500 mb-4">Enter a custom theme label for your group ledger.</p>
                  <input
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="e.g. Subscriptions, Gaming, Gifts"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (customInput.trim()) {
                          const newObj = { id: customInput.trim(), icon: customInput.trim(), label: customInput.trim(), Icon: Tag };
                          setCustomTypes([...customTypes, newObj]);
                          setType(newObj);
                          setCustomInput('');
                          setShowCustomModal(false);
                        }
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-emerald-800"
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}

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

              {/* Real-time Email Verification Status Pill */}
              {isEmailInput && emailCheckResult && (
                <div className="mb-3">
                  {emailCheckResult.checking ? (
                    <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      Checking email registration status...
                    </div>
                  ) : emailCheckResult.exists ? (
                    <div className="text-xs text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3.5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm animate-fadeIn">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>
                        🟢 <strong className="text-emerald-950">Registered User:</strong> {emailCheckResult.name} — Group will instantly appear on their dashboard!
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium">
                      <Mail size={15} className="text-blue-600 shrink-0" />
                      <span>
                        📩 <strong className="text-blue-950">Pending Invite:</strong> Not registered yet. An invitation will be sent, and the group will automatically display when they sign up.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Added Participants Chips List */}
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {participants.map((p, idx) => {
                    const isEmail = p.includes('@');
                    const emailLower = p.toLowerCase().trim();
                    const info = userMap[emailLower];
                    const isRegistered = info?.isRegistered;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          isRegistered
                            ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                            : isEmail
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        }`}
                      >
                        {isRegistered ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-extrabold text-xs">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Registered
                          </span>
                        ) : isEmail ? (
                          <Mail size={13} className="text-blue-600" />
                        ) : (
                          <User size={13} className="text-gray-500" />
                        )}
                        <span>{info?.name ? `${info.name} (${p})` : p}</span>
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
                Adding registered emails attaches the ledger to their account immediately. Unregistered emails auto-link upon signup.
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
