import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { User, Lock, ArrowRight, Zap, Cloud } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoadingMessage('جاري التحقق...');

    try {
        const success = await login(username, password);
        if (!success) {
            setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    } catch (err) {
        setError('حدث خطأ في الاتصال');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stc-dark to-stc-purple flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

        <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                    <Zap className="text-stc-purple" fill="currentColor" size={32} />
                </div>
                <h1 className="text-2xl font-black text-white">المبيعات الالكترونية</h1>
                <p className="text-purple-200 text-sm mt-1">تسجيل الدخول للنظام</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <User className="text-purple-200 group-focus-within:text-white transition-colors" size={20} />
                    </div>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="اسم المستخدم"
                        className="w-full bg-black/20 border border-white/5 text-white placeholder-purple-200/50 pr-12 pl-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Lock className="text-purple-200 group-focus-within:text-white transition-colors" size={20} />
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="كلمة المرور"
                        className="w-full bg-black/20 border border-white/5 text-white placeholder-purple-200/50 pr-12 pl-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/20 text-red-200 text-sm text-center py-2 rounded-lg animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-stc-purple font-bold py-4 rounded-xl shadow-lg hover:bg-purple-50 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-stc-purple border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">{loadingMessage}</span>
                        </>
                    ) : (
                        <>
                            <span>دخول</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
                
                {isLoading && (
                    <div className="text-center text-[10px] text-purple-200/60 mt-2 flex items-center justify-center gap-1">
                        <Cloud size={10} />
                        جاري البحث في السحابة عن المستخدم...
                    </div>
                )}
            </form>

            <div className="mt-8 text-center">
                <p className="text-xs text-purple-300/60">
                    © 2026 جميع الحقوق محفوظة
                </p>
            </div>
        </div>
    </div>
  );
};