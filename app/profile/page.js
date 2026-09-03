'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../lib/firebaseApi';
import { LogOut, ArrowLeft, Edit2, Save, X, Camera } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    upi_id: '',
    gender: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const data = await api.getProfile(user.uid);
        setProfile(data);
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          upi_id: data.upi_id || '',
          gender: data.gender || ''
        });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
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
        phone: editForm.phone.trim() || '',
        upi_id: editForm.upi_id.trim() || '',
        gender: editForm.gender.trim() || ''
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please choose an image under 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const base64Data = await compressImage(file);
      const updated = await api.updateProfile({ avatar_url: base64Data });
      setProfile(updated);
    } catch (err) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploadingImage(false);
      e.target.value = null;
    }
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress as JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
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
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full bg-green-100 text-[#145C4B] font-bold text-3xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm relative">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      profile.name?.charAt(0).toUpperCase() || 'U'
                    )}
                    
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && !uploadingImage && (
                    <label className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow border border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors z-20">
                      <Camera size={14} className="text-gray-600" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
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
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, {
                        month: 'long', day: 'numeric', year: 'numeric'
                      }) : 'Recently'}
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
