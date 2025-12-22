import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Save, Download, Upload, LogOut, UserPlus, Trash2, Users, Database, Smartphone, Share, Copy, Check, Clipboard, Cloud, CloudUpload, CloudDownload, RefreshCw, DollarSign } from 'lucide-react';
import { Modal } from '../components/Modal';

export const SettingsPage: React.FC = () => {
  const { 
      settings, updateSettings, exportData, importData, logout, 
      currentUser, users, addUser, deleteUser, saveNow,
      isSyncing, syncToCloud, syncFromCloud, lastSync
  } = useData();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');

  // UI State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pasteCode, setPasteCode] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Listen for installation prompt & detect device
  useEffect(() => {
    // Force save on mount just in case
    saveNow();

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handler = () => {
      // @ts-ignore
      if (window.deferredPrompt) {
          // @ts-ignore
          setInstallPrompt(window.deferredPrompt);
      }
    };
    
    window.addEventListener('installPromptReady', handler);
    // @ts-ignore
    if (window.deferredPrompt) setInstallPrompt(window.deferredPrompt);
    
    return () => window.removeEventListener('installPromptReady', handler);
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    });
  };

  const handleCloudUpload = async () => {
      const success = await syncToCloud();
      if(success) alert('✅ تم الحفظ السحابي بنجاح!');
      else alert('⚠️ حدث خطأ أثناء الحفظ، تأكد من الإنترنت.');
  };

  const handleCloudDownload = async () => {
      if(window.confirm('هل تود استبدال البيانات الحالية بالنسخة المحفوظة سحابياً؟')) {
          const success = await syncFromCloud();
          if(success) alert('✅ تم استرجاع البيانات بنجاح!');
          else alert('⚠️ لم يتم العثور على بيانات أو حدث خطأ.');
      }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const content = ev.target?.result as string;
          if (importData(content)) {
              alert('✅ تم استعادة بياناتك بنجاح');
          } else {
              alert('❌ ملف غير صالح');
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const handleExport = () => {
      saveNow(); // Ensure everything is saved before export
      const json = exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `Sales_Backup_${currentUser?.username}_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCopyCode = () => {
      saveNow();
      const json = exportData();
      const code = btoa(unescape(encodeURIComponent(json)));
      navigator.clipboard.writeText(code).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      });
  };

  const handlePasteCode = () => {
      if (!pasteCode) return;
      let content = pasteCode;
      try {
          content = decodeURIComponent(escape(window.atob(pasteCode)));
      } catch(e) {
          content = pasteCode; 
      }

      if (importData(content)) {
          alert('✅ تم نقل البيانات بنجاح!');
          setPasteCode('');
          setShowTransferModal(false);
          window.location.reload(); 
      } else {
          alert('❌ الكود غير صحيح');
      }
  };

  const handleAddUser = () => {
      if(!newUsername || !newPassword || !newName) return;
      addUser({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: 'user'
      });
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setShowUserModal(false);
  };

  const handleLogout = () => {
      if (window.confirm('هل تود تسجيل الخروج؟')) logout();
  };

  const updatePrice = (sim: 'jawwy' | 'sawa' | 'multi', index: number, value: string) => {
      const val = parseFloat(value) || 0;
      const newConfig = { ...settings.priceConfig };
      
      // Ensure defaults exist
      if (!newConfig.jawwy) newConfig.jawwy = [30, 25, 20];
      if (!newConfig.sawa) newConfig.sawa = [28, 24, 20];
      if (!newConfig.multi) newConfig.multi = [15, 10, 5];
      
      const newPrices = [...newConfig[sim]];
      newPrices[index] = val;
      newConfig[sim] = newPrices as [number, number, number];
      
      updateSettings({ priceConfig: newConfig });
  };

  return (
    <div className="p-6 pb-24">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-stc-purple">الإعدادات</h1>
            <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-100 text-stc-purple px-2 py-1 rounded-full font-bold">
                    {currentUser?.name}
                </span>
            </div>
        </div>

        {/* --- INSTALLATION SECTION --- */}
        {installPrompt && (
            <button 
                onClick={handleInstallClick}
                className="w-full mb-6 bg-gradient-to-r from-stc-purple to-purple-700 text-white p-4 rounded-3xl shadow-lg shadow-purple-200 flex items-center justify-between group animate-in slide-in-from-top duration-500"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Smartphone size={24} className="text-white" />
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-lg">تثبيت التطبيق</div>
                        <div className="text-xs text-purple-200">أضف التطبيق لشاشتك الرئيسية</div>
                    </div>
                </div>
                <div className="bg-white text-stc-purple px-4 py-2 rounded-xl font-bold text-sm group-hover:scale-105 transition-transform">
                    تثبيت
                </div>
            </button>
        )}

        {/* --- CLOUD SYNC SECTION --- */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 rounded-3xl shadow-lg mb-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
             <div className="relative z-10">
                 <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                     <Cloud size={20} />
                     المزامنة السحابية (تلقائي)
                 </h3>
                 <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
                     يتم حفظ البيانات تلقائياً بعد كل عملية. يمكنك استخدام الأزرار أدناه للتحكم اليدوي.
                 </p>
                 
                 {lastSync && (
                     <div className="mb-4 text-xs bg-white/10 p-2 rounded-lg inline-block">
                         آخر مزامنة: {new Date(lastSync).toLocaleString('en-US')}
                     </div>
                 )}

                 <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={handleCloudUpload}
                        disabled={isSyncing}
                        className="bg-white text-indigo-800 p-3 rounded-xl flex flex-col items-center justify-center gap-2 font-bold hover:scale-105 transition-transform shadow-md disabled:opacity-70"
                     >
                         {isSyncing ? <RefreshCw className="animate-spin" size={24}/> : <CloudUpload size={24} />}
                         <span className="text-xs">حفظ فوري</span>
                     </button>
                     
                     <button 
                        onClick={handleCloudDownload}
                        disabled={isSyncing}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors border border-white/10 disabled:opacity-70"
                     >
                         {isSyncing ? <RefreshCw className="animate-spin" size={24}/> : <CloudDownload size={24} />}
                         <span className="text-xs">تحديث من السحابة</span>
                     </button>
                 </div>
             </div>
        </div>

        {/* --- SMART TRANSFER SECTION --- */}
        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-6 rounded-3xl shadow-sm mb-6 relative overflow-hidden">
             <div className="relative z-10">
                 <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                     <Share size={20} />
                     نقل سريع (بدون انترنت)
                 </h3>
                 <div className="grid grid-cols-2 gap-3 mt-4">
                     <button 
                        onClick={handleCopyCode}
                        className="bg-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors border border-blue-100 shadow-sm"
                     >
                         {copySuccess ? <Check size={24} className="text-emerald-500" /> : <Copy size={24} className="text-blue-500" />}
                         <span className="text-xs font-bold">{copySuccess ? 'تم النسخ!' : 'نسخ كود البيانات'}</span>
                     </button>
                     
                     <button 
                        onClick={() => setShowTransferModal(true)}
                        className="bg-blue-500 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 font-bold hover:scale-105 transition-transform shadow-md"
                     >
                         <Clipboard size={24} />
                         <span className="text-xs">استلام (لصق)</span>
                     </button>
                 </div>
             </div>
        </div>

        {/* Basic Settings */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">اسم المندوب (للعرض)</label>
                <input 
                    type="text" 
                    value={settings.name}
                    onChange={(e) => updateSettings({ name: e.target.value })}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">الهدف الأسبوعي (ريال)</label>
                <input 
                    type="number" 
                    value={settings.weeklyTarget}
                    onChange={(e) => updateSettings({ weeklyTarget: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-center"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">نوع الوقود المفضل</label>
                <select
                    value={settings.preferredFuelType || '91'}
                    onChange={(e) => updateSettings({ preferredFuelType: e.target.value as any })}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none font-bold text-gray-600"
                >
                    <option value="91">91 (أخضر)</option>
                    <option value="95">95 (أحمر)</option>
                    <option value="diesel">ديزل</option>
                </select>
            </div>
        </div>

        {/* --- COMMISSION PRICES SETTINGS (NEW) --- */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <h3 className="font-bold text-stc-purple mb-4 flex items-center gap-2">
                <DollarSign size={18} />
                إعدادات العمولات
            </h3>
            
            {/* Jawwy Prices */}
            <div className="mb-4">
                <label className="text-xs font-bold text-red-500 mb-2 block">أسعار عمولة جوّي</label>
                <div className="flex gap-2">
                    {[0, 1, 2].map(idx => (
                        <div key={idx} className="flex-1">
                            <span className="text-[10px] text-gray-400 block text-center mb-1">
                                {idx === 0 ? '< 2 س' : idx === 1 ? '2-3 س' : '> 3 س'}
                            </span>
                            <input 
                                type="number" 
                                value={settings.priceConfig?.jawwy[idx] ?? 0}
                                onChange={(e) => updatePrice('jawwy', idx, e.target.value)}
                                className="w-full p-2 bg-red-50 rounded-lg text-center font-bold text-red-700 outline-none focus:ring-2 focus:ring-red-200"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Sawa Prices */}
            <div className="mb-4">
                <label className="text-xs font-bold text-purple-500 mb-2 block">أسعار عمولة سوا</label>
                <div className="flex gap-2">
                    {[0, 1, 2].map(idx => (
                        <div key={idx} className="flex-1">
                            <span className="text-[10px] text-gray-400 block text-center mb-1">
                                {idx === 0 ? '< 2 س' : idx === 1 ? '2-3 س' : '> 3 س'}
                            </span>
                            <input 
                                type="number" 
                                value={settings.priceConfig?.sawa[idx] ?? 0}
                                onChange={(e) => updatePrice('sawa', idx, e.target.value)}
                                className="w-full p-2 bg-purple-50 rounded-lg text-center font-bold text-purple-700 outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Multi Prices (NEW) */}
            <div>
                <label className="text-xs font-bold text-amber-500 mb-2 block">أسعار عمولة متعددة</label>
                <div className="flex gap-2">
                    {[0, 1, 2].map(idx => (
                        <div key={idx} className="flex-1">
                            <span className="text-[10px] text-gray-400 block text-center mb-1">
                                {idx === 0 ? '< 2 س' : idx === 1 ? '2-3 س' : '> 3 س'}
                            </span>
                            <input 
                                type="number" 
                                value={settings.priceConfig?.multi?.[idx] ?? 0}
                                onChange={(e) => updatePrice('multi', idx, e.target.value)}
                                className="w-full p-2 bg-amber-50 rounded-lg text-center font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-200"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>


        {/* Admin Section: User Management */}
        {isAdmin && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-stc-purple flex items-center gap-2">
                        <Users size={18} />
                        إدارة المستخدمين
                    </h3>
                    <button 
                        onClick={() => setShowUserModal(true)}
                        className="p-2 bg-stc-purple text-white rounded-lg shadow-md hover:bg-stc-dark transition-colors"
                    >
                        <UserPlus size={18} />
                    </button>
                </div>
                
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <div className="font-bold text-gray-800">{user.name}</div>
                                <div className="text-xs text-gray-400">@{user.username} {user.role === 'admin' && '👑'}</div>
                            </div>
                            {user.role !== 'admin' && (
                                <button 
                                    onClick={() => { if(confirm('حذف المستخدم؟ سيتم حذف جميع بياناته أيضاً.')) deleteUser(user.id); }}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Data Management */}
        <h3 className="font-bold text-stc-purple mb-4 flex items-center gap-2">
            <Database size={16} />
            النسخ الاحتياطي (ملفات)
        </h3>
        <div className="space-y-3 mb-8">
            <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-emerald-200">
                <Download size={20} />
                تحميل نسخة احتياطية
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-200">
                <Upload size={20} />
                استعادة نسخة
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".json" />
        </div>

        {/* Logout */}
        <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 p-4 rounded-2xl font-bold hover:bg-red-100 transition-colors"
        >
            <LogOut size={20} />
            تسجيل خروج
        </button>
        
        <div className="mt-8 text-center text-gray-300">
            <p className="font-bold text-stc-purple/50 mb-1">تطوير ابو عزام</p>
            <p className="font-mono text-xs text-gray-400/70" dir="ltr">0565966728</p>
        </div>

        {/* Add User Modal */}
        <Modal 
            isOpen={showUserModal} 
            onClose={() => setShowUserModal(false)} 
            title="إضافة مستخدم جديد"
        >
            <div className="space-y-3">
                <input 
                    type="text" 
                    placeholder="الاسم الكامل"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none font-bold"
                />
                <input 
                    type="text" 
                    placeholder="اسم المستخدم"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none font-bold"
                />
                <input 
                    type="password" 
                    placeholder="كلمة المرور"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none font-bold"
                />
                <button 
                    onClick={handleAddUser}
                    className="w-full bg-stc-purple text-white p-4 rounded-xl font-bold hover:bg-stc-dark transition-colors mt-2"
                >
                    حفظ
                </button>
            </div>
        </Modal>

        {/* Transfer Data Modal */}
        <Modal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            title="استلام البيانات"
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    الصق الكود الذي نسخته من الجهاز/المتصفح الآخر هنا:
                </p>
                <textarea
                    value={pasteCode}
                    onChange={e => setPasteCode(e.target.value)}
                    placeholder="الصق الكود هنا..."
                    className="w-full h-32 p-3 bg-gray-50 rounded-xl border-2 border-gray-100 focus:border-stc-purple outline-none text-xs font-mono"
                ></textarea>
                <button
                    onClick={handlePasteCode}
                    className="w-full bg-stc-purple text-white p-4 rounded-xl font-bold hover:bg-stc-dark transition-colors"
                >
                    استعادة البيانات
                </button>
            </div>
        </Modal>
    </div>
  );
};