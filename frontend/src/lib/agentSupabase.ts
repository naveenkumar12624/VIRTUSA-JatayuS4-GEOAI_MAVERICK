import { supabase } from './supabase';

// Agent management functions
export const getAgents = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('name');
  
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

// Escalation management functions
export const getEscalations = async () => {
  const { data, error } = await supabase
    .from('escalations')
    .select(`
      *,
      user:users(name, email, phone)
    `)
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: true });
  
  return { data, error };
};

export const updateEscalationStatus = async (
  escalationId: string, 
  status: 'waiting' | 'connected' | 'closed',
  agentId?: string
) => {
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (agentId) {
    updateData.agent_id = agentId;
  }

  const { data, error } = await supabase
    .from('escalations')
    .update(updateData)
    .eq('id', escalationId)
    .select()
    .single();
  
  return { data, error };
};

// User messages functions
export const getUserMessages = async (userId: string, limit: number = 10) => {
  const { data, error } = await supabase
    .from('user_messages')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  return { data, error };
};

export const createUserMessage = async (
  userId: string,
  message: string,
  fromType: 'user' | 'ai',
  priorityScore?: number
) => {
  const { data, error } = await supabase
    .from('user_messages')
    .insert([{
      user_id: userId,
      message,
      from_type: fromType,
      priority_score: priorityScore,
      timestamp: new Date().toISOString()
    }])
    .select()
    .single();
  
  return { data, error };
};

// Create escalation function
export const createEscalation = async (
  userId: string,
  reason: string,
  priorityScore: number = 5
) => {
  const { data, error } = await supabase.rpc('create_escalation', {
    p_user_id: userId,
    p_reason: reason,
    p_priority_score: priorityScore
  });
  
  return { data, error };
};

// Real-time subscriptions
export const subscribeToEscalations = (callback: (payload: any) => void) => {
  return supabase
    .channel('escalations')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'escalations' },
      callback
    )
    .subscribe();
};

export const subscribeToUserMessages = (callback: (payload: any) => void) => {
  return supabase
    .channel('user_messages')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'user_messages' },
      callback
    )
    .subscribe();
};

// Demo function to create sample escalations
export const createSampleEscalations = async () => {
  const sampleEscalations = [
    {
      reason: "Transaction failed but money was debited from account",
      priority_score: 9
    },
    {
      reason: "Unable to access account after password reset",
      priority_score: 7
    },
    {
      reason: "Disputed charge on credit card statement",
      priority_score: 6
    },
    {
      reason: "Loan payment not reflecting in system",
      priority_score: 8
    },
    {
      reason: "Need help with mobile banking setup",
      priority_score: 4
    }
  ];

  // Get first user for demo
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (users && users.length > 0) {
    const userId = users[0].id;
    
    for (const escalation of sampleEscalations) {
      await createEscalation(userId, escalation.reason, escalation.priority_score);
      
      // Add some sample messages
      await createUserMessage(
        userId,
        `I need help with: ${escalation.reason}`,
        'user',
        escalation.priority_score
      );
      
      await createUserMessage(
        userId,
        "I understand your concern. Let me help you with this issue. I'm escalating this to a human agent for better assistance.",
        'ai'
      );
    }
  }
};