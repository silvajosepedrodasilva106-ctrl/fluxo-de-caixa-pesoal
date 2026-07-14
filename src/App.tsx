import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TransactionForm from './components/TransactionForm';
import MonthlyReport from './components/MonthlyReport';
import DebtForm from './components/DebtForm';
import DebtsManager from './components/DebtsManager';
import { getOrCreateUser } from './firebase';
import { 
  getTransactions, 
  saveTransaction, 
  removeTransaction,
  getDebts,
  saveDebt,
  removeDebt,
  getAdminPassword,
  saveAdminPassword
} from './dbHelper';
import { Transaction, Debt } from './types';
import { Loader2, Sparkles, TrendingUp, TrendingDown, Users, Lock, Unlock, KeyRound, Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'debts'>('cashflow');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data lists
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  
  // Edit slots
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Confirm modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    isDanger: false,
    onConfirm: () => {}
  });

  // Admin Login States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('cashflow_admin_logged_in') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState<string>('admin 123');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Password Change States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // 1. Initialize user on mount
  useEffect(() => {
    async function initUser() {
      try {
        const uid = await getOrCreateUser();
        setUserId(uid);
      } catch (err) {
        console.error("Failed to authenticate user:", err);
      }
    }
    initUser();
  }, []);

  // Fetch admin custom password when userId is set
  useEffect(() => {
    if (!userId) return;
    async function fetchSettings() {
      try {
        const pw = await getAdminPassword(userId);
        setAdminPassword(pw);
      } catch (err) {
        console.error("Error fetching admin password:", err);
      }
    }
    fetchSettings();
  }, [userId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername.trim().toLowerCase() !== 'admin') {
      setLoginError('Usuário incorreto. Utilize o usuário "admin".');
      return;
    }
    if (loginPassword !== adminPassword) {
      setLoginError('Senha incorreta. Tente novamente.');
      return;
    }
    setIsLoggedIn(true);
    localStorage.setItem('cashflow_admin_logged_in', 'true');
    setLoginError('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('cashflow_admin_logged_in');
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (oldPassword !== adminPassword) {
      setChangePasswordError('A senha atual está incorreta.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setChangePasswordError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('A confirmação da nova senha não confere.');
      return;
    }

    setSyncing(true);
    try {
      await saveAdminPassword(userId!, newPassword.trim());
      setAdminPassword(newPassword.trim());
      setChangePasswordSuccess('Senha alterada com sucesso!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setChangePasswordSuccess('');
      }, 1500);
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      setChangePasswordError('Erro de conexão ao salvar a nova senha.');
    } finally {
      setSyncing(false);
    }
  };

  // 2. Fetch data once user ID is ready
  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      setSyncing(true);
      try {
        // Fetch both collections
        const txs = await getTransactions(userId);
        const dts = await getDebts(userId);
        
        setTransactions(txs);
        setDebts(dts);
      } catch (err) {
        console.error("Error loading finance records:", err);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    }
    
    loadData();
  }, [userId]);

  // --- Transactions Operations ---
  
  const handleSaveTransaction = async (tx: Transaction) => {
    if (!userId) return;
    setSyncing(true);
    
    // Update local react state instantly
    setTransactions(prev => {
      const idx = prev.findIndex(t => t.id === tx.id);
      let updated = [...prev];
      if (idx >= 0) {
        updated[idx] = tx;
      } else {
        updated.unshift(tx);
      }
      updated.sort((a, b) => b.date.localeCompare(a.date));
      return updated;
    });

    try {
      await saveTransaction(userId, tx);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!userId) return;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Lançamento',
      message: 'Tem certeza de que deseja excluir este lançamento permanentemente?',
      confirmText: 'Excluir',
      isDanger: true,
      onConfirm: async () => {
        setSyncing(true);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        // Update state instantly
        setTransactions(prev => prev.filter(t => t.id !== txId));
        
        try {
          await removeTransaction(userId, txId);
        } catch (err) {
          console.error(err);
        } finally {
          setSyncing(false);
        }
      }
    });
  };

  const handleClearAllTransactions = async () => {
    if (!userId || transactions.length === 0) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Zerar Fluxo de Caixa',
      message: 'Tem certeza de que deseja excluir TODOS os seus lançamentos de entrada e saída? Esta ação não pode ser desfeita.',
      confirmText: 'Limpar Tudo',
      isDanger: true,
      onConfirm: async () => {
        setSyncing(true);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const tempTxs = [...transactions];
        setTransactions([]);
        localStorage.setItem(`transactions_${userId}`, JSON.stringify([]));

        try {
          await Promise.all(tempTxs.map(t => removeTransaction(userId, t.id)));
        } catch (err) {
          console.error("Erro ao limpar lançamentos:", err);
        } finally {
          setSyncing(false);
        }
      }
    });
  };

  // --- Debts Operations ---

  const handleSaveDebt = async (debt: Debt) => {
    if (!userId) return;
    setSyncing(true);

    // Update state instantly
    setDebts(prev => {
      const idx = prev.findIndex(d => d.id === debt.id);
      let updated = [...prev];
      if (idx >= 0) {
        updated[idx] = debt;
      } else {
        updated.unshift(debt);
      }
      updated.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1;
        }
        return b.date.localeCompare(a.date);
      });
      return updated;
    });

    try {
      await saveDebt(userId, debt);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!userId) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Cobrança',
      message: 'Tem certeza de que deseja excluir esta cobrança permanentemente?',
      confirmText: 'Excluir',
      isDanger: true,
      onConfirm: async () => {
        setSyncing(true);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setDebts(prev => prev.filter(d => d.id !== debtId));

        try {
          await removeDebt(userId, debtId);
        } catch (err) {
          console.error(err);
        } finally {
          setSyncing(false);
        }
      }
    });
  };

  const handleClearAllDebts = async () => {
    if (!userId || debts.length === 0) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Zerar Todas as Cobranças',
      message: 'Tem certeza de que deseja excluir TODOS os seus registros de devedores e cobranças? Esta ação não pode ser desfeita.',
      confirmText: 'Limpar Tudo',
      isDanger: true,
      onConfirm: async () => {
        setSyncing(true);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        const tempDebts = [...debts];
        setDebts([]);
        localStorage.setItem(`debts_${userId}`, JSON.stringify([]));

        try {
          await Promise.all(tempDebts.map(d => removeDebt(userId, d.id)));
        } catch (err) {
          console.error("Erro ao limpar cobranças:", err);
        } finally {
          setSyncing(false);
        }
      }
    });
  };

  const handleToggleDebtStatus = async (debt: Debt) => {
    if (!userId) return;
    setSyncing(true);

    const toggledDebt: Debt = {
      ...debt,
      status: debt.status === 'pending' ? 'paid' : 'pending'
    };

    // Update state instantly
    setDebts(prev => {
      const updated = prev.map(d => d.id === debt.id ? toggledDebt : d);
      updated.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1;
        }
        return b.date.localeCompare(a.date);
      });
      return updated;
    });

    try {
      await saveDebt(userId, toggledDebt);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // Loading Screen Layout
  if (loading && !userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h2 className="font-display font-semibold text-slate-800 text-lg">Inicializando Sistema Seguro...</h2>
        <p className="text-sm mt-1 text-slate-400">Preparando seu banco de dados na nuvem.</p>
      </div>
    );
  }

  // Login Screen Overlay
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Acesso Restrito
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Digite suas credenciais administrativas para gerenciar o fluxo financeiro.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Usuário
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-md shadow-indigo-500/10"
              >
                Entrar no Painel
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
            Senha padrão inicial: <span className="font-bold text-indigo-500">admin 123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 flex flex-col justify-between">
      <div>
        {/* Main Sticky Header */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // Cancel active editing instances on tab swap for a bugs-free experience
            setEditingTransaction(null);
            setEditingDebt(null);
          }} 
          syncing={syncing} 
          onLogout={handleLogout}
          onChangePasswordClick={() => setShowChangePasswordModal(true)}
        />

        {/* Outer Content Stage */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {/* Welcome Dashboard Bar */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-3xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">👋</span>
                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-800 tracking-tight">
                  Bem-vindo ao seu Fluxo Pessoal
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Seu caixa diário sincronizado e devedores organizados no mesmo painel.
              </p>
            </div>
            
            {/* Quick overview of state stats */}
            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
              <div className="text-center md:text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lançamentos</span>
                <span className="text-sm font-bold text-slate-800 block">{transactions.length}</span>
              </div>
              <div className="text-center md:text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pendências</span>
                <span className="text-sm font-bold text-amber-600 block">
                  {debts.filter(d => d.status === 'pending').length} devedores
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Sections Grid */}
          {activeTab === 'cashflow' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Input Side */}
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <TransactionForm 
                  userId={userId || 'guest'}
                  onSave={handleSaveTransaction}
                  editingTransaction={editingTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                />

                {/* Info Tip block below form */}
                <div className="mt-4 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 flex gap-3 text-xs text-indigo-800 font-medium leading-relaxed">
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-bold">Dica Financeira:</span> Organize seus gastos diariamente selecionando as categorias corretas para obter relatórios mensais precisos de comportamento de consumo.
                  </div>
                </div>
              </div>

              {/* Data Dashboard Side */}
              <div className="lg:col-span-8">
                <MonthlyReport 
                  transactions={transactions}
                  onEdit={(tx) => {
                    setEditingTransaction(tx);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDelete={handleDeleteTransaction}
                  onClearAll={handleClearAllTransactions}
                />
              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Debt Input Form Side */}
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <DebtForm 
                  userId={userId || 'guest'}
                  onSave={handleSaveDebt}
                  editingDebt={editingDebt}
                  onCancelEdit={() => setEditingDebt(null)}
                />

                <div className="mt-4 p-4 bg-amber-50/40 rounded-2xl border border-amber-100/50 flex gap-3 text-xs text-amber-800 font-medium leading-relaxed">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold">Controle de Devolução:</span> Defina datas de vencimento para devedores e o sistema alertará quando a data expirar, facilitando a cobrança amigável.
                  </div>
                </div>
              </div>

              {/* Debt Management Dashboard Side */}
              <div className="lg:col-span-8">
                <DebtsManager 
                  debts={debts}
                  onEdit={(debt) => {
                    setEditingDebt(debt);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDelete={handleDeleteDebt}
                  onToggleStatus={handleToggleDebtStatus}
                  onClearAll={handleClearAllDebts}
                />
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Human/Clean App Footer */}
      <footer className="my-12 text-center max-w-7xl mx-auto px-4 text-xs text-slate-400 font-medium">
        <p>© 2026 Fluxo de Caixa e Cobranças • Todos os dados salvos em nuvem privada e local storage</p>
      </footer>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-100 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-xl tracking-tight">
                Alterar Senha de Acesso
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Substitua a senha de administrador atual para assegurar o painel.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {changePasswordError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{changePasswordError}</span>
                </div>
              )}

              {changePasswordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{changePasswordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setChangePasswordError('');
                    setChangePasswordSuccess('');
                  }}
                  className="w-1/2 py-2.5 px-4 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="w-1/2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-md shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern, Beautiful Custom Confirm Modal (Bypasses browser confirm() iframe block) */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display font-bold text-slate-900 text-lg mb-2">
              {confirmConfig.title}
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">
              {confirmConfig.message}
            </p>
            <div className="flex items-center justify-end gap-3 border-t border-slate-50 pt-4">
              <button
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`px-4 py-2 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  confirmConfig.isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
