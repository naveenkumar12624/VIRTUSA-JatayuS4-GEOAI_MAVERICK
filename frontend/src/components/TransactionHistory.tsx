import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownRight, CreditCard, PiggyBank, Calendar } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onBack: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));
    return ['all', ...uniqueCategories];
  }, [transactions]);

  const months = useMemo(() => {
    const uniqueMonths = Array.from(new Set(
      transactions.map(t => `${t.timestamp.getFullYear()}-${t.timestamp.getMonth()}`)
    ));
    return ['all', ...uniqueMonths];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (transaction.contactName && transaction.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      
      const matchesMonth = selectedMonth === 'all' || 
                          `${transaction.timestamp.getFullYear()}-${transaction.timestamp.getMonth()}` === selectedMonth;
      
      return matchesSearch && matchesCategory && matchesMonth;
    });
  }, [transactions, searchTerm, selectedCategory, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'received':
        return <ArrowDownRight className="text-green-600" size={20} />;
      case 'sent':
        return <ArrowUpRight className="text-blue-600" size={20} />;
      case 'loan_payment':
        return <PiggyBank className="text-orange-600" size={20} />;
      default:
        return <CreditCard className="text-gray-600" size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'received':
        return 'text-green-600';
      case 'sent':
      case 'expense':
      case 'loan_payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTotalsByCategory = () => {
    const totals: { [key: string]: number } = {};
    filteredTransactions.forEach(t => {
      if (t.type !== 'received') {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    });
    return totals;
  };

  const categoryTotals = getTotalsByCategory();

  const formatMonthName = (monthKey: string) => {
    if (monthKey === 'all') return 'All Months';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month));
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Transaction History</h1>
          </div>
          <p className="text-blue-100 mt-2">{filteredTransactions.length} transactions found</p>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month} value={month}>
                      {formatMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Summary */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Spending by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([category, total]) => (
                    <div key={category} className="text-center">
                      <p className="text-sm text-gray-600">{category}</p>
                      <p className="font-bold text-red-600">{formatCurrency(total)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${
                        transaction.type === 'received' ? 'bg-green-100' :
                        transaction.type === 'sent' ? 'bg-blue-100' :
                        transaction.type === 'loan_payment' ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-500">{transaction.category}</p>
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Calendar size={12} />
                            <span>{transaction.timestamp.toLocaleDateString('en-IN')}</span>
                            <span>{transaction.timestamp.toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};