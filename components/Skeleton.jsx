'use client';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`skeleton-shimmer animate-pulse rounded-xl ${className}`}
    />
  );
}

// Skeleton for Group Cards on Dashboard and Groups list
export function GroupCardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E2EFE9] rounded-[24px] p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-md bg-[#F0F7F4]" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md bg-[#F0F7F4]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for History and Expense Transactions
export function TransactionSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E2EFE9] rounded-[20px] p-4 shadow-sm flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-3 w-36 rounded-md bg-[#F0F7F4]" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-3 w-10 rounded-md bg-[#F0F7F4]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full Dashboard Skeleton Loader
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Hero Net Balance Card Skeleton */}
      <div className="bg-gradient-to-br from-[#145C4B] to-[#0E382F] rounded-[28px] p-6 text-white shadow-xl space-y-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-md bg-white/20" />
            <Skeleton className="h-8 w-40 rounded-xl bg-white/30" />
          </div>
          <Skeleton className="w-10 h-10 rounded-2xl bg-white/20 shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div className="bg-white/10 rounded-2xl p-3 space-y-1.5 backdrop-blur-sm">
            <Skeleton className="h-3 w-16 rounded bg-white/20" />
            <Skeleton className="h-5 w-24 rounded-lg bg-white/30" />
          </div>
          <div className="bg-white/10 rounded-2xl p-3 space-y-1.5 backdrop-blur-sm">
            <Skeleton className="h-3 w-16 rounded bg-white/20" />
            <Skeleton className="h-5 w-24 rounded-lg bg-white/30" />
          </div>
        </div>
      </div>

      {/* Tabs Pill Skeleton */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-[#E2EFE9] rounded-2xl">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl bg-[#F0F7F4]" />
        <Skeleton className="h-10 flex-1 rounded-xl bg-[#F0F7F4]" />
      </div>

      {/* Group Cards Skeleton List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md bg-[#F0F7F4]" />
        </div>
        <GroupCardSkeleton count={4} />
      </div>
    </div>
  );
}

// Skeleton for Group Details Page
export function GroupDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col font-body">
      {/* Header Bar Skeleton */}
      <div className="w-full h-16 px-4 flex items-center justify-between bg-white border-b border-[#E2EFE9]">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-md bg-[#F0F7F4]" />
          </div>
        </div>
        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
      </div>

      {/* Content Area Skeleton */}
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Tab Toggle Skeleton */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-[#E2EFE9]">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl bg-[#F0F7F4]" />
        </div>

        {/* Expenses List Skeleton */}
        <div className="bg-white rounded-[28px] border border-[#E2EFE9] p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-[#E2EFE9]">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-xl bg-[#F0F7F4]" />
          </div>
          <TransactionSkeleton count={5} />
        </div>
      </div>
    </div>
  );
}

// Skeleton for Balance Board
export function BalanceBoardSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-[#E2EFE9] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <Skeleton className="h-2 w-full rounded-full bg-[#F0F7F4]" />
          </div>
        ))}
      </div>
      <div className="bg-[#F0F7F4] border border-[#E2EFE9] rounded-2xl p-4 space-y-3">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Skeleton for Profile Page
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      <div className="bg-white p-6 sm:p-8 border border-[#E2EFE9] rounded-[28px] shadow-sm space-y-6">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />
          <div className="space-y-2.5 flex-1 min-w-0">
            <Skeleton className="h-6 w-44 rounded-xl" />
            <Skeleton className="h-4 w-56 rounded-lg bg-[#F0F7F4]" />
          </div>
        </div>
        <div className="space-y-4 pt-6 border-t border-[#E2EFE9]">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded bg-[#F0F7F4]" />
            <Skeleton className="h-5 w-40 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded bg-[#F0F7F4]" />
            <Skeleton className="h-5 w-48 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded bg-[#F0F7F4]" />
            <Skeleton className="h-5 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for Group Report
export function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4FBF7] p-4 sm:p-6 space-y-5 max-w-3xl mx-auto font-body">
      <div className="h-14 bg-white rounded-2xl border border-[#E2EFE9] p-4 flex items-center justify-between">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-xl bg-[#F0F7F4]" />
      </div>
      
      {/* Pie Chart Card Skeleton */}
      <div className="bg-white rounded-[28px] border border-[#E2EFE9] p-6 flex flex-col items-center gap-4 shadow-sm">
        <Skeleton className="w-44 h-44 rounded-full" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md bg-[#F0F7F4]" />
        </div>
      </div>

      {/* Breakdown Card Skeleton */}
      <div className="bg-white rounded-[28px] border border-[#E2EFE9] p-5 space-y-3.5 shadow-sm">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// Skeleton for Join Invite Page
export function JoinSkeleton() {
  return (
    <main className="min-h-screen bg-[#F4FBF7] flex items-center justify-center p-6 font-body">
      <div className="bg-white rounded-[32px] shadow-xl border border-[#E2EFE9] p-8 text-center max-w-sm w-full space-y-5">
        <Skeleton className="w-20 h-20 rounded-full mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-1/2 rounded-lg mx-auto bg-[#F0F7F4]" />
        </div>
        <Skeleton className="h-13 w-full rounded-2xl mt-4" />
      </div>
    </main>
  );
}

