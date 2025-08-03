import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to clear invalid session data
export const clearInvalidSession = async () => {
  try {
    // Clear any stored session data
    await supabase.auth.signOut({ scope: 'local' });
    // Clear local storage items related to Supabase auth
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing invalid session:', error);
  }
};

// Auth helpers
export const signUp = async (email: string, password: string, name: string, phone?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// User search functionality
export const searchUsers = async (query: string, currentUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .neq('id', currentUserId) // Exclude current user
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10);
    
    if (error) {
      console.error('Search error:', error);
      throw error;
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Search users error:', err);
    return { data: [], error: err };
  }
};

// Transaction helpers
export const createTransaction = async (
  transaction: {
    type: string;
    amount: number;
    description: string;
    category: string;
    contact_id?: string;
    contact_name?: string;
  },
) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();
  
  return { data, error };
};

export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
};

export const updateUserBalance = async (userId: string, newBalance: number) => {
  const { data, error } = await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

export const createUserProfile = async (userId: string, profile: {
  name: string;
  email: string;
  phone?: string;
  balance?: number;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ id: userId, ...profile }])
    .select()
    .single();
  
  return { data, error };
};

// Check if user is an agent
export const checkUserRole = async (email: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, email, is_online, is_busy')
    .eq('email', email)
    .maybeSingle();
  
  return { data, error };
};

// Voice call request functions
export const createVoiceCallRequest = async (userId: string, agentId?: string) => {
  // If no agentId provided, find an available agent
  if (!agentId) {
    const { data: availableAgent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('is_online', true)
      .eq('is_busy', false)
      .limit(1)
      .maybeSingle();
    
    if (agentError || !availableAgent) {
      throw new Error('No available agents found');
    }
    
    agentId = availableAgent.id;
  }
  
  const roomName = `user-${userId}-room-${Date.now()}`;
  
  const { data, error } = await supabase
    .from('voice_call_requests')
    .insert([{
      user_id: userId,
      agent_id: agentId,
      room_name: roomName,
      status: 'pending'
    }])
    .select('*')
    .single();
  
  return { data, error };
};

export const getVoiceCallRequests = async (agentId: string) => {
  const { data, error } = await supabase
    .from('voice_call_requests')
    .select(`
      *,
      user:users(name, email)
    `)
    .eq('agent_id', agentId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  return { data, error };
};

export const updateVoiceCallStatus = async (callId: string, status: string) => {
  const { data, error } = await supabase
    .from('voice_call_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', callId)
    .select()
    .single();
  
  return { data, error };
};

export const updateAgentStatus = async (agentId: string, isOnline: boolean, isBusy: boolean) => {
  const { data, error } = await supabase
    .from('agents')
    .update({ is_online: isOnline, is_busy: isBusy })
    .eq('id', agentId)
    .select()
    .single();
  
  return { data, error };
};

// Get all users for admin purposes (optional)
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, balance, created_at')
    .order('created_at', { ascending: false });
  
  return { data, error };
};