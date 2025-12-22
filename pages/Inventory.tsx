import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal } from '../components/Modal';
import { Plus, CornerDownLeft, AlertTriangle, RefreshCcw } from 'lucide-react';
import { SimType, StockLog } from '../types';
import { SIM_LABELS } from '../constants';

export const Inventory: React.FC = () => {
  const { stock, damaged, stockLogs, updateStock } = useData();
  
  const [modalType, setModalType] = useState<StockLog['action'] | null>(null);
  const [selectedSim, setSelectedSim] = useState<SimType>('jawwy');
  const [quantity, setQuantity] = useState('');

  const handleAction = () => {
    if (!modalType || !quantity) return;
    const qty = parseInt(quantity);
    if (qty <= 0) return;

    // Validation
    if ((modalType === 'return_company' || modalType === 'to_damaged') && stock[selectedSim] < qty) {
        alert('الرصيد لا يكفي');
        return;
    }
    if ((modalType === 'recover' || modalType === 'flush') && damaged[selectedSim] < qty) {
        alert('الرصيد التالف لا يكفي');
        return;
    }

    updateStock(selectedSim, qty, modalType);
    setModalType(null);
    setQuantity('');
  };

  const getActionLabel = (action: StockLog['action']) => {
      switch(action) {
          case 'add': return 'استلام جديد';
          case 'return_company': return 'إرجاع للشركة';
          case 'to_damaged': return 'تسجيل تالف';
          case 'recover': return 'استعادة للمخزون';
          case 'flush': return 'إتلاف نهائي';
      }
  };

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-black text-stc-purple mb-6">إدارة المخزون</h1>

      {/* Stock Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
            { id: 'jawwy', label: 'جوّي', val: stock.jawwy, color: 'text-coral' },
            { id: 'sawa', label: 'سوا', val: stock.sawa, color: 'text-stc-purple' },
            { id: 'multi', label: 'متعددة', val: stock.multi, color: 'text-amber-500' },
            { id: 'total', label: 'الإجمالي', val: stock.jawwy + stock.sawa + stock.multi, color: 'text-blue-500', full: true }
        ].map(item => (
            <div key={item.id} className={`bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center ${item.full ? 'col-span-2 bg-blue-50/50 border-blue-100' : ''}`}>
                <span className={`text-3xl font-black ${item.color} mb-1`}>{item.val}</span>
                <span className="text-xs font-bold text-gray-400">{item.label}</span>
            </div>
        ))}
      </div>

      {/* Damaged Section */}
      <div className="bg-red-50 border border-red-100 rounded-3xl p-5 mb-8">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle size={18} />
                سلة التالف
            </h3>
            <button onClick={() => setModalType('recover')} className="text-xs bg-white px-3 py-1.5 rounded-lg font-bold text-red-400 shadow-sm">إدارة</button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(damaged).map(([key, val]) => (
                <div key={key} className="bg-white/60 p-2 rounded-xl">
                    <div className="text-xl font-black text-red-500">{val}</div>
                    <div className="text-[10px] text-red-300 font-bold">{SIM_LABELS[key as SimType].split(' ')[1]}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-3 mb-8">
        <button onClick={() => setModalType('add')} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 transition-all group">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 ml-4 group-hover:scale-110 transition-transform">
                <Plus size={24} />
            </div>
            <div className="text-right">
                <div className="font-bold text-gray-800">استلام مخزون</div>
                <div className="text-xs text-gray-400">إضافة شرائح جديدة للمخزون</div>
            </div>
        </button>
        <button onClick={() => setModalType('return_company')} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 ml-4 group-hover:scale-110 transition-transform">
                <CornerDownLeft size={24} />
            </div>
            <div className="text-right">
                <div className="font-bold text-gray-800">إرجاع للشركة</div>
                <div className="text-xs text-gray-400">إرجاع شرائح سليمة وخصمها</div>
            </div>
        </button>
        <button onClick={() => setModalType('to_damaged')} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 transition-all group">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 ml-4 group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
            </div>
            <div className="text-right">
                <div className="font-bold text-gray-800">نقل للتالف</div>
                <div className="text-xs text-gray-400">نقل من السليم إلى سلة التالف</div>
            </div>
        </button>
      </div>

      {/* Recent History */}
      <h3 className="font-bold text-stc-purple mb-4">آخر العمليات</h3>
      <div className="space-y-2 overflow-y-auto max-h-64 no-scrollbar">
          {stockLogs.map(log => (
              <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-50 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold
                        ${log.action === 'add' || log.action === 'recover' ? 'bg-green-500' : 'bg-red-400'}
                    `}>
                        {getActionLabel(log.action)}
                    </span>
                    <span className="font-bold text-gray-700">{SIM_LABELS[log.type]}</span>
                  </div>
                  <div className="flex gap-3 text-gray-500">
                    <span className="font-bold">{log.quantity}</span>
                    <span className="text-xs opacity-60">{new Date(log.date).toLocaleDateString('en-GB')}</span>
                  </div>
              </div>
          ))}
      </div>

      <Modal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        title={getActionLabel(modalType as any)}
      >
        <div className="space-y-4">
            <div className="bg-gray-50 p-1 rounded-xl flex text-sm font-bold">
                {(['jawwy', 'sawa', 'multi'] as SimType[]).map(t => (
                    <button 
                        key={t}
                        onClick={() => setSelectedSim(t)}
                        className={`flex-1 py-2 rounded-lg transition-all ${selectedSim === t ? 'bg-white text-stc-purple shadow-sm' : 'text-gray-400'}`}
                    >
                        {SIM_LABELS[t].split(' ')[1]}
                    </button>
                ))}
            </div>

            <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="الكمية" 
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-stc-purple rounded-xl text-center text-xl font-bold outline-none transition-colors"
                autoFocus
            />

            {modalType === 'recover' && (
                 <div className="flex gap-2">
                     <button onClick={() => { setModalType('recover'); handleAction(); }} className="flex-1 bg-green-500 text-white p-3 rounded-xl font-bold">استعادة للسليم</button>
                     <button onClick={() => { setModalType('flush'); handleAction(); }} className="flex-1 bg-red-500 text-white p-3 rounded-xl font-bold">إتلاف نهائي</button>
                 </div>
            )}
            
            {modalType !== 'recover' && modalType !== 'flush' && (
                <button 
                    onClick={handleAction}
                    className="w-full bg-stc-purple text-white p-4 rounded-xl font-bold hover:bg-stc-dark transition-colors"
                >
                    تنفيذ العملية
                </button>
            )}
        </div>
      </Modal>
    </div>
  );
};
