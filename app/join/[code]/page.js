'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../archive/deprecated-utils/supabaseClient';
import { api } from '../../../archive/deprecated-utils/api';
import { Users, LogIn, CheckCircle2, Loader2 } from 'lucide-react';

export default function JoinGroupPage() {
  const { code } = useParams();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      // Check if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Save the invite code and redirect to login
        localStorage.setItem('pending_invite_code', code);
        router.push('/login');
        return;
      }

      // Fetch group info by invite code
      try {
        const groupData = await api.getGroupByInviteCode(code);
        setGroup(groupData);
      } catch (err) {
        setError('This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [code, router]);

  async function handleJoin() {
    setJoining(true);
    setError('');
    try {
      const result = await api.joinGroupByCode(code);
      if (result.alreadyMember) {
        setSuccess('You are already a member!');
      } else {
        setSuccess('You joined the group!');
      }
      // Redirect to the group after a brief moment
      setTimeout(() => {
        router.push(`/groups/${result.group.id}`);
      }, 1200);
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
          <span className="text-lg">Loading invite...</span>
        </div>
      </main>
    );
  }

  if (error && !group) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center font-body px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✕</span>
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
          <span className="text-4xl">{group?.emoji || '🧾'}</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {group?.name}
        </h1>
        <p className="text-gray-400 text-sm mb-6">You've been invited to join this group</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {success ? (
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

        <p className="text-gray-300 text-xs mt-6">
          Invite code: <span className="font-mono font-bold text-gray-400">{code?.toUpperCase()}</span>
        </p>
      </div>
    </main>
  );
}
