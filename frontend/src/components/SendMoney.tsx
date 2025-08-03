import React, { useState, useEffect } from 'react';
import { Transaction, User } from '../types';
import { createTransaction, updateUserBalance, searchUsers, getUserProfile } from '../lib/supabase';
import { ArrowLeft, Send, User as UserIcon, Phone, Check, Search, Users } from 'lucide-react';

interface SendMoneyProps {
  user: User;
  onBack: () => void;
  onSendMoney: (transaction: Transaction) => void;
  onUpdateUser: (user: User) => void;
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export const SendMoney: React.FC<SendMoneyProps> = ({
  user,
  onBack,
  onSendMoney,
  onUpdateUser
}) => {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await searchUsers(query, user.id);
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (selectedUser: UserSearchResult) => {
    setSelectedUser(selectedUser);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSendMoney = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) return;

    const transferAmount = parseFloat(amount);
    
    if (transferAmount > user.balance) {
      alert('Insufficient balance!');
      return;
    }

    setIsProcessing(true);

    try {
      // Create transaction in database for sender
      const { data: transactionData, error: transactionError } = await createTransaction({
        type: 'sent',
        amount: transferAmount,
        description: description || `Sent to ${selectedUser.name}`,
        category: 'Transfer',
        contact_id: selectedUser.id,
        contact_name: selectedUser.name
      });

      if (transactionError) throw transactionError;

      // Update sender's balance
      const newBalance = user.balance - transferAmount;
      const { error: balanceError } = await updateUserBalance(user.id, newBalance);
      
      if (balanceError) throw balanceError;

      // Update local state
      const transaction: Transaction = {
        id: transactionData.id,
        type: 'sent',
        amount: transferAmount,
        description: description || `Sent to ${selectedUser.name}`,
        category: 'Transfer',
        contactId: selectedUser.id,
        contactName: selectedUser.name,
        timestamp: new Date(transactionData.created_at),
        status: 'completed'
      };

      const updatedUser = {
        ...user,
        balance: newBalance
      };

      onSendMoney(transaction);
      onUpdateUser(updatedUser);
      
      setIsProcessing(false);
      setIsSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedUser(null);
        setAmount('');
        setDescription('');
        setShowSearch(true);
      }, 3000);
    } catch (error) {
      console.error('Error sending money:', error);
      alert('Failed to send money. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            {formatCurrency(parseFloat(amount))} sent to {selectedUser?.name}
          </p>
          <p className="text-sm text-gray-500">Transaction completed successfully</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment...</h2>
          <p className="text-gray-600">Please wait while we process your transaction</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
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
            <h1 className="text-xl font-bold">Send Money</h1>
          </div>
          <div className="mt-4">
            <p className="text-blue-100 text-sm">Available Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(user.balance)}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Selection */}
          {showSearch ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Users className="inline mr-2" size={16} />
                Find User to Send Money
              </label>
              
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((searchUser) => (
                    <button
                      key={searchUser.id}
                      onClick={() => handleSelectUser(searchUser)}
                      className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                          <UserIcon className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{searchUser.name}</p>
                          <p className="text-sm text-gray-500">{searchUser.email}</p>
                          {searchUser.phone && (
                            <p className="text-sm text-gray-500">{searchUser.phone}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No users found matching "{searchQuery}"</p>
                  <p className="text-sm">Try searching with a different name, email, or phone number</p>
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8 text-gray-500">
                  <Search size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Start typing to search for users</p>
                  <p className="text-sm">Search by name, email, or phone number</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sending Money To
              </label>
              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
                      <UserIcon className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedUser?.name}</p>
                      <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                      {selectedUser?.phone && (
                        <p className="text-sm text-gray-500">{selectedUser.phone}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setShowSearch(true);
                    }}
                    className="text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          {selectedUser && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                {amount && parseFloat(amount) > user.balance && (
                  <p className="text-red-500 text-sm mt-2">Insufficient balance</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMoney}
                disabled={!selectedUser || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > user.balance}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Send size={20} />
                <span>Send {amount ? formatCurrency(parseFloat(amount)) : 'Money'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};