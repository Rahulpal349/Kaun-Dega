'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import { auth, onAuthStateChanged } from '../../lib/firebase';
import { LogOut, ArrowLeft, Edit2, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    upi_id: '',
    gender: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      let active = false;
      if (firebaseUser) {
        active = true;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) active = true;
      }

      if (!active) {
        router.push('/login');
        return;
      }
      try {
        const data = await api.getProfile();
        setProfile(data);
        setEditForm({
          name: data?.name || firebaseUser?.displayName || '',
          phone: data?.phone || '',
          upi_id: data?.upi_id || '',
          gender: data?.gender || ''
        });
      } catch (err) {
        setError(err.message);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    try {
      await api.logout();
      router.push('/login');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateProfile({
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        upi_id: editForm.upi_id.trim() || null,
        gender: editForm.gender.trim() || null
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 flex flex-col pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-green-50/80 backdrop-blur-md border-b border-green-100/50">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-xl text-gray-900 tracking-tight">Your Profile</h1>
          </div>
          {!isEditing && profile && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-sm font-semibold text-[#145C4B] bg-[#e6f4ed] px-3 py-1.5 rounded-full hover:bg-[#d3ebd9] transition-colors"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

        {profile === null ? (
          <p className="text-gray-400 text-center py-20 font-medium">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center shrink-0">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-2xl text-gray-900">{profile.name}</h2>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#145C4B]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">UPI ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 9876543210@upi"
                      value={editForm.upi_id} 
                      onChange={e => setEditForm({...editForm, upi_id: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#145C4B]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={editForm.phone} 
                      onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#145C4B]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Gender</label>
                    <select 
                      value={editForm.gender}
                      onChange={e => setEditForm({...editForm, gender: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#145C4B]/30"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          name: profile.name || '',
                          phone: profile.phone || '',
                          upi_id: profile.upi_id || '',
                          gender: profile.gender || ''
                        });
                        setError('');
                      }}
                      className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-3 rounded-xl font-semibold text-white bg-[#145C4B] hover:bg-[#145C4B]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">UPI ID</label>
                    <p className="text-gray-700 font-medium">{profile.upi_id || <span className="text-gray-400 italic">Not set</span>}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</label>
                    <p className="text-gray-700 font-medium">{profile.phone || <span className="text-gray-400 italic">Not set</span>}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Gender</label>
                    <p className="text-gray-700 font-medium">{profile.gender || <span className="text-gray-400 italic">Not set</span>}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Member Since</label>
                    <p className="text-gray-700 font-medium">
                      {new Date(profile.created_at).toLocaleDateString(undefined, {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!isEditing && (
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
