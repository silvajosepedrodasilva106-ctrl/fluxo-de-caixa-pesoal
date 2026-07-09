import React, { useState, useEffect } from 'react';
import { Debt, DebtStatus } from '../types';
import { getCurrentLocalDateString, generateId } from '../utils';
import { Check, X, UserMinus, Calendar } from 'lucide-react';

interface DebtFormProps {
  userId: string;
  onSave: (debt: Debt) => void;
  editingDebt?: Debt | null;
  onCancelEdit?: () => void;
}

export default function DebtForm({
  userId,
  onSave,
  editingDebt,
  onCancelEdit
}: DebtFormProps) {
  const [debtorName, setDebtorName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getCurrentLocalDateString());
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<DebtStatus>('pending');
  const [error, setError] = useState('');

  // Handle editing load
  useEffect(() => {
    if (editingDebt) {
      setDebtorName(editingDebt.debtorName);
      setAmount(editingDebt.amount.toString());
      setDescription(editingDebt.description);
      setDate(editingDebt.date);
      setDueDate(editingDebt.dueDate || '');
      setStatus(editingDebt.status);
    } else {
      resetForm();
    }
  }, [editingDebt]);

  const resetForm = () => {
    setDebtorName('');
    setAmount('');
    setDescription('');
    setDate(getCurrentLocalDateString());
    setDueDate('');
    setStatus('pending');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!debtorName.trim()) {
      setError('O nome do devedor é obrigatório.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Por favor, insira um valor válido e maior que zero.');
      return;
    }

    if (!date) {
      setError('A data inicial é obrigatória.');
      return;
    }

    const savedDebt: Debt = {
      id: editingDebt?.id || generateId(),
      userId,
      debtorName: debtorName.trim(),
      amount: numericAmount,
      description: description.trim(),
      date,
      status,
      createdAt: editingDebt?.createdAt || new Date().toISOString()
    };

    if (dueDate) {
      savedDebt.dueDate = dueDate;
    }

    onSave(savedDebt);
    resetForm();
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
      <h3 className="font-display font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
        {editingDebt ? 'Editar Cobrança' : 'Nova Cobrança'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            {error}
          </div>
        )}

        {/* Debtor Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Quem está devendo? (Nome) *
          </label>
          <input
            type="text"
            placeholder="Ex: João Silva, Maria Oliveira..."
            value={debtorName}
            onChange={(e) => setDebtorName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 font-medium"
            maxLength={50}
          />
        </div>

        {/* Amount Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Valor Emprestado/Devido (R$) *
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

        {/* Description Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Descrição / Motivo
          </label>
          <input
            type="text"
            placeholder="Ex: Empréstimo para almoço, Uber, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
            maxLength={100}
          />
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Data do Empréstimo *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Data Limite / Vencimento (Opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Status Toggle (for edit mode primarily, but useful overall) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Status do Pagamento
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('pending')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                status === 'pending'
                  ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Pendente (Devendo)
            </button>
            <button
              type="button"
              onClick={() => setStatus('paid')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                status === 'paid'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Pago (Quitado)
            </button>
          </div>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="flex gap-2 pt-2">
          {editingDebt && (
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
            {editingDebt ? 'Salvar Alteração' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
