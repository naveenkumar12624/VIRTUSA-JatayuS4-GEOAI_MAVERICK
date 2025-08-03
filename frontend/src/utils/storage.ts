import { Transaction, User } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'gpay_transactions',
  USER: 'gpay_user',
  CHAT_HISTORY: 'gpay_chat_history'
};

export const saveTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
};

export const loadTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.map((t: any) => ({
      ...t,
      timestamp: new Date(t.timestamp)
    }));
  }
  return [];
};

export const addTransaction = (transaction: Transaction): void => {
  const transactions = loadTransactions();
  transactions.unshift(transaction);
  saveTransactions(transactions);
};

export const saveUser = (user: User): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const loadUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

export const saveChatHistory = (messages: any[]): void => {
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
};

export const loadChatHistory = (): any[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
  }
  return [];
};