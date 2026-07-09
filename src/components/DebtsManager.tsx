import React, { useState, useMemo } from 'react';
import { Debt, DebtStatus } from '../types';
import { formatCurrency, formatDate, getCurrentLocalDateString } from '../utils';
import { 
  UserPlus, 
  Search, 
  ArrowUpDown, 
  Check, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Inbox, 
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface DebtsManagerProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onToggleStatus: (debt: Debt) => void;
  onClearAll: () => void;
}

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'due_date_asc';

export default function DebtsManager({
  debts,
  onEdit,
  onDelete,
  onToggleStatus,
  onClearAll
}: DebtsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [activeTab, setActiveTab] = useState<DebtStatus>('pending');

  // Calculates pending vs paid totals
  const debtStats = useMemo(() => {
    let pendingTotal = 0;
    let paidTotal = 0;
    let pendingCount = 0;

    debts.forEach(d => {
      if (d.status === 'pending') {
        pendingTotal += d.amount;
        pendingCount++;
      } else {
        paidTotal += d.amount;
      }
    });

    return {
      pendingTotal,
      paidTotal,
      pendingCount
    };
  }, [debts]);

  // Filters and sorts debts
  const filteredAndSortedDebts = useMemo(() => {
    // 1. Filter by tab status and search term (case insensitive name)
    let list = debts.filter(d => {
      const matchStatus = d.status === activeTab;
      const matchSearch = d.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });

    // 2. Sort according to selection
    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return b.date.localeCompare(a.date);
        case 'date_asc':
          return a.date.localeCompare(b.date);
        case 'name_asc':
          return a.debtorName.localeCompare(b.debtorName);
        case 'name_desc':
          return b.debtorName.localeCompare(a.debtorName);
        case 'due_date_asc':
          // Items with no due date go to the end
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        default:
          return 0;
      }
    });

    return list;
  }, [debts, searchTerm, sortBy, activeTab]);

  // Helper to check if a debt is overdue (vencida)
  const isOverdue = (debt: Debt) => {
    if (debt.status === 'paid' || !debt.dueDate) return false;
    const today = getCurrentLocalDateString();
    return debt.dueDate < today;
  };

  return (
    <div className="space-y-6">
      {/* Header and Clear Option */}
      {debts.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onClearAll}
            className="px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zerar Todas as Cobranças
          </button>
        </div>
      )}

      {/* Debt Receivables Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Pending (A Receber) */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-800 block uppercase tracking-wider">Total a Receber</span>
            <span className="text-2xl font-bold text-amber-700 tracking-tight block">
              {formatCurrency(debtStats.pendingTotal)}
            </span>
            <span className="text-xs text-amber-600 block font-medium">
              {debtStats.pendingCount} cobrança{debtStats.pendingCount === 1 ? ' devedor pendente' : 's devedoras pendentes'}
            </span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>

        {/* Total Settled (Já Recebido) */}
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 shadow-2xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-800 block uppercase tracking-wider">Total Recebido (Quitado)</span>
            <span className="text-2xl font-bold text-emerald-700 tracking-tight block">
              {formatCurrency(debtStats.paidTotal)}
            </span>
            <span className="text-xs text-emerald-600 block font-medium">
              Valores já devolvidos e arquivados
            </span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search, Sort and Filters Block */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search box */}
          <div className="relative md:col-span-6">
            <span className="absolute left-3.5 top-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar devedor por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative md:col-span-4">
            <span className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
              <ArrowUpDown className="w-4 h-4" />
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium cursor-pointer appearance-none"
            >
              <option value="date_desc">Empréstimo (Mais recente)</option>
              <option value="date_asc">Empréstimo (Mais antigo)</option>
              <option value="name_asc">Nome do devedor (A-Z)</option>
              <option value="name_desc">Nome do devedor (Z-A)</option>
              <option value="due_date_asc">Data de Vencimento (Mais próxima)</option>
            </select>
          </div>

          {/* Status Tab Toggle */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl md:col-span-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-800 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-white text-slate-800 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quitados
            </button>
          </div>

        </div>
      </div>

      {/* Debts list display */}
      {filteredAndSortedDebts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center justify-center text-center text-slate-400">
          <Inbox className="w-12 h-12 stroke-1.5 text-slate-300 mb-3" />
          <p className="text-sm font-semibold">Nenhuma cobrança {activeTab === 'pending' ? 'pendente' : 'quitada'} encontrada.</p>
          <p className="text-xs mt-1">Insira uma nova cobrança no formulário superior.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedDebts.map(debt => {
            const overdue = isOverdue(debt);

            return (
              <div 
                key={debt.id} 
                className={`bg-white rounded-2xl border p-5 shadow-3xs transition-all relative group flex flex-col justify-between ${
                  overdue 
                    ? 'border-rose-200 bg-rose-50/5 hover:bg-rose-50/10' 
                    : debt.status === 'paid' 
                      ? 'border-emerald-100 opacity-90' 
                      : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-display font-bold text-slate-800 text-base">
                        {debt.debtorName}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Emprestado em: {formatDate(debt.date)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-base font-bold block ${
                        debt.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Description if present */}
                  {debt.description && (
                    <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 mb-3 font-medium">
                      {debt.description}
                    </p>
                  )}

                  {/* Badges / Dates Block */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {debt.dueDate && (
                      <span className={`text-xs font-semibold py-1 px-2.5 rounded-lg flex items-center gap-1.5 ${
                        overdue 
                          ? 'bg-rose-100 text-rose-700' 
                          : debt.status === 'paid'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        Vence em: {formatDate(debt.dueDate)}
                      </span>
                    )}

                    {overdue && (
                      <span className="text-xs font-bold bg-rose-100 text-rose-700 py-1 px-2.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Atrasado / Vencido
                      </span>
                    )}

                    {debt.status === 'paid' && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 py-1 px-2.5 rounded-lg flex items-center gap-1">
                        ✓ Quitada
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                  {/* Status toggle action */}
                  <button
                    onClick={() => onToggleStatus(debt)}
                    className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      debt.status === 'pending'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {debt.status === 'pending' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Marcar como Quitada
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reabrir Cobrança
                      </>
                    )}
                  </button>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(debt)}
                      className="p-2 hover:bg-slate-100 hover:text-indigo-600 rounded-xl text-slate-400 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(debt.id)}
                      className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
