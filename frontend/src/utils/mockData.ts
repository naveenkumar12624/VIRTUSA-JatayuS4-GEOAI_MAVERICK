import { Transaction, Contact, User, LoanInfo } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'You',
  email: 'user@example.com',
  phone: '+91 9876543210',
  balance: 45678.50
};

export const mockContacts: Contact[] = [
  { id: '1', name: 'SANJAY', phone: '+91 9876543211' },
  { id: '2', name: 'NAVEEN', phone: '+91 9876543212' },
  { id: '3', name: 'YOGESH', phone: '+91 9876543213' },
  { id: '4', name: 'ROHITH', phone: '+91 9876543214' }
];

export const mockLoanInfo: LoanInfo = {
  principal: 1500000, // 15 lakh
  monthlyInterest: 25000,
  totalPaid: 75000, // 3 months paid
  remainingBalance: 1425000,
  nextPaymentDate: new Date(2025, 0, 15) // 15th Jan 2025
};

// Generate mock transactions for last 3 months
export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const categories = [
    { name: 'Restaurant', merchants: ['Zomato', 'Swiggy', 'Pizza Hut', 'McDonald\'s', 'Cafe Coffee Day'] },
    { name: 'Theatre', merchants: ['PVR Cinemas', 'INOX', 'Multiplex', 'BookMyShow'] },
    { name: 'Mall', merchants: ['Phoenix Mall', 'Forum Mall', 'Mantri Square', 'UB City Mall'] },
    { name: 'Dresses', merchants: ['Myntra', 'Flipkart Fashion', 'Zara', 'H&M', 'Pantaloons'] },
    { name: 'Groceries', merchants: ['BigBasket', 'Grofers', 'DMart', 'Reliance Fresh'] },
    { name: 'Transport', merchants: ['Uber', 'Ola', 'Metro', 'Bus Pass'] },
    { name: 'Utilities', merchants: ['Electricity Bill', 'Water Bill', 'Internet Bill', 'Mobile Recharge'] }
  ];

  let id = 1;
  const now = new Date();
  
  // Generate loan payment transactions for last 3 months
  for (let i = 0; i < 3; i++) {
    const paymentDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
    transactions.push({
      id: (id++).toString(),
      type: 'loan_payment',
      amount: 25000,
      description: 'Home Loan EMI Payment',
      category: 'Loan',
      timestamp: paymentDate,
      status: 'completed'
    });
  }

  // Generate random transactions for last 3 months
  for (let month = 0; month < 3; month++) {
    const transactionsInMonth = Math.floor(Math.random() * 25) + 15; // 15-40 transactions per month
    
    for (let i = 0; i < transactionsInMonth; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const merchant = category.merchants[Math.floor(Math.random() * category.merchants.length)];
      const day = Math.floor(Math.random() * 28) + 1;
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      
      const transactionDate = new Date(now.getFullYear(), now.getMonth() - month, day, hour, minute);
      const amount = Math.floor(Math.random() * 5000) + 100; // ₹100 to ₹5100
      
      transactions.push({
        id: (id++).toString(),
        type: 'expense',
        amount,
        description: `Payment to ${merchant}`,
        category: category.name,
        timestamp: transactionDate,
        status: 'completed'
      });
    }
  }

  // Add some money transfer transactions
  const contacts = mockContacts;
  for (let i = 0; i < 8; i++) {
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const day = Math.floor(Math.random() * 90); // Last 90 days
    const transactionDate = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
    const amount = Math.floor(Math.random() * 10000) + 500; // ₹500 to ₹10500
    const isSent = Math.random() > 0.3; // 70% sent, 30% received
    
    transactions.push({
      id: (id++).toString(),
      type: isSent ? 'sent' : 'received',
      amount,
      description: isSent ? `Sent to ${contact.name}` : `Received from ${contact.name}`,
      category: 'Transfer',
      contactId: contact.id,
      contactName: contact.name,
      timestamp: transactionDate,
      status: 'completed'
    });
  }

  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};