import React, { useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { User, Transaction, LoanInfo, Agent } from './types';
import { Dashboard } from './components/Dashboard';
import { SendMoney } from './components/SendMoney';
import { TransactionHistory } from './components/TransactionHistory';
import { ChatInterface } from './components/AIChat/ChatInterface';
import { VoiceChannel } from './components/VoiceChannel/VoiceChannel';
import { Login } from './components/Auth/Login';
import { AgentDashboard } from './components/AgentDashboard/AgentDashboard';
import { supabase, getUserProfile, createUserProfile, getTransactions, checkUserRole, updateAgentStatus, clearInvalidSession } from './lib/supabase';
import { mockLoanInfo } from './utils/mockData';
import { Home, Send, History, MessageCircle, Mic, Menu, X, LogOut, Users } from 'lucide-react';

type View = 'dashboard' | 'send' | 'history' | 'chat' | 'voice' | 'agent';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(mockLoanInfo);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'agent' | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          // If there's an auth error, clear any invalid session data
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            await clearInvalidSession();
          }
          setAuthUser(null);
        } else {
          setAuthUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setAuthUser(session?.user ?? null);
        
        // Handle user profile creation for Google sign-in
        if (session?.user && event === 'SIGNED_IN') {
          await handleUserProfileCreation(session.user);
        }
        
        // Clear user data on sign out
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setTransactions([]);
          setAgent(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // If there's an auth error, clear session and redirect to login
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('Invalid Refresh Token')) {
          await clearInvalidSession();
          setAuthUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile and transactions when authenticated
  useEffect(() => {
    if (authUser) {
      determineUserRole();
    } else {
      setUser(null);
      setTransactions([]);
      setAgent(null);
      setUserRole(null);
    }
  }, [authUser]);

  const determineUserRole = async () => {
    if (!authUser?.email) return;

    // Check if user is an agent
    const { data: agentData, error: agentError } = await checkUserRole(authUser.email);
    
    if (agentData && !agentError) {
      // User is an agent
      setAgent(agentData);
      setUserRole('agent');
      // Set agent as online
      await updateAgentStatus(agentData.id, true, false);
    } else {
      // User is a regular user
      setUserRole('user');
      await loadUserData();
    }
  };

  const handleUserProfileCreation = async (authUser: AuthUser) => {
    try {
      // Check if user profile exists
      let { data: existingProfile, error } = await getUserProfile(authUser.id);
      
      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create profile
        const name = authUser.user_metadata?.name || 
                    authUser.user_metadata?.full_name || 
                    authUser.email?.split('@')[0] || 
                    'User';
        
        const phone = authUser.user_metadata?.phone || 
                     authUser.phone || 
                     null; // Allow null phone for Google sign-in users
        
        const { data: newProfile, error: createError } = await createUserProfile(authUser.id, {
          name,
          email: authUser.email || '',
          phone,
          balance: 45678.50
        });
        
        if (createError) {
          console.error('Error creating user profile:', createError);
          throw createError;
        }
        
        existingProfile = newProfile;
      }
      
      // Reload user data after profile creation
      if (existingProfile) {
        await loadUserData();
      }
    } catch (error) {
      console.error('Error handling user profile creation:', error);
    }
  };

  const loadUserData = async () => {
    if (!authUser) return;

    try {
      // Get or create user profile
      let { data: profile, error } = await getUserProfile(authUser.id);
      
      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create profile
        const name = authUser.user_metadata?.name || 
                    authUser.user_metadata?.full_name || 
                    authUser.email?.split('@')[0] || 
                    'User';
        
        const phone = authUser.user_metadata?.phone || 
                     authUser.phone || 
                     '+91 9876543210';
        
        const { data: newProfile, error: createError } = await createUserProfile(authUser.id, {
          name,
          email: authUser.email || '',
          phone,
          balance: 45678.50
        });
        
        if (createError) throw createError;
        profile = newProfile;
      } else if (error) {
        throw error;
      }

      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          balance: profile.balance
        });
      }

      // Load transactions
      const { data: transactionData, error: transactionError } = await getTransactions();
      if (transactionError) throw transactionError;

      if (transactionData) {
        const formattedTransactions: Transaction[] = transactionData.map(t => ({
          id: t.id,
          type: t.type as 'sent' | 'received' | 'expense' | 'loan_payment',
          amount: t.amount,
          description: t.description,
          category: t.category,
          contactId: t.contact_id || undefined,
          contactName: t.contact_name || undefined,
          timestamp: new Date(t.created_at),
          status: t.status as 'completed' | 'pending' | 'failed'
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = async () => {
    // Set agent as offline if they're an agent
    if (agent) {
      await updateAgentStatus(agent.id, false, false);
    }
    await supabase.auth.signOut();
  };

  const handleSendMoney = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const userNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'send', label: 'Send', icon: Send },
    { id: 'history', label: 'History', icon: History },
    { id: 'chat', label: 'AI Assistant', icon: MessageCircle },
    { id: 'voice', label: 'Voice Chat', icon: Mic },
  ];

  const agentNavItems = [
    { id: 'agent', label: 'Agent Dashboard', icon: Users },
  ];

  const navItems = userRole === 'agent' ? agentNavItems : userNavItems;

  const renderCurrentView = () => {
    if (userRole === 'agent' && agent) {
      return <AgentDashboard agent={agent} />;
    }

    if (!user) return null;

    switch (currentView) {
      case 'send':
        return (
          <SendMoney
            user={user}
            onBack={() => setCurrentView('dashboard')}
            onSendMoney={handleSendMoney}
            onUpdateUser={handleUpdateUser}
          />
        );
      case 'history':
        return (
          <TransactionHistory
            transactions={transactions}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'chat':
        return (
          <ChatInterface
            user={user}
            transactions={transactions}
            loanInfo={loanInfo}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'voice':
        return (
          <VoiceChannel
            onBack={() => setCurrentView('dashboard')}
            user={user}
          />
        );
      default:
        return (
          <Dashboard
            user={user}
            transactions={transactions}
            loanInfo={loanInfo}
            onSendMoney={() => setCurrentView('send')}
            onViewTransactions={() => setCurrentView('history')}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <Login onAuthSuccess={async () => {
      // Refresh the session after successful login
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user ?? null);
    }} />;
  }

  // Show loading while determining role
  if (userRole === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {userRole === 'agent' ? 'Agent Portal' : 'FinancePay'}
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <LogOut size={20} />
          </button>
          {userRole === 'user' && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && userRole === 'user' && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900">FinancePay</h2>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {userRole === 'user' && (
          <div className="hidden lg:block w-64 bg-white shadow-lg h-screen sticky top-0">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-8">FinancePay</h1>
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as View)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        currentView === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              {/* User Info & Sign Out */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                {user && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.phone && (
                      <p className="text-xs text-gray-500">{user.phone}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Sidebar */}
        {userRole === 'agent' && (
          <div className="hidden lg:block w-64 bg-white shadow-lg h-screen sticky top-0">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-8">Agent Portal</h1>
              
              {/* Agent Info & Sign Out */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                {agent && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className={`w-2 h-2 rounded-full ${agent.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-xs text-gray-500">
                        {agent.is_online ? (agent.is_busy ? 'Busy' : 'Available') : 'Offline'}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
          {renderCurrentView()}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only for users */}
      {userRole === 'user' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="p-6">
            <div className="flex justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs mt-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;