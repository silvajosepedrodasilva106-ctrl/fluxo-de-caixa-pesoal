export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export type DebtStatus = 'pending' | 'paid';

export interface Debt {
  id: string;
  userId: string;
  debtorName: string;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  status: DebtStatus;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Serviços/Contas',
  'Outros'
];

export const INCOME_CATEGORIES = [
  'Salário',
  'Investimentos',
  'Freelance',
  'Empréstimo Recebido',
  'Outros'
];
