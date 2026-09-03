'use client';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded-xl ${className}`}
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
          className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded-md w-1/3" />
              <div className="h-3 bg-gray-100 rounded-md w-1/4" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
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
          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 animate-pulse"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-gray-200 rounded-md w-2/5" />
              <div className="h-2.5 bg-gray-100 rounded-md w-3/5" />
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded-md w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Group Details Page
export function GroupDetailSkeleton() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col font-body animate-pulse">
      {/* Header Skeleton */}
      <div className="w-full h-16 px-4 flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-gray-200 rounded-md w-32" />
            <div className="h-2.5 bg-gray-100 rounded-md w-20" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
      </div>

      {/* Transaction List Skeleton */}
      <div className="flex-1 w-full bg-white p-4 space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-100 rounded w-28" />
        </div>
        <TransactionSkeleton count={6} />
      </div>
    </div>
  );
}

// Skeleton for Profile Page
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="bg-white p-6 sm:p-8 border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-gray-200 rounded-lg w-40" />
            <div className="h-4 bg-gray-100 rounded-lg w-52" />
          </div>
        </div>
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-36" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-100 rounded w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for Group Report
export function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-green-50 p-4 space-y-4 font-body animate-pulse">
      <div className="h-14 bg-white rounded-xl border border-gray-100 p-4 flex items-center">
        <div className="h-4 bg-gray-200 rounded w-36" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
      
      {/* Pie Chart Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center gap-4">
        <div className="w-40 h-40 rounded-full bg-gray-200" />
        <div className="flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>

      {/* Breakdown Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-10 bg-gray-50 rounded-lg" />
        <div className="h-10 bg-gray-50 rounded-lg" />
        <div className="h-10 bg-gray-50 rounded-lg" />
      </div>
    </div>
  );
}

// Skeleton for Join Invite Page
export function JoinSkeleton() {
  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-6 animate-pulse">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full space-y-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto" />
        <div className="h-6 bg-gray-200 rounded-lg w-3/4 mx-auto" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/2 mx-auto" />
        <div className="h-12 bg-gray-200 rounded-xl w-full mt-4" />
      </div>
    </main>
  );
}
