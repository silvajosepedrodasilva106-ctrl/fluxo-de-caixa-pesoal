import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate, PORTUGUESE_MONTHS, getCurrentMonthYearString, getCurrentLocalDateString } from '../utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Edit3, 
  Inbox,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface MonthlyReportProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onClearAll: () => void;
}

export default function MonthlyReport({
  transactions,
  onEdit,
  onDelete,
  onClearAll
}: MonthlyReportProps) {
  // Current active month-year selected (format: "YYYY-MM")
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    return getCurrentMonthYearString();
  });

  // Get list of unique month-years that actually exist in transactions to build a selector list
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    // Always include current month in options
    months.add(getCurrentMonthYearString());
    
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        months.add(t.date.substring(0, 7));
      }
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filter transactions for the selected month-year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonthYear));
  }, [transactions, selectedMonthYear]);

  // Calculations for current month
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const categories: { [key: string]: number } = {};
    let totalExpense = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
        totalExpense += t.amount;
      }
    });

    const list = Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
    }));

    // Sort descending by value
    return list.sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Group transactions by full date for daily display
  const groupedByDay = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};

    filteredTransactions.forEach(t => {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    });

    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({
        date,
        items: groups[date].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      }));
  }, [filteredTransactions]);

  // Navigate between months
  const handlePrevMonth = () => {
    const currentIdx = availableMonths.indexOf(selectedMonthYear);
    if (currentIdx < availableMonths.length - 1) {
      setSelectedMonthYear(availableMonths[currentIdx + 1]);
    } else {
      // Calculate previous month mathematically
      const [year, month] = selectedMonthYear.split('-').map(Number);
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
      setSelectedMonthYear(prevStr);
    }
  };

  const handleNextMonth = () => {
    const currentIdx = availableMonths.indexOf(selectedMonthYear);
    if (currentIdx > 0) {
      setSelectedMonthYear(availableMonths[currentIdx - 1]);
    } else {
      // Calculate next month mathematically
      const [year, month] = selectedMonthYear.split('-').map(Number);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      setSelectedMonthYear(nextStr);
    }
  };

  const formatMonthTitle = (monthYearStr: string) => {
    const [year, month] = monthYearStr.split('-');
    const monthIndex = parseInt(month) - 1;
    return `${PORTUGUESE_MONTHS[monthIndex]} de ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="font-display font-semibold text-slate-800 text-base">
              {formatMonthTitle(selectedMonthYear)}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {transactions.length > 0 && (
          <button
            onClick={onClearAll}
            className="w-full sm:w-auto px-4 py-2 border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zerar Fluxo de Caixa
          </button>
        )}
      </div>

      {/* Totals Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Incomes Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Entradas</span>
            <span className="text-xl font-bold text-emerald-600 tracking-tight block">
              {formatCurrency(totals.income)}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/20 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Saídas</span>
            <span className="text-xl font-bold text-rose-600 tracking-tight block">
              {formatCurrency(totals.expense)}
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/20 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Saldo Mensal</span>
            <span className={`text-xl font-bold tracking-tight block ${
              totals.balance >= 0 ? 'text-indigo-600' : 'text-rose-700'
            }`}>
              {formatCurrency(totals.balance)}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${
            totals.balance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-100 text-rose-700'
          }`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-xl pointer-events-none"></div>
        </div>
      </div>

      {/* Main Breakdown Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Category Expenses (End of the month summary) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-semibold text-slate-800 text-base">
              Gastos por Categoria
            </h3>
            <span className="text-xs text-slate-500 bg-slate-50 py-1 px-2.5 rounded-md font-medium">
              {expensesByCategory.length} {expensesByCategory.length === 1 ? 'categoria' : 'categorias'}
            </span>
          </div>

          {expensesByCategory.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <Inbox className="w-10 h-10 stroke-1.5 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Nenhum gasto registrado neste mês.</p>
              <p className="text-xs mt-1">Insira despesas para gerar o gráfico.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {expensesByCategory.map((item, index) => {
                // Color mapping for progressive beautiful display
                const colors = [
                  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 
                  'bg-sky-500', 'bg-pink-500', 'bg-amber-500', 
                  'bg-emerald-500', 'bg-slate-500'
                ];
                const colorClass = colors[index % colors.length];

                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-normal">{item.percentage.toFixed(0)}%</span>
                        <span className="text-slate-800 font-semibold">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                    {/* Modern dynamic progress bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Daily Expenses (Organized daily list) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-semibold text-slate-800 text-base">
              Lançamentos Diários
            </h3>
            <span className="text-xs text-slate-500 bg-slate-50 py-1 px-2.5 rounded-md font-medium">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {groupedByDay.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400">
              <Inbox className="w-12 h-12 stroke-1.5 text-slate-300 mb-3" />
              <p className="text-sm font-semibold">Nenhum lançamento no período.</p>
              <p className="text-xs mt-1">Use o formulário ao lado para adicionar entradas ou saídas.</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              {groupedByDay.map(group => {
                // Determine group friendly name
                const todayStr = getCurrentLocalDateString();
                let displayDate = formatDate(group.date);
                if (group.date === todayStr) {
                  displayDate = 'Hoje';
                }

                return (
                  <div key={group.date} className="space-y-2">
                    {/* Day header sticky to maintain separation context */}
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 py-1 px-2.5 rounded-lg inline-block">
                      {displayDate}
                    </div>

                    <div className="space-y-1.5">
                      {group.items.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 border border-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              item.type === 'income' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : 'bg-rose-50 text-rose-600'
                            }`}>
                              {item.type === 'income' ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">
                                {item.description}
                              </p>
                              <p className="text-xs text-slate-400 font-medium">
                                {item.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${
                              item.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                            }`}>
                              {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                            </span>
                            
                            {/* Action Buttons, visible on hover desktop, always mobile */}
                            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onEdit(item)}
                                className="p-1 hover:bg-slate-100 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(item.id)}
                                className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
