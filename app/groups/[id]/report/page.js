'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '../../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../../../lib/firebaseApi';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const PIE_COLORS = ['#145C4B', '#42a5f5', '#ffca28', '#ab47bc', '#ef5350', '#5ce65c'];

export default function GroupReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balanceData, setBalanceData] = useState({ balances: [], moves: [] });
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showChart, setShowChart] = useState(true);
  const [showTable, setShowTable] = useState(true);
  const [showSummary, setShowSummary] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [membersData, expensesData, balances, groupData] = await Promise.all([
        api.getMembers(id),
        api.getExpenses(id),
        api.getBalances(id),
        api.getGroup(id),
      ]);
      setMembers(membersData);
      setExpenses(expensesData);
      setBalanceData(balances);
      setGroup(groupData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      await loadAll();
    });

    return () => unsubscribe();
  }, [loadAll, router]);

  if (loading) {
    return <div className="min-h-screen bg-green-50 flex items-center justify-center text-gray-400">Loading Report...</div>;
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const dateStr = group?.created_at ? new Date(group.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  // Calculate Pie Chart logic based on "Charged" amounts
  let currentAngle = 0;
  const pieData = balanceData.balances.map((b, i) => {
    const percentage = totalExpenses > 0 ? ((b.charged || 0) / totalExpenses) * 100 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + percentage;
    currentAngle = endAngle;
    return {
      ...b,
      percentage,
      startAngle,
      endAngle,
      color: PIE_COLORS[i % PIE_COLORS.length]
    };
  }).filter(b => b.percentage > 0);

  // Generate the conic-gradient string
  const gradientStops = pieData.map(d => `${d.color} ${d.startAngle}% ${d.endAngle}%`).join(', ');

  return (
    <div className="min-h-screen bg-green-50 text-gray-800 font-body pb-10">
      {/* Header */}
      <header className="bg-green-50/80 backdrop-blur-md border-b border-green-100/50 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
          <ArrowLeft size={20} strokeWidth={2.5} />
          <span className="font-bold text-lg">{group?.name}</span>
        </button>
      </header>

      <div className="w-full px-4 mt-4">
        <p className="text-xs text-gray-400 mb-4 font-medium">Created on {dateStr} · Total: <span className="text-[#145C4B] font-bold">{totalExpenses.toFixed(2)} INR</span></p>

        {/* --- PIE CHART SECTION --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-bold text-gray-900 text-[15px]">Expense Ratio</h3>
            {showChart ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>

          {showChart && (
            <div className="px-5 pb-5 flex flex-col items-center gap-5">
              {/* Pie Chart */}
              <div
                className="w-40 h-40 rounded-full shadow-inner flex-shrink-0"
                style={{ background: gradientStops ? `conic-gradient(${gradientStops})` : '#e5e7eb' }}
              ></div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                {pieData.map(d => (
                  <div key={d.id} className="flex items-center gap-1.5 text-[13px]">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></div>
                    <span className="text-gray-600">{d.name}</span>
                    <span className="font-bold text-gray-800">{d.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- EXPENSE LIST (Mobile Card Layout) --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <button
            onClick={() => setShowTable(!showTable)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-bold text-gray-900 text-[15px]">All Expenses ({expenses.length})</h3>
            {showTable ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>

          {showTable && (
            <div className="flex flex-col">
              {expenses.map((e, i) => {
                const date = new Date(e.created_at || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                let involvesText = 'Everyone';
                const shares = e.expense_shares || e.shares || [];
                if (e.split_type === 'custom' || e.splitType === 'custom') {
                  const involvedIds = shares.map(s => s.user_id || s.userId);
                  involvesText = members.filter(m => involvedIds.includes(m.id)).map(m => m.name).join(', ');
                }

                return (
                  <div key={e.id} className={`px-5 py-3 flex justify-between items-start ${i !== expenses.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex flex-col min-w-0 flex-1 mr-3">
                      <span className="text-gray-800 font-medium text-[14px] truncate">{e.description}</span>
                      <span className="text-gray-400 text-[11px] mt-0.5">
                        {e.payer?.name || 'Someone'} · {date} · {involvesText}
                      </span>
                    </div>
                    <span className="text-gray-900 font-semibold text-[14px] flex-shrink-0 whitespace-nowrap">
                      {Number(e.amount).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              {/* Total row */}
              <div className="px-5 py-3 flex justify-between items-center border-t border-gray-200 bg-gray-50">
                <span className="font-bold text-gray-600 text-[13px] uppercase tracking-widest">Total</span>
                <span className="font-bold text-[#145C4B] text-[16px]">{totalExpenses.toFixed(2)} INR</span>
              </div>
            </div>
          )}
        </div>

        {/* --- SUMMARY SECTION --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-bold text-gray-900 text-[15px]">Summary</h3>
            {showSummary ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>

          {showSummary && (
            <div className="flex flex-col">
              {balanceData.balances.map((b, i) => (
                <div key={b.id} className={`px-5 py-3 ${i !== balanceData.balances.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-800 font-semibold text-[14px]">{b.name}</span>
                    <span className={`font-bold text-[14px] ${b.amount > 0 ? 'text-[#145C4B]' : b.amount < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                      {b.amount > 0 ? '+' : ''}{b.amount.toFixed(2)} INR
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                    <span>Charged: <span className="font-semibold text-gray-500">{(b.charged || 0).toFixed(2)}</span></span>
                    <span>Paid: <span className="font-semibold text-gray-500">{(b.paid || 0).toFixed(2)}</span></span>
                    {b.settledPaid > 0 && <span>Settled: <span className="font-semibold text-gray-500">{b.settledPaid.toFixed(2)}</span></span>}
                    {b.settledReceived > 0 && <span>Received: <span className="font-semibold text-gray-500">{b.settledReceived.toFixed(2)}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
