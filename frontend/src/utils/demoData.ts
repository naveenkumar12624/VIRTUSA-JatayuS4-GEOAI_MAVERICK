import { supabase } from '../lib/supabase';
import { createSampleEscalations, createUserMessage } from '../lib/agentSupabase';

// Demo agent data
export const demoAgents = [
  { name: 'Sarah Johnson', email: 'sarah.johnson@bank.com', is_online: true, is_busy: false },
  { name: 'Michael Chen', email: 'michael.chen@bank.com', is_online: true, is_busy: false },
  { name: 'Emily Rodriguez', email: 'emily.rodriguez@bank.com', is_online: true, is_busy: true },
  { name: 'David Kim', email: 'david.kim@bank.com', is_online: false, is_busy: false },
  { name: 'Jessica Williams', email: 'jessica.williams@bank.com', is_online: true, is_busy: false },
  { name: 'Robert Taylor', email: 'robert.taylor@bank.com', is_online: true, is_busy: false },
  { name: 'Amanda Davis', email: 'amanda.davis@bank.com', is_online: false, is_busy: false },
  { name: 'James Wilson', email: 'james.wilson@bank.com', is_online: true, is_busy: true },
  { name: 'Lisa Anderson', email: 'lisa.anderson@bank.com', is_online: true, is_busy: false },
  { name: 'Christopher Brown', email: 'christopher.brown@bank.com', is_online: true, is_busy: false }
];

// Function to populate demo data for agent dashboard
export const populateDemoData = async () => {
  try {
    console.log('Creating demo data for agent dashboard...');
    
    // Create demo agents
    await createDemoAgents();
    
    // Create sample escalations
    await createSampleEscalations();
    
    console.log('Demo data created successfully!');
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
};

// Function to create demo agents
export const createDemoAgents = async () => {
  try {
    for (const agent of demoAgents) {
      const { error } = await supabase
        .from('agents')
        .upsert(agent, { onConflict: 'email' });
      
      if (error) {
        console.error('Error creating agent:', error);
      }
    }
    
    console.log('Demo agents created successfully!');
  } catch (error) {
    console.error('Error creating demo agents:', error);
  }
};

// Function to simulate AI escalation
export const simulateAIEscalation = async (
  userId: string,
  userMessage: string,
  reason: string,
  priorityScore: number = 7
) => {
  try {
    // Add user message
    await createUserMessage(userId, userMessage, 'user', priorityScore);
    
    // Get a random available agent
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name')
      .eq('is_online', true)
      .eq('is_busy', false)
      .limit(1);
    
    const selectedAgent = agents?.[0];
    const roomName = `escalation-${Date.now()}`;
    
    // Add AI response indicating escalation
    await createUserMessage(
      userId,
      selectedAgent 
        ? `I understand this is a complex issue that requires human assistance. I'm connecting you with ${selectedAgent.name} who can provide better support. <<VOICE_CALL_TRIGGER::${selectedAgent.id}::${roomName}>>`
        : "I understand this is a complex issue that requires human assistance. I'm escalating this to our customer service team. All agents are currently busy, but you'll be connected to the next available agent.",
      'ai'
    );
    
    // Create escalation
    const { data, error } = await supabase.rpc('create_escalation', {
      p_user_id: userId,
      p_reason: reason,
      p_priority_score: priorityScore
    });
    
    if (error) throw error;
    
    return { success: true, escalationId: data };
  } catch (error) {
    console.error('Error simulating AI escalation:', error);
    return { success: false, error };
  }
};

// Function to trigger voice escalation for demo
export const triggerDemoVoiceEscalation = async (userId: string) => {
  const demoScenarios = [
    {
      userMessage: "My transaction failed but money was debited! This is urgent!",
      reason: "Failed transaction with money debited - urgent resolution needed",
      priority: 9
    },
    {
      userMessage: "I can't access my account and I need to make an important payment today",
      reason: "Account access issue preventing urgent payment",
      priority: 8
    },
    {
      userMessage: "There's an unauthorized charge on my card and I need immediate help",
      reason: "Potential fraud - unauthorized transaction detected",
      priority: 10
    }
  ];
  
  const scenario = demoScenarios[Math.floor(Math.random() * demoScenarios.length)];
  
  return await simulateAIEscalation(
    userId,
    scenario.userMessage,
    scenario.reason,
    scenario.priority
  );
};

// Function to add realistic chat history
export const addRealisticChatHistory = async (userId: string) => {
  const chatHistory = [
    { message: "Hi, I need help with my account", from: 'user', priority: 3 },
    { message: "Hello! I'd be happy to help you with your account. What specific issue are you experiencing?", from: 'ai' },
    { message: "I made a payment yesterday but it's not showing in my account", from: 'user', priority: 6 },
    { message: "I understand your concern about the missing payment. Let me check your recent transactions. Can you provide me with the transaction amount and the merchant name?", from: 'ai' },
    { message: "It was ₹5,000 to ABC Electronics. I have the receipt but the money is gone from my account", from: 'user', priority: 7 },
    { message: "Thank you for providing those details. I can see the debit from your account, but I'm not finding the corresponding credit confirmation from the merchant. This appears to be a failed transaction where the money was debited but not properly processed.", from: 'ai' },
    { message: "This is very frustrating! I need this resolved immediately. I've been a customer for 10 years!", from: 'user', priority: 9 },
    { message: "I completely understand your frustration, and I sincerely apologize for this inconvenience. This type of issue requires immediate attention from our specialized team. I'm escalating this to a human agent who can initiate a transaction reversal process right away.", from: 'ai' }
  ];

  for (const chat of chatHistory) {
    await createUserMessage(
      userId,
      chat.message,
      chat.from as 'user' | 'ai',
      chat.priority
    );
    
    // Add small delay to make timestamps realistic
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};