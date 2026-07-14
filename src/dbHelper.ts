import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Transaction, Debt } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  } catch (error: any) {
    console.error("Firestore error fetching transactions, using cached version:", error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    }
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
  } catch (error: any) {
    console.error("Firestore error saving transaction, but saved locally:", error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      handleFirestoreError(error, OperationType.WRITE, `transactions/${finalTransaction.id}`);
    }
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
  } catch (error: any) {
    console.error("Firestore error deleting transaction, but deleted locally:", error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${transactionId}`);
    }
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
  } catch (error: any) {
    console.error("Firestore error fetching debts, using cached version:", error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      handleFirestoreError(error, OperationType.LIST, 'debts');
    }
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
  } catch (error: any) {
    console.error("Firestore error saving debt, but saved locally:", error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      handleFirestoreError(error, OperationType.WRITE, `debts/${finalDebt.id}`);
    }
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
  } catch (error: any) {
    console.error("Firestore error deleting debt, but deleted locally:", error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      handleFirestoreError(error, OperationType.DELETE, `debts/${debtId}`);
    }
  }
}

/**
 * Fetches the custom admin password for the user. If not found, returns the default 'admin 123'.
 */
export async function getAdminPassword(userId: string): Promise<string> {
  const localPw = localStorage.getItem(`admin_password_${userId}`);
  if (localPw) {
    return localPw;
  }

  try {
    const docRef = doc(db, 'settings', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.password) {
        localStorage.setItem(`admin_password_${userId}`, data.password);
        return data.password;
      }
    }
  } catch (error: any) {
    console.error("Error fetching admin settings from Firestore, using local default:", error);
  }

  // Default password if not found anywhere
  return 'admin 123';
}

/**
 * Saves a new custom admin password for the user in both local storage and Firestore.
 */
export async function saveAdminPassword(userId: string, newPassword: string): Promise<void> {
  localStorage.setItem(`admin_password_${userId}`, newPassword);

  try {
    const docRef = doc(db, 'settings', userId);
    await setDoc(docRef, {
      userId,
      password: newPassword,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error saving admin settings to Firestore:", error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${userId}`);
    }
  }
}
