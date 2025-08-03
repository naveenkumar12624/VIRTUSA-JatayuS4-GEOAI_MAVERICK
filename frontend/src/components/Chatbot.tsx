import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage, User, LoanInfo } from '../types';
import { ArrowLeft, Send, Bot, User as UserIcon, Mic, Paperclip as PaperClip } from 'lucide-react';

interface ChatbotProps {
  user: User;
  transactions: Transaction[];
  loanInfo: LoanInfo;
  onBack: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({
  user,
  transactions,
  loanInfo,
  onBack
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: `Hello ${user.name}! I'm your financial assistant. I can help you analyze your spending, track your transactions, provide insights about your loan, and answer any financial questions. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const analyzeSpending = (category?: string, timeframe?: string) => {
    const now = new Date();
    let filteredTransactions = transactions.filter(t => t.type === 'expense' || t.type === 'sent' || t.type === 'loan_payment');

    // Apply time filter
    if (timeframe === 'month') {
      filteredTransactions = filteredTransactions.filter(t => 
        t.timestamp.getMonth() === now.getMonth() && 
        t.timestamp.getFullYear() === now.getFullYear()
      );
    } else if (timeframe === '3months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      filteredTransactions = filteredTransactions.filter(t => t.timestamp >= threeMonthsAgo);
    }

    // Apply category filter
    if (category) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryBreakdown: { [key: string]: number } = {};
    
    filteredTransactions.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    return { total, categoryBreakdown, count: filteredTransactions.length, transactions: filteredTransactions };
  };

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Balance inquiry
    if (message.includes('balance') || message.includes('money') && message.includes('have')) {
      return `Your current balance is ${formatCurrency(user.balance)}. You're doing great with your finances!`;
    }

    // Spending analysis
    if (message.includes('spending') || message.includes('spent') || message.includes('expenses')) {
      if (message.includes('month') || message.includes('this month')) {
        const analysis = analyzeSpending(undefined, 'month');
        const topCategories = Object.entries(analysis.categoryBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);
        
        let response = `This month you've spent ${formatCurrency(analysis.total)} across ${analysis.count} transactions.\n\nTop spending categories:\n`;
        topCategories.forEach(([category, amount], index) => {
          response += `${index + 1}. ${category}: ${formatCurrency(amount)}\n`;
        });
        return response;
      } else if (message.includes('3 months') || message.includes('three months')) {
        const analysis = analyzeSpending(undefined, '3months');
        return `Over the last 3 months, you've spent ${formatCurrency(analysis.total)} across ${analysis.count} transactions. Your average monthly spending is ${formatCurrency(analysis.total / 3)}.`;
      }
    }

    // Category-specific spending
    if (message.includes('restaurant') || message.includes('food') || message.includes('dining')) {
      const analysis = analyzeSpending('restaurant', '3months');
      return `In the last 3 months, you've spent ${formatCurrency(analysis.total)} on restaurants and food delivery. That's an average of ${formatCurrency(analysis.total / 3)} per month. Your most recent food expenses were through Zomato and other restaurant platforms.`;
    }

    if (message.includes('shopping') || message.includes('clothes') || message.includes('dress')) {
      const analysis = analyzeSpending('dress', '3months');
      return `Your clothing and shopping expenses for the last 3 months total ${formatCurrency(analysis.total)}. This includes purchases from Myntra, Zara, H&M, and other fashion retailers.`;
    }

    if (message.includes('entertainment') || message.includes('movie') || message.includes('theatre')) {
      const analysis = analyzeSpending('theatre', '3months');
      return `You've spent ${formatCurrency(analysis.total)} on entertainment and movies in the last 3 months. This includes tickets from PVR, INOX, and BookMyShow.`;
    }

    // Loan information
    if (message.includes('loan') || message.includes('emi') || message.includes('debt')) {
      return `Your home loan details:\n• Principal: ${formatCurrency(loanInfo.principal)}\n• Monthly Interest: ${formatCurrency(loanInfo.monthlyInterest)}\n• Total Paid So Far: ${formatCurrency(loanInfo.totalPaid)}\n• Remaining Balance: ${formatCurrency(loanInfo.remainingBalance)}\n• Next Payment Due: ${loanInfo.nextPaymentDate.toLocaleDateString()}\n\nYou're making good progress on your loan payments!`;
    }

    // Recent transactions
    if (message.includes('recent') || message.includes('latest') || message.includes('last transaction')) {
      const recentTransactions = transactions.slice(0, 5);
      let response = "Here are your 5 most recent transactions:\n\n";
      recentTransactions.forEach((t, index) => {
        const sign = t.type === 'received' ? '+' : '-';
        response += `${index + 1}. ${t.description}\n   ${sign}${formatCurrency(t.amount)} • ${t.timestamp.toLocaleDateString()}\n\n`;
      });
      return response;
    }

    // Financial advice
    if (message.includes('advice') || message.includes('save') || message.includes('budget')) {
      const monthlySpending = analyzeSpending(undefined, 'month').total;
      const monthlyIncome = transactions
        .filter(t => t.type === 'received' && t.timestamp.getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
      
      return `Based on your spending patterns:\n\n• This month's expenses: ${formatCurrency(monthlySpending)}\n• This month's income: ${formatCurrency(monthlyIncome)}\n\n💡 Financial Tips:\n• Try to keep dining expenses under 20% of income\n• Consider setting aside 20% for savings\n• Your loan payments are on track\n• Look for ways to reduce impulse shopping\n\nYou're managing your finances well overall!`;
    }

    // Default responses
    const responses = [
      "I can help you analyze your spending, check your balance, review recent transactions, or provide insights about your loan. What would you like to know?",
      "I have access to all your transaction data and can provide detailed financial insights. Try asking about your monthly spending, loan status, or recent transactions.",
      "As your financial assistant, I can help with budgeting advice, spending analysis, and transaction history. What financial information do you need?",
      "I'm here to help with your financial questions! I can analyze your spending patterns, show recent transactions, or discuss your loan details."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: generateBotResponse(inputMessage),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What's my current balance?",
    "Show my recent transactions",
    "How much did I spend this month?",
    "Tell me about my loan status",
    "Food and restaurant expenses",
    "Give me financial advice"
  ];

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <div className="bg-white rounded-t-2xl shadow-xl flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <Bot size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Financial Assistant</h1>
                <p className="text-purple-100 text-sm">AI-powered financial insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`p-2 rounded-full ${
                  message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  {message.type === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="whitespace-pre-line">{message.message}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-3xl">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
                  <Bot size={20} />
                </div>
                <div className="bg-gray-100 p-4 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-600 mb-3">Quick questions you can ask:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your finances..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <PaperClip size={20} />
              </button>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <Mic size={20} />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};