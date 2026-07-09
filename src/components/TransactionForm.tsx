import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { getCurrentLocalDateString, generateId } from '../utils';
import { Plus, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionFormProps {
  userId: string;
  onSave: (transaction: Transaction) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

export default function TransactionForm({
  userId,
  onSave,
  editingTransaction,
  onCancelEdit
}: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(getCurrentLocalDateString());
  const [error, setError] = useState('');

  // Handle editing transaction load
  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  // Set default category when type changes
  useEffect(() => {
    if (!editingTransaction) {
      const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      setCategory(categories[0]);
    }
  }, [type, editingTransaction]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory(EXPENSE_CATEGORIES[0]);
    setDate(getCurrentLocalDateString());
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Por favor, insira um valor válido e maior que zero.');
      return;
    }

    if (!date) {
      setError('A data é obrigatória.');
      return;
    }

    const savedTransaction: Transaction = {
      id: editingTransaction?.id || generateId(),
      userId,
      type,
      amount: numericAmount,
      description: description.trim(),
      category,
      date,
      createdAt: editingTransaction?.createdAt || new Date().toISOString()
    };

    onSave(savedTransaction);
    resetForm();
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
      <h3 className="font-display font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
        {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            {error}
          </div>
        )}

        {/* Type selector (Income vs Expense) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Saída / Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Entrada / Receita
          </button>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Descrição *
          </label>
          <input
            type="text"
            placeholder="Ex: Supermercado, Aluguel, Salário..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
            maxLength={60}
          />
        </div>

        {/* Amount & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-medium">R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Data *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Category Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all font-medium cursor-pointer"
          >
            {type === 'expense'
              ? EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              : INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          {editingTransaction && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-2 px-4 border border-slate-200 rounded-xl font-medium text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {editingTransaction ? 'Salvar Alteração' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  );
}
