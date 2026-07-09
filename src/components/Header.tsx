import React from 'react';
import { Wallet, Users, RefreshCw, LogIn } from 'lucide-react';

interface HeaderProps {
  activeTab: 'cashflow' | 'debts';
  setActiveTab: (tab: 'cashflow' | 'debts') => void;
  syncing: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  syncing
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg text-slate-800 leading-none">
                Fluxo de Caixa
              </h1>
              <span className="text-[10px] sm:text-xs text-indigo-600 font-bold tracking-wide uppercase">
                & Cobranças
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`flex items-center gap-1.5 py-1.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'cashflow'
                  ? 'bg-white text-indigo-600 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fluxo de Caixa</span>
              <span className="sm:hidden">Finanças</span>
            </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex items-center gap-1.5 py-1.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'debts'
                  ? 'bg-white text-indigo-600 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quem me Deve</span>
              <span className="sm:hidden">Cobranças</span>
            </button>
          </nav>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs text-emerald-700 font-bold shadow-3xs">
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Nuvem Sincronizada</span>
              <span className="sm:hidden">Sinc.</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
