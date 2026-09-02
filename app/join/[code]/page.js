'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../archive/deprecated-utils/supabaseClient';
import { api } from '../../../archive/deprecated-utils/api';
import { Users, LogIn, CheckCircle2, Loader2, AlertCircle, Clock, Shield } from 'lucide-react';

export default function JoinGroupPage() {
  const { code } = useParams();
  const router = useRouter();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determine if this is a new secure token (long) or legacy 6-char code
  const isSecureToken = code && code.length > 6;

  useEffect(() => {
    (async () => {
      // Check if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Save the invite code/token and redirect to login
        localStorage.setItem('pending_invite_code', code);
        router.push('/login');
        return;
      }

      try {
        if (isSecureToken) {
          // New secure token flow
          const info = await api.getInviteInfo(code);
          if (!info.valid) {
            setError(info.error || 'This invite link is invalid.');
          } else {
            setInviteInfo(info);
          }
        } else {
          // Legacy 6-char code flow
          const groupData = await api.getGroupByInviteCode(code);
          setInviteInfo({
            valid: true,
            groupId: groupData.id,
            groupName: groupData.name,
            groupEmoji: groupData.emoji,
            invitedBy: null,
            memberCount: null,
            isAlreadyMember: false,
          });
        }
      } catch (err) {
        setError(err.message || 'This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [code, router, isSecureToken]);

  async function handleJoin() {
    setJoining(true);
    setError('');
    try {
      let result;
      if (isSecureToken) {
        // New secure token flow
        result = await api.joinGroupByToken(code);
        if (result.alreadyMember) {
          setSuccess('You are already a member!');
        } else {
          setSuccess(result.message || 'You joined the group!');
        }
        setTimeout(() => {
          router.push(`/groups/${result.groupId}`);
        }, 1200);
      } else {
        // Legacy code flow
        result = await api.joinGroupByCode(code);
        if (result.alreadyMember) {
          setSuccess('You are already a member!');
        } else {
          setSuccess('You joined the group!');
        }
        setTimeout(() => {
          router.push(`/groups/${result.group.id}`);
        }, 1200);
      }
    } catch (err) {
      setError(err.message);
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
          <span className="text-4xl">{inviteInfo?.groupEmoji || '🧾'}</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {inviteInfo?.groupName}
        </h1>
        
        {inviteInfo?.invitedBy && (
          <p className="text-gray-500 text-sm mb-1">
            Invited by <span className="font-semibold text-gray-700">{inviteInfo.invitedBy}</span>
          </p>
        )}

        {inviteInfo?.memberCount && (
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

        {isSecureToken && inviteInfo?.expiresAt && (
          <div className="flex items-center justify-center gap-1 text-gray-300 text-xs mt-6">
            <Clock size={12} />
            <span>Expires {new Date(inviteInfo.expiresAt).toLocaleDateString()}</span>
          </div>
        )}

        {!isSecureToken && (
          <p className="text-gray-300 text-xs mt-6">
            Invite code: <span className="font-mono font-bold text-gray-400">{code?.toUpperCase()}</span>
          </p>
        )}
      </div>
    </main>
  );
}
