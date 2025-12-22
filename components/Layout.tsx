import React from 'react';
import { Home, Package, Fuel, BarChart2, Settings, Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { isSyncing, lastSync } = useData();
  
  const tabs = [
    { id: 'home', icon: Home, label: 'الرئيسية' },
    { id: 'inventory', icon: Package, label: 'المخزون' },
    { id: 'fuel', icon: Fuel, label: 'الوقود' },
    { id: 'reports', icon: BarChart2, label: 'التقارير' },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Cloud Status Indicator (Floating top-left) */}
      <div className="fixed top-4 left-4 z-50 pointer-events-none transition-all duration-300">
        {isSyncing ? (
            <div className="bg-white/90 backdrop-blur-md text-stc-purple text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-stc-purple/10 flex items-center gap-2 animate-in slide-in-from-top-2">
                <RefreshCw size={12} className="animate-spin" />
                <span>جاري الحفظ...</span>
            </div>
        ) : lastSync ? (
            <div className="bg-emerald-50/90 backdrop-blur-md text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-emerald-100 flex items-center gap-1.5 animate-in slide-in-from-top-2">
                <CheckCircle2 size={12} />
                <span>تم الحفظ</span>
            </div>
        ) : null}
      </div>

      <main className="animate-in fade-in duration-300">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-stc-purple -translate-y-1' : 'text-gray-400'
                }`}
              >
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-stc-purple/10' : 'bg-transparent'}`}>
                    <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};