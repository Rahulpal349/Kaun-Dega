'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../../lib/firebaseApi';
import GroupIcon from '../../../components/GroupIcon';
import { Users, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function JoinGroupPage() {
  const { code } = useParams();
  const router = useRouter();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        localStorage.setItem('pending_invite_code', code);
        router.push('/login');
        return;
      }

      try {
        await api.ensureUserProfile(user);
        const info = await api.getInviteInfo(code);
        setInviteInfo(info);
      } catch (err) {
        setError(err.message || 'This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [code, router]);

  async function handleJoin() {
    setJoining(true);
    setError('');
    try {
      if (inviteInfo?.isAlreadyMember) {
        setSuccess('You are already a member!');
        setTimeout(() => router.push(`/groups/${code}`), 1000);
        return;
      }
      
      await api.joinGroupByCode(code);
      setSuccess('You joined the group!');
      setTimeout(() => router.push(`/groups/${code}`), 1000);
    } catch (err) {
      setError(err.message || 'Failed to join group');
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center font-body">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-lg">Validating invite...</span>
        </div>
      </main>
    );
  }

  if (error && !inviteInfo) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center font-body px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#145C4B] text-white font-semibold py-3 rounded-xl hover:bg-[#145C4B]/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center font-body px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full">
        {/* Group Icon */}
        <div className="w-20 h-20 rounded-full bg-[#e6f4ed] text-[#145C4B] flex items-center justify-center mx-auto mb-4">
          <GroupIcon icon={inviteInfo?.groupEmoji || inviteInfo?.groupIcon} size={36} />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {inviteInfo?.groupName}
        </h1>
        
        {inviteInfo?.invitedBy && (
          <p className="text-gray-500 text-sm mb-1">
            Invited by <span className="font-semibold text-gray-700">{inviteInfo.invitedBy}</span>
          </p>
        )}

        {inviteInfo?.memberCount !== undefined && (
          <div className="flex items-center justify-center gap-1 text-gray-400 text-sm mb-4">
            <Users size={14} />
            <span>{inviteInfo.memberCount} member{inviteInfo.memberCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {!inviteInfo?.invitedBy && (
          <p className="text-gray-400 text-sm mb-6">You've been invited to join this group</p>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {inviteInfo?.isAlreadyMember ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={48} className="text-[#145C4B]" />
            <p className="text-[#145C4B] font-semibold text-lg">You're already a member!</p>
            <button
              onClick={() => router.push(`/groups/${inviteInfo.groupId}`)}
              className="w-full bg-[#145C4B] text-white font-semibold py-3 rounded-xl hover:bg-[#145C4B]/90 transition-colors mt-2"
            >
              Open Group
            </button>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 size={48} className="text-[#145C4B]" />
            <p className="text-[#145C4B] font-semibold text-lg">{success}</p>
            <p className="text-gray-400 text-sm">Redirecting...</p>
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-[#145C4B] text-white font-semibold py-3 rounded-xl hover:bg-[#145C4B]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users size={20} />
                Join Group
              </>
            )}
          </button>
        )}

      </div>
    </main>
  );
}
