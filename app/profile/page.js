'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../lib/firebaseApi';
import TopHeader from '../../components/TopHeader';
import { ProfileSkeleton } from '../../components/Skeleton';
import { LogOut, Edit2, Save, X, Camera, Shield, Smartphone, QrCode, User } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  
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
      setCurrentUser(user);
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

  const avatarUrl = profile?.avatar_url || currentUser?.photoURL;

  async function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await api.logout();
        router.push('/login');
      } catch (err) {
        alert(err.message);
      }
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F4FBF7] min-h-screen">
      <TopHeader title="My Profile" userName={profile?.name || currentUser?.displayName || currentUser?.email} />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">Account Settings</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Manage personal info, UPI payment details & preferences
            </p>
          </div>

          {!isEditing && profile && (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-2xl bg-white border border-[#E2EFE9] text-xs font-bold text-[#145C4B] hover:bg-[#F0F7F4] transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>

        {error && <p className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-4 rounded-2xl">{error}</p>}

        {profile === null ? (
          <ProfileSkeleton />
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-[#E2EFE9] rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-[#E2EFE9]">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-3xl bg-[#F0F7F4] text-[#145C4B] font-extrabold text-4xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md relative">
                    {avatarUrl && !imgError ? (
                      <img
                        src={avatarUrl}
                        alt={profile.name || 'Profile'}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      profile.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'
                    )}
                    
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing && !uploadingImage && (
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow border border-[#E2EFE9] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all z-20 text-gray-600">
                      <Camera className="w-4 h-4" />
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

                <div className="text-center sm:text-left space-y-1">
                  <h3 className="font-extrabold text-2xl text-gray-900">{profile.name}</h3>
                  <p className="text-sm font-medium text-gray-500">{profile.email}</p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#145C4B]/10 text-[#145C4B] text-xs font-bold">
                      <Shield className="w-3.5 h-3.5" /> Verified User
                    </span>
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] text-sm text-gray-900 font-bold focus:outline-none focus:border-[#145C4B] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">UPI ID (For Quick Settle)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9876543210@upi"
                        value={editForm.upi_id} 
                        onChange={e => setEditForm({...editForm, upi_id: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] text-sm text-gray-900 font-bold focus:outline-none focus:border-[#145C4B] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Phone Number</label>
                      <input 
                        type="text" 
                        value={editForm.phone} 
                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] text-sm text-gray-900 font-bold focus:outline-none focus:border-[#145C4B] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Gender</label>
                      <select 
                        value={editForm.gender}
                        onChange={e => setEditForm({...editForm, gender: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] text-sm text-gray-900 font-bold focus:outline-none focus:border-[#145C4B] focus:bg-white transition-all"
                      >
                        <option value="">Select gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
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
                      className="flex-1 py-3 rounded-2xl font-bold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-3 rounded-2xl font-bold text-xs text-white bg-[#145C4B] hover:bg-[#0E382F] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#F0F7F4] border border-[#E2EFE9] rounded-2xl p-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">UPI ID</label>
                    <p className="text-sm font-bold text-gray-900 font-mono">
                      {profile.upi_id || <span className="text-gray-400 italic font-sans text-xs">Not configured yet</span>}
                    </p>
                  </div>
                  <div className="bg-[#F0F7F4] border border-[#E2EFE9] rounded-2xl p-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</label>
                    <p className="text-sm font-bold text-gray-900">
                      {profile.phone || <span className="text-gray-400 italic text-xs">Not added</span>}
                    </p>
                  </div>
                  <div className="bg-[#F0F7F4] border border-[#E2EFE9] rounded-2xl p-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Gender</label>
                    <p className="text-sm font-bold text-gray-900">
                      {profile.gender || <span className="text-gray-400 italic text-xs">Not set</span>}
                    </p>
                  </div>
                  <div className="bg-[#F0F7F4] border border-[#E2EFE9] rounded-2xl p-4">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Member Since</label>
                    <p className="text-sm font-bold text-gray-900">
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
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

