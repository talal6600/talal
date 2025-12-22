import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal } from '../components/Modal';
import { SIM_COLORS, SIM_LABELS } from '../constants';
import { Target, Zap, Trash2, ArrowRight, ArrowLeft, Smartphone } from 'lucide-react';
import { TransactionType } from '../types';

export const Dashboard: React.FC = () => {
  const { transactions, stock, addTransaction, removeTransaction, settings } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'price' | 'multi' | 'device' | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionType>('jawwy');
  const [selectedMultiQty, setSelectedMultiQty] = useState(1);
  const [deviceCommission, setDeviceCommission] = useState('');

  // Helper: Filter logs for current date
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const dailyTransactions = transactions.filter(t => isSameDay(new Date(t.date), currentDate));
  const dailyTotal = dailyTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Helper: Get weekly target progress
  const getSunday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(date.setDate(diff));
  }
  const weekStart = getSunday(new Date());
  weekStart.setHours(0,0,0,0);
  const weeklySales = transactions
    .filter(t => new Date(t.date) >= weekStart)
    .reduce((sum, t) => sum + t.amount, 0);
  const targetPercent = Math.min(100, Math.round((weeklySales / settings.weeklyTarget) * 100));

  const changeDate = (days: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  // Handlers
  const handleOpenSale = (type: TransactionType) => {
    if (type === 'device') {
        setSelectedType('device');
        setDeviceCommission('');
        setActiveModal('device');
        return;
    }
    
    // Check stock for SIM types only
    if (type !== 'issue' && stock[type as keyof typeof stock] <= 0) {
      alert(`⚠️ لا يوجد رصيد كافي لـ ${SIM_LABELS[type]}`);
      return;
    }

    if (type === 'multi') {
        setActiveModal('multi');
    } else {
        setSelectedType(type);
        setSelectedMultiQty(1);
        setActiveModal('price');
    }
  };

  const handleMultiSelect = (qty: number) => {
    if (stock.multi < qty) {
        alert('⚠️ الرصيد لا يكفي');
        return;
    }
    setSelectedType('multi');
    setSelectedMultiQty(qty);
    setActiveModal('price');
  };

  const confirmSale = (price: number) => {
    addTransaction(selectedType, price, selectedMultiQty);
    setActiveModal(null);
  };

  const confirmDeviceSale = () => {
      if (!deviceCommission) return;
      const amount = parseFloat(deviceCommission);
      if (amount > 0) {
          addTransaction('device', amount, 1);
          setActiveModal(null);
      }
  };

  const salesButtons = [
    { type: 'jawwy', icon: '🔴', sub: 'شرائح جوّي', color: 'bg-red-50 text-red-600 border-red-100' },
    { type: 'sawa', icon: '🟣', sub: 'شرائح سوا', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { type: 'multi', icon: '🟠', sub: 'عميل متعددة', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { type: 'device', icon: '📱', sub: 'توصيل جهاز', color: 'bg-sky-50 text-sky-600 border-sky-100' },
    { type: 'issue', icon: '⚠️', sub: 'لم تكتمل', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  ];

  // Derive prices from Settings
  const jawwyPrices = settings.priceConfig?.jawwy || [30, 25, 20];
  const sawaPrices = settings.priceConfig?.sawa || [28, 24, 20];
  const multiPrices = settings.priceConfig?.multi || [15, 10, 5];

  // Determine which price set to use
  let currentPrices = jawwyPrices;
  if (selectedType === 'sawa') currentPrices = sawaPrices;
  if (selectedType === 'multi') currentPrices = multiPrices;

  const priceOptions = [
      { l: 'أقل من ساعتين', v: currentPrices[0] }, 
      { l: '2-3 ساعات', v: currentPrices[1] }, 
      { l: 'أكثر من 3 ساعات', v: currentPrices[2] }
  ];

  return (
    <div className="pb-10">
      {/* Header */}
      <header className="bg-gradient-to-br from-stc-purple to-stc-dark pt-6 pb-12 px-6 rounded-b-[40px] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="text-stc-purple" fill="currentColor" size={20} />
                </div>
                <div>
                    <h1 className="font-extrabold text-lg">{settings.name}</h1>
                    <div className="text-xs text-purple-200 font-medium">نسخة Pro</div>
                </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                {dailyTotal} ريال اليوم
            </div>
        </div>

        {/* Date Navigator */}
        <div className="relative z-10 flex justify-center items-center gap-6">
            <button onClick={() => changeDate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><ArrowRight size={18}/></button>
            <div className="text-center">
                <div className="text-2xl font-bold font-sans">
                    {currentDate.toLocaleDateString('ar-SA', { weekday: 'long' })}
                </div>
                <div className="text-sm text-purple-200 opacity-80">
                    {currentDate.toLocaleDateString('en-GB')}
                </div>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><ArrowLeft size={18}/></button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-5 -mt-8 relative z-20">
        
        {/* Stats Grid - UPDATED to 5 columns including Issue */}
        <div className="grid grid-cols-5 gap-1.5 mb-6">
            {['jawwy', 'sawa', 'multi', 'device', 'issue'].map((k) => {
                const count = dailyTransactions.filter(t => t.type === k).reduce((acc, curr) => acc + (curr.quantity || 1), 0);
                return (
                    <div key={k} className="bg-white py-3 px-1 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[70px]">
                        <span className="text-base font-black mb-1" style={{ color: SIM_COLORS[k as TransactionType] }}>{count}</span>
                        <span className="text-[10px] text-gray-500 font-bold text-center whitespace-nowrap w-full overflow-hidden text-ellipsis">
                            {SIM_LABELS[k as TransactionType]}
                        </span>
                    </div>
                );
            })}
        </div>

        {/* Weekly Target Widget */}
        <div className="bg-gradient-to-r from-stc-purple to-violet-800 rounded-3xl p-5 text-white shadow-lg mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_70%)]"></div>
            <div className="flex justify-between items-center mb-2 relative z-10">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-emerald-300" />
                    <span className="font-bold text-sm">الهدف الأسبوعي</span>
                </div>
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold">{targetPercent}%</span>
            </div>
            <div className="text-2xl font-black mb-3 relative z-10">{weeklySales} <span className="text-sm font-medium opacity-70">/ {settings.weeklyTarget}</span></div>
            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden relative z-10">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)] ${targetPercent < 50 ? 'bg-coral' : targetPercent < 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${targetPercent}%` }}
                ></div>
            </div>
        </div>

        {/* Action Grid */}
        <h2 className="text-stc-purple font-bold mb-3 flex justify-between items-center">
            <span>تسجيل عملية</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
            {salesButtons.map((btn) => (
                <button 
                    key={btn.type}
                    onClick={() => handleOpenSale(btn.type as TransactionType)}
                    className={`relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform ${btn.color} ${btn.type === 'issue' ? 'col-span-2' : ''}`}
                >
                    {btn.type !== 'issue' && btn.type !== 'device' && (
                        <span className="absolute top-2 left-2 bg-white/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600 shadow-sm">
                            {stock[btn.type as keyof typeof stock]}
                        </span>
                    )}
                    <span className="text-3xl filter drop-shadow-sm">{btn.icon}</span>
                    <span className="font-bold text-sm text-gray-800">{SIM_LABELS[btn.type as TransactionType]}</span>
                    <span className="text-[10px] bg-white/60 px-2 py-0.5 rounded-md font-bold">{btn.sub}</span>
                </button>
            ))}
        </div>

        {/* Logs */}
        <h2 className="text-stc-purple font-bold mb-3">سجل اليوم</h2>
        <div className="space-y-3">
            {dailyTransactions.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200">
                    لا يوجد عمليات لهذا اليوم
                </div>
            )}
            {dailyTransactions.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full`} style={{ backgroundColor: SIM_COLORS[t.type] }}></div>
                        <div>
                            <div className="font-bold text-gray-800">
                                {SIM_LABELS[t.type]} {t.type === 'multi' && `(${t.quantity})`}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">
                                {new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-extrabold text-stc-purple text-lg">{t.amount}</span>
                        <button 
                            onClick={() => { if(confirm('حذف؟')) removeTransaction(t.id) }}
                            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* MODALS */}
      <Modal 
        isOpen={activeModal === 'price'} 
        onClose={() => setActiveModal(null)} 
        title={selectedType === 'multi' ? 'سعر العمولة (للشريحة الواحدة)' : 'تحديد السعر'}
      >
        <div className="grid gap-3">
            {selectedType === 'issue' ? (
                <button 
                    onClick={() => confirmSale(10)}
                    className="w-full p-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition"
                >
                    تأكيد (10 ريال)
                </button>
            ) : (
                priceOptions.map((opt) => (
                    <button
                        key={opt.v}
                        onClick={() => confirmSale(opt.v * selectedMultiQty)}
                        className="flex justify-between items-center p-4 border-2 border-gray-100 hover:border-stc-purple bg-gray-50 hover:bg-white rounded-2xl transition-all group"
                    >
                        <span className="font-medium text-gray-600 group-hover:text-stc-purple">{opt.l}</span>
                        <div className="text-left">
                            <span className="font-bold text-lg text-stc-purple block">{opt.v * selectedMultiQty} ريال</span>
                            {selectedMultiQty > 1 && (
                                <span className="text-[10px] text-gray-400 block">({opt.v} × {selectedMultiQty})</span>
                            )}
                        </div>
                    </button>
                ))
            )}
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'multi'} 
        onClose={() => setActiveModal(null)} 
        title="عدد الشرائح"
      >
        <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5].map(num => (
                <button
                    key={num}
                    onClick={() => handleMultiSelect(num)}
                    className="p-6 bg-gray-50 hover:bg-amber-50 border-2 border-transparent hover:border-amber-400 rounded-2xl text-2xl font-bold text-gray-700 transition-all"
                >
                    {num}
                </button>
            ))}
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'device'}
        onClose={() => setActiveModal(null)}
        title="عمولة توصيل جهاز"
      >
        <div className="space-y-4">
            <p className="text-sm text-gray-500 font-bold">أدخل قيمة العمولة المستلمة:</p>
            <div className="relative">
                <input 
                    type="number" 
                    value={deviceCommission}
                    onChange={(e) => setDeviceCommission(e.target.value)}
                    placeholder="مثلاً: 35"
                    className="w-full p-4 pl-12 bg-gray-50 rounded-xl border-2 border-transparent focus:border-sky-400 outline-none font-bold text-xl text-center"
                    autoFocus
                />
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            </div>
            
            <button 
                onClick={confirmDeviceSale}
                className="w-full bg-sky-500 text-white p-4 rounded-xl font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200"
            >
                تسجيل العمولة
            </button>
        </div>
      </Modal>
    </div>
  );
};