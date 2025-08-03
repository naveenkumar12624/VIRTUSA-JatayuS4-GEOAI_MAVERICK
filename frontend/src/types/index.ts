export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'expense' | 'loan_payment';
  amount: number;
  description: string;
  category: string;
  contactId?: string;
  contactName?: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

export interface LoanInfo {
  principal: number;
  monthlyInterest: number;
  totalPaid: number;
  remainingBalance: number;
  nextPaymentDate: Date;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  is_online: boolean;
  is_busy: boolean;
  created_at: string;
}

export interface VoiceCallRequest {
  id: string;
  user_id: string;
  agent_id: string;
  room_name: string;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
  user: {
  user: {
    name: string;
    email: string;
  };
    name: string;
    email: string;
  };
}