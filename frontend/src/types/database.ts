export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          category: string;
          contact_id: string | null;
          contact_name: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: string;
          amount: number;
          description: string;
          category: string;
          contact_id?: string | null;
          contact_name?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          description?: string;
          category?: string;
          contact_id?: string | null;
          contact_name?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      loan_info: {
        Row: {
          id: string;
          user_id: string;
          principal: number;
          monthly_interest: number;
          total_paid: number;
          remaining_balance: number;
          next_payment_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          principal: number;
          monthly_interest: number;
          total_paid?: number;
          remaining_balance: number;
          next_payment_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          principal?: number;
          monthly_interest?: number;
          total_paid?: number;
          remaining_balance?: number;
          next_payment_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          name: string;
          email: string;
          is_online: boolean;
          is_busy: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          is_online?: boolean;
          is_busy?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          is_online?: boolean;
          is_busy?: boolean;
          created_at?: string;
        };
      };
      user_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          timestamp: string;
          from_type: 'user' | 'ai';
          priority_score: number | null;
          escalated: boolean;
          room_name: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          timestamp?: string;
          from_type: 'user' | 'ai';
          priority_score?: number | null;
          escalated?: boolean;
          room_name?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          timestamp?: string;
          from_type?: 'user' | 'ai';
          priority_score?: number | null;
          escalated?: boolean;
          room_name?: string | null;
        };
      };
      escalations: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string | null;
          status: 'waiting' | 'connected' | 'closed';
          reason: string;
          priority_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id?: string | null;
          status?: 'waiting' | 'connected' | 'closed';
          reason: string;
          priority_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agent_id?: string | null;
          status?: 'waiting' | 'connected' | 'closed';
          reason?: string;
          priority_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      voice_call_requests: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string | null;
          room_name: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id?: string | null;
          room_name: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agent_id?: string | null;
          room_name?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      message_from: 'user' | 'ai';
      escalation_status: 'waiting' | 'connected' | 'closed';
    };
  };
}