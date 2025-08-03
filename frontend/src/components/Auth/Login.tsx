import React, { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { CreditCard, Phone, User, Mail, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onAuthSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session) {
          onAuthSuccess();
        }
      } catch (error) {
        console.error('Auth state change error in login:', error);
        // Handle refresh token errors
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('Invalid Refresh Token')) {
          await clearInvalidSession();
          setError('Session expired. Please sign in again.');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // Handle specific auth errors
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            await clearInvalidSession();
            throw new Error('Session expired. Please try signing in again.');
          }
          throw error;
        }
      } else {
        // Validate phone number
        if (!phone.trim()) {
          throw new Error('Phone number is required');
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
            },
          },
        });
        if (error) throw error;
        
        // Show success message for sign up
        if (!error) {
          setError('');
          alert('Account created successfully! Please sign in.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setName('');
          setPhone('');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (showCustomForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">FinancePay</h1>
            <p className="text-gray-600">Your smart financial companion</p>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-600">
                {isLogin ? 'Sign in to your account' : 'Join FinancePay today'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Enter your full name"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="+91 9876543210"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="ml-2 text-blue-600 font-medium hover:text-blue-700"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowCustomForm(false)}
                className="text-gray-500 text-sm hover:text-gray-700"
              >
                ← Back to Google Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FinancePay</h1>
          <p className="text-gray-600">Your smart financial companion</p>
        </div>

        {/* Google Auth */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-600">Sign in to continue to FinancePay</p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#f8fafc',
                    defaultButtonBackgroundHover: '#f1f5f9',
                    inputBackground: 'white',
                    inputBorder: '#d1d5db',
                    inputBorderHover: '#9ca3af',
                    inputBorderFocus: '#2563eb',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    buttonBorderRadius: '12px',
                    inputBorderRadius: '12px',
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'w-full py-3 px-4 rounded-xl font-semibold transition-all hover:shadow-lg',
                input: 'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-600 focus:border-transparent',
                label: 'block text-sm font-medium text-gray-700 mb-2',
                message: 'text-sm text-red-600 mt-2',
              },
            }}
            providers={['google']}
            redirectTo={window.location.origin}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={false}
            view="sign_in"
          />

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowCustomForm(true)}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Use email and password instead
            </button>
          </div>
        </div>

        {/* Demo Account Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Demo Account</h3>
          <p className="text-blue-700 text-sm mb-2">
            You can create a new account or use these demo credentials:
          </p>
          <div className="text-sm text-blue-600 space-y-1">
            <div className="mb-3">
              <p className="font-medium">User Account:</p>
              <p><strong>Email:</strong> demo@financepay.com</p>
              <p><strong>Password:</strong> demo123</p>
            </div>
            <div>
              <p className="font-medium">Agent Account:</p>
              <p><strong>Email:</strong> agent1@example.com</p>
              <p><strong>Password:</strong> agent123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};