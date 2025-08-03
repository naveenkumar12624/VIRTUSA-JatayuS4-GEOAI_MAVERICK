import React from 'react';
import { User, Transaction, LoanInfo } from '../types';
import { CreditCard, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  loanInfo: LoanInfo;
  onSendMoney: () => void;
  onViewTransactions: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  transactions,
  loanInfo,
  onSendMoney,
  onViewTransactions
}) => {
  const recentTransactions = transactions.slice(0, 5);
  const thisMonthExpenses = transactions
    .filter(t => {
      const now = new Date();
      const transactionMonth = t.timestamp.getMonth();
      const transactionYear = t.timestamp.getFullYear();
      return transactionMonth === now.getMonth() && 
             transactionYear === now.getFullYear() && 
             (t.type === 'expense' || t.type === 'sent');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthIncome = transactions
    .filter(t => {
      const now = new Date();
      const transactionMonth = t.timestamp.getMonth();
      const transactionYear = t.timestamp.getFullYear();
      return transactionMonth === now.getMonth() && 
             transactionYear === now.getFullYear() && 
             t.type === 'received';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name}</h1>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(user.balance)}</p>
          </div>
          <CreditCard size={48} className="text-blue-200" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onSendMoney}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <ArrowUpRight className="text-blue-600" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Send Money</p>
              <p className="text-sm text-gray-500">Transfer to contacts</p>
            </div>
          </div>
        </button>

        <button
          onClick={onViewTransactions}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-full">
              <ArrowDownRight className="text-green-600" size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Transactions</p>
              <p className="text-sm text-gray-500">View history</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month Spent</p>
              <p className="text-xl font-bold text-red-600">{formatAmount(thisMonthExpenses)}</p>
            </div>
            <TrendingDown className="text-red-500" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month Received</p>
              <p className="text-xl font-bold text-green-600">{formatAmount(thisMonthIncome)}</p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Loan Remaining</p>
              <p className="text-xl font-bold text-orange-600">{formatAmount(loanInfo.remainingBalance)}</p>
            </div>
            <PiggyBank className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* Loan Information */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
        <h3 className="text-lg font-semibold text-orange-900 mb-4">Home Loan Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-orange-700">Principal Amount</p>
            <p className="font-bold text-orange-900">{formatCurrency(loanInfo.principal)}</p>
          </div>
          <div>
            <p className="text-sm text-orange-700">Monthly Interest</p>
            <p className="font-bold text-orange-900">{formatCurrency(loanInfo.monthlyInterest)}</p>
          </div>
          <div>
            <p className="text-sm text-orange-700">Total Paid</p>
            <p className="font-bold text-orange-900">{formatCurrency(loanInfo.totalPaid)}</p>
          </div>
          <div>
            <p className="text-sm text-orange-700">Next Payment</p>
            <p className="font-bold text-orange-900">{loanInfo.nextPaymentDate.toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button
            onClick={onViewTransactions}
            className="text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'received' ? 'bg-green-100' :
                  transaction.type === 'sent' ? 'bg-blue-100' :
                  transaction.type === 'loan_payment' ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  {transaction.type === 'received' ? (
                    <ArrowDownRight className="text-green-600" size={16} />
                  ) : transaction.type === 'sent' ? (
                    <ArrowUpRight className="text-blue-600" size={16} />
                  ) : transaction.type === 'loan_payment' ? (
                    <PiggyBank className="text-orange-600" size={16} />
                  ) : (
                    <CreditCard className="text-gray-600" size={16} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.timestamp.toLocaleDateString()}</p>
                </div>
              </div>
              <p className={`font-bold ${
                transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};