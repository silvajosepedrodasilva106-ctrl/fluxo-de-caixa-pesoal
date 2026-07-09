import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction, Debt } from './types';

// ---------------- TRANSACTIONS ----------------

/**
 * Fetches transactions for a user.
 * Returns local storage cache first, then can be updated with fresh Firestore data.
 */
export async function getTransactions(userId: string): Promise<Transaction[]> {
  // Always get local first for instant rendering
  const localData = localStorage.getItem(`transactions_${userId}`);
  let transactions: Transaction[] = localData ? JSON.parse(localData) : [];

  try {
    const q = query(collection(db, 'transactions'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const dbTransactions: Transaction[] = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      dbTransactions.push({
        id: docSnapshot.id,
        userId: data.userId || userId,
        type: data.type,
        amount: Number(data.amount),
        description: data.description || '',
        category: data.category || 'Outros',
        date: data.date || '',
        createdAt: data.createdAt || new Date().toISOString()
      } as Transaction);
    });

    // Sort by date descending
    dbTransactions.sort((a, b) => b.date.localeCompare(a.date));

    // Update local storage
    localStorage.setItem(`transactions_${userId}`, JSON.stringify(dbTransactions));
    return dbTransactions;
  } catch (error) {
    console.error("Firestore error fetching transactions, using cached version:", error);
    return transactions;
  }
}

/**
 * Creates or updates a transaction in Firestore and local storage.
 */
export async function saveTransaction(userId: string, transaction: Omit<Transaction, 'userId'> & { userId?: string }): Promise<Transaction> {
  const finalTransaction: Transaction = {
    ...transaction,
    userId: userId,
  };

  // 1. Update Local Storage Cache immediately
  const localData = localStorage.getItem(`transactions_${userId}`);
  let localList: Transaction[] = localData ? JSON.parse(localData) : [];
  
  const existingIdx = localList.findIndex(t => t.id === finalTransaction.id);
  if (existingIdx >= 0) {
    localList[existingIdx] = finalTransaction;
  } else {
    localList.unshift(finalTransaction);
  }
  
  localList.sort((a, b) => b.date.localeCompare(a.date));
  localStorage.setItem(`transactions_${userId}`, JSON.stringify(localList));

  // 2. Save to Firestore in background
  try {
    const docRef = doc(db, 'transactions', finalTransaction.id);
    await setDoc(docRef, finalTransaction);
  } catch (error) {
    console.error("Firestore error saving transaction, but saved locally:", error);
  }

  return finalTransaction;
}

/**
 * Deletes a transaction from Firestore and local storage.
 */
export async function removeTransaction(userId: string, transactionId: string): Promise<void> {
  // 1. Update Local Cache
  const localData = localStorage.getItem(`transactions_${userId}`);
  if (localData) {
    let localList: Transaction[] = JSON.parse(localData);
    localList = localList.filter(t => t.id !== transactionId);
    localStorage.setItem(`transactions_${userId}`, JSON.stringify(localList));
  }

  // 2. Delete from Firestore
  try {
    const docRef = doc(db, 'transactions', transactionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore error deleting transaction, but deleted locally:", error);
  }
}


// ---------------- DEBTS (COBRANÇAS) ----------------

/**
 * Fetches debts for a user.
 * Returns local storage cache first.
 */
export async function getDebts(userId: string): Promise<Debt[]> {
  const localData = localStorage.getItem(`debts_${userId}`);
  let debts: Debt[] = localData ? JSON.parse(localData) : [];

  try {
    const q = query(collection(db, 'debts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const dbDebts: Debt[] = [];
    
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      dbDebts.push({
        id: docSnapshot.id,
        userId: data.userId || userId,
        debtorName: data.debtorName || '',
        amount: Number(data.amount),
        description: data.description || '',
        date: data.date || '',
        dueDate: data.dueDate || '',
        status: data.status || 'pending',
        createdAt: data.createdAt || new Date().toISOString()
      } as Debt);
    });

    // Sort by status ('pending' first) and then by date descending
    dbDebts.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      return b.date.localeCompare(a.date);
    });

    localStorage.setItem(`debts_${userId}`, JSON.stringify(dbDebts));
    return dbDebts;
  } catch (error) {
    console.error("Firestore error fetching debts, using cached version:", error);
    return debts;
  }
}

/**
 * Creates or updates a debt in Firestore and local storage.
 */
export async function saveDebt(userId: string, debt: Omit<Debt, 'userId'> & { userId?: string }): Promise<Debt> {
  const finalDebt: Debt = {
    ...debt,
    userId: userId,
  };

  // 1. Update Local Storage Cache immediately
  const localData = localStorage.getItem(`debts_${userId}`);
  let localList: Debt[] = localData ? JSON.parse(localData) : [];
  
  const existingIdx = localList.findIndex(d => d.id === finalDebt.id);
  if (existingIdx >= 0) {
    localList[existingIdx] = finalDebt;
  } else {
    localList.unshift(finalDebt);
  }
  
  localList.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    return b.date.localeCompare(a.date);
  });
  localStorage.setItem(`debts_${userId}`, JSON.stringify(localList));

  // 2. Save to Firestore
  try {
    const docRef = doc(db, 'debts', finalDebt.id);
    await setDoc(docRef, finalDebt);
  } catch (error) {
    console.error("Firestore error saving debt, but saved locally:", error);
  }

  return finalDebt;
}

/**
 * Deletes a debt from Firestore and local storage.
 */
export async function removeDebt(userId: string, debtId: string): Promise<void> {
  // 1. Update Local Cache
  const localData = localStorage.getItem(`debts_${userId}`);
  if (localData) {
    let localList: Debt[] = JSON.parse(localData);
    localList = localList.filter(d => d.id !== debtId);
    localStorage.setItem(`debts_${userId}`, JSON.stringify(localList));
  }

  // 2. Delete from Firestore
  try {
    const docRef = doc(db, 'debts', debtId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore error deleting debt, but deleted locally:", error);
  }
}
