import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { FUEL_PRICES, FUEL_LABELS } from '../constants';
import { Trash2, Droplet, Zap, Info, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export const Fuel: React.FC = () => {
  const { fuelLogs, addFuelLog, removeFuelLog, settings } = useData();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<keyof typeof FUEL_PRICES>('91');
  const [amount, setAmount] = useState('');
  const [km, setKm] = useState('');
  
  // Report View State
  const [reportMode, setReportMode] = useState<'week' | 'month'>('month');
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Load preferred fuel type from settings on mount
  useEffect(() => {
      if (settings.preferredFuelType) {
          setType(settings.preferredFuelType);
      }
  }, [settings.preferredFuelType]);

  const handleNavigate = (direction: 'prev' | 'next') => {
      const newDate = new Date(referenceDate);
      if (reportMode === 'week') {
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else {
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      }
      setReferenceDate(newDate);
  };

  // --- REPORT LOGIC ---
  const reportStats = useMemo(() => {
      // Use referenceDate instead of new Date()
      const now = new Date(referenceDate);
      let start = new Date(now);
      let end = new Date(now);

      if (reportMode === 'week') {
          // Calculate Sunday
          const currentDay = now.getDay(); 
          const diffToSunday = now.getDate() - currentDay; 
          
          start.setDate(diffToSunday);
          start.setHours(0, 0, 0, 0);
          
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);

      } else {
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          
          end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
      }

      const logs = fuelLogs.filter(l => {
          const d = new Date(l.date);
          return d >= start && d <= end;
      });

      const totalCost = logs.reduce((s, l) => s + l.amount, 0);
      const totalLiters = logs.reduce((s, l) => s + l.liters, 0);
      
      let efficiency = null;
      if (logs.length > 0) {
        const withKm = logs.filter(l => l.km > 0).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (withKm.length > 1) {
            const dist = withKm[withKm.length - 1].km - withKm[0].km;
            if (dist > 0 && totalLiters > 0) {
                 efficiency = (dist / totalLiters).toFixed(1);
            }
        }
      }

      return { totalCost, totalLiters, count: logs.length, efficiency, start, end };
  }, [fuelLogs, reportMode, referenceDate]);


  const handleSubmit = () => {
    if (!amount) return;
    const price = FUEL_PRICES[type];
    const cost = parseFloat(amount);
    const liters = parseFloat((cost / price).toFixed(2));
    
    addFuelLog({
        date: new Date(date).toISOString(),
        fuelType: type,
        amount: cost,
        liters,
        km: parseFloat(km) || 0
    });
    
    setAmount('');
    setKm('');
  };

  return (
    <div className="p-6 pb-24">
        <h1 className="text-2xl font-black text-stc-purple mb-6">مصروفات الوقود</h1>

        {/* Input Form */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 max-w-lg mx-auto w-full">
            <h3 className="font-bold text-gray-800 mb-4">تسجيل تعبئة جديدة</h3>
            <div className="flex flex-col gap-4">
                {/* Date Input */}
                <div className="relative w-full">
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none font-bold text-gray-600 appearance-none shadow-sm"
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>

                {/* Fuel Type & Amount Row */}
                <div className="flex gap-3 w-full">
                    <div className="relative w-1/2">
                        <select 
                            value={type} 
                            onChange={e => setType(e.target.value as any)}
                            className="w-full h-12 pl-4 pr-10 bg-gray-50 rounded-xl border-none outline-none font-bold text-gray-600 appearance-none shadow-sm text-sm sm:text-base"
                        >
                            <option value="91">91 (أخضر)</option>
                            <option value="95">95 (أحمر)</option>
                            <option value="diesel">ديزل</option>
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    
                    <div className="w-1/2">
                        <input 
                            type="number" 
                            placeholder="المبلغ"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none font-bold text-center placeholder-gray-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* KM Input */}
                <input 
                    type="number" 
                    placeholder="عداد المسافة (اختياري)"
                    value={km}
                    onChange={e => setKm(e.target.value)}
                    className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none font-bold text-center placeholder-gray-400 shadow-sm"
                />

                {/* Submit Button */}
                <button 
                    onClick={handleSubmit}
                    className="w-full h-12 bg-stc-purple text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-stc-dark transition-colors flex items-center justify-center gap-2 mt-2"
                >
                    <Zap size={18} fill="currentColor" />
                    <span>حفظ التعبئة</span>
                </button>
            </div>
        </div>

        {/* Smart Report Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-3xl shadow-lg mb-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
             
             {/* Header with toggle */}
             <div className="flex justify-between items-center mb-6 relative z-10 border-b border-white/10 pb-3">
                 <div className="flex items-center gap-2">
                    <Zap className="text-yellow-400" size={20} fill="currentColor" />
                    <span className="font-bold text-lg">تقرير الاستهلاك</span>
                 </div>
                 <div className="flex bg-white/10 rounded-lg p-0.5">
                     <button 
                        onClick={() => setReportMode('week')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${reportMode === 'week' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
                     >
                         أسبوعي
                     </button>
                     <button 
                        onClick={() => setReportMode('month')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${reportMode === 'month' ? 'bg-white text-gray-900' : 'text-gray-400'}`}
                     >
                         شهري
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-6 relative z-10">
                 <div>
                     <div className="text-gray-400 text-xs font-bold mb-1">المدفوعات ({reportMode === 'week' ? 'الأسبوع' : 'الشهر'})</div>
                     <div className="text-3xl font-black text-white">{reportStats.totalCost} <span className="text-sm font-normal opacity-70">ريال</span></div>
                 </div>
                 <div>
                     <div className="text-gray-400 text-xs font-bold mb-1 flex items-center gap-1">
                         استهلاك اللترات
                         <Info size={10} className="text-blue-400" />
                     </div>
                     <div className="text-3xl font-black text-blue-400">{reportStats.totalLiters.toFixed(1)} <span className="text-sm font-normal text-white/70">لتر</span></div>
                 </div>
             </div>
             
             <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 relative z-10">
                 <div className="flex justify-between items-center text-xs font-medium text-gray-300 bg-white/10 px-3 py-2 rounded-lg">
                     <button onClick={() => handleNavigate('prev')} className="hover:bg-white/20 p-1 rounded"><ChevronRight size={14}/></button>
                     <div className="flex items-center gap-2">
                         <span>{reportStats.start.toLocaleDateString('ar-SA', {day:'numeric', month:'numeric'})}</span>
                         <span className="opacity-50">إلى</span>
                         <span>{reportStats.end.toLocaleDateString('ar-SA', {day:'numeric', month:'numeric'})}</span>
                     </div>
                     <button onClick={() => handleNavigate('next')} className="hover:bg-white/20 p-1 rounded"><ChevronLeft size={14}/></button>
                 </div>
                 
                 {reportStats.efficiency && (
                     <div className="flex justify-between items-center mt-1">
                         <div className="text-[10px] text-gray-400">معدل الاستهلاك (Efficiency)</div>
                         <div className="font-bold text-emerald-400">{reportStats.efficiency} كم/لتر</div>
                     </div>
                 )}
             </div>
        </div>

        <h3 className="font-bold text-stc-purple mb-4">سجل الفواتير</h3>
        <div className="space-y-3">
            {fuelLogs.length === 0 && <p className="text-center text-gray-400 py-4">لا يوجد سجلات</p>}
            {fuelLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                            <Droplet size={18} fill="currentColor" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-800">{FUEL_LABELS[log.fuelType]} ({log.amount} ريال)</div>
                            <div className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="font-black text-stc-purple">{log.liters} لتر</div>
                        {log.km > 0 && <div className="text-[10px] text-gray-400">{log.km} كم</div>}
                    </div>
                    <button onClick={() => removeFuelLog(log.id)} className="text-red-300 hover:text-red-500 mr-2">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};