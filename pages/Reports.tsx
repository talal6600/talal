import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { SIM_LABELS } from '../constants';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Transaction } from '../types';

type ViewMode = 'day' | 'week' | 'month';

export const Reports: React.FC = () => {
  const { transactions } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());

  // --- Date Helpers ---

  // Reset time to 00:00:00 for accurate comparison
  const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // Get range based on view mode
  const getDateRange = () => {
    const start = stripTime(new Date(referenceDate));
    const end = stripTime(new Date(referenceDate));

    if (viewMode === 'day') {
        // Start and end are the same
        end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
        // Logic: Start Sunday, End Saturday
        const day = start.getDay(); // 0 is Sunday
        const diff = start.getDate() - day; 
        start.setDate(diff); // Set to Sunday
        end.setDate(diff + 6); // Set to Saturday
        end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'month') {
        start.setDate(1); // 1st of month
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // Last day of month
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const { start, end } = getDateRange();

  // --- Navigation ---
  const handleNavigate = (direction: 'prev' | 'next') => {
      const newDate = new Date(referenceDate);
      const val = direction === 'next' ? 1 : -1;
      
      if (viewMode === 'day') newDate.setDate(newDate.getDate() + val);
      else if (viewMode === 'week') newDate.setDate(newDate.getDate() + (val * 7));
      else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + val);
      
      setReferenceDate(newDate);
  };

  const getLabel = () => {
      if (viewMode === 'day') return start.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
      if (viewMode === 'month') return start.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
      return `${start.toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' })} - ${end.toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' })}`;
  };

  // --- Data Filtering ---
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= start && tDate <= end;
      });
  }, [transactions, start, end]);

  const totalSales = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalCount = filteredTransactions.reduce((acc, t) => acc + (t.quantity || 1), 0);

  // --- Chart Data Preparation ---
  const chartData = useMemo(() => {
      const data: any[] = [];
      const current = new Date(start);
      
      // Loop through each day in the range
      while (current <= end) {
          const dateStr = current.toDateString();
          const daySales = filteredTransactions
            .filter(t => new Date(t.date).toDateString() === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

          data.push({
              name: viewMode === 'month' ? current.getDate() : current.toLocaleDateString('ar-SA', { weekday: 'short' }),
              fullDate: current.toLocaleDateString('ar-SA'),
              total: daySales,
              isWeekend: current.getDay() === 5 || current.getDay() === 6 // Fri/Sat
          });
          current.setDate(current.getDate() + 1);
      }
      return data;
  }, [filteredTransactions, start, end, viewMode]);

  return (
    <div className="p-6 pb-24">
        {/* Header & Controls */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-stc-purple">التقارير</h1>
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow text-stc-purple' : 'text-gray-400'}`}>يومي</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow text-stc-purple' : 'text-gray-400'}`}>أسبوعي</button>
                <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white shadow text-stc-purple' : 'text-gray-400'}`}>شهري</button>
            </div>
        </div>

        {/* Date Navigator */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between mb-6">
            <button onClick={() => handleNavigate('prev')} className="p-2 hover:bg-gray-50 rounded-full text-stc-purple"><ChevronRight /></button>
            <div className="flex items-center gap-2 font-bold text-gray-700">
                <Calendar size={18} className="text-gray-400" />
                <span>{getLabel()}</span>
            </div>
            <button onClick={() => handleNavigate('next')} className="p-2 hover:bg-gray-50 rounded-full text-stc-purple"><ChevronLeft /></button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-stc-purple to-stc-dark p-5 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <DollarSign size={16} />
                        <span className="text-xs font-bold">إجمالي المبيعات</span>
                    </div>
                    <div className="text-3xl font-black">{totalSales} <span className="text-sm font-normal">ريال</span></div>
                </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                    <Package size={16} />
                    <span className="text-xs font-bold">عدد العمليات</span>
                </div>
                <div className="text-3xl font-black text-gray-800">{totalCount}</div>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 h-72">
             <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
                 <TrendingUp size={16} className="text-emerald-500" />
                 الأداء خلال الفترة
             </h3>
             <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 10, fill: '#9CA3AF'}} 
                        axisLine={false} 
                        tickLine={false} 
                        interval={viewMode === 'month' ? 2 : 0}
                    />
                    <YAxis tick={{fontSize: 10, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        cursor={{fill: '#f9fafb'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        labelStyle={{fontWeight: 'bold', color: '#4B5563', marginBottom: '4px'}}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isWeekend ? '#FF375E' : '#4F008C'} opacity={entry.total === 0 ? 0.2 : 1} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>

        {/* Transactions List */}
        <h3 className="font-bold text-gray-700 mb-3">تفاصيل العمليات</h3>
        <div className="space-y-3">
             {filteredTransactions.length === 0 && (
                 <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200">
                     لا يوجد بيانات في هذه الفترة
                 </div>
             )}
             {filteredTransactions.map(t => (
                 <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                     <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full`} style={{backgroundColor: t.type === 'issue' ? '#94a3b8' : '#4F008C'}}></div>
                         <div>
                            <div className="text-sm font-bold text-gray-800">{SIM_LABELS[t.type]}</div>
                            <div className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString('ar-SA', {weekday: 'long', hour: '2-digit', minute:'2-digit'})}</div>
                         </div>
                     </div>
                     <span className="font-bold text-stc-purple">{t.amount} ريال</span>
                 </div>
             ))}
        </div>
    </div>
  );
};