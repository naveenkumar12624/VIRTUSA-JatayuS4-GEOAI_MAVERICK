import React, { useState, useEffect } from 'react';
import { supabase, updateAgentStatus } from '../../lib/supabase';
import { Agent, VoiceCallRequest } from '../../types';
import { AgentStatus } from './AgentStatus';
import { MessageHistory } from './MessageHistory';
import { ChatInterface } from '../AIChat/ChatInterface';
import { AgentVoiceCallInterface } from '../VoiceCall/AgentVoiceCallInterface';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  Headphones,
  Bot,
  PhoneCall
} from 'lucide-react';

interface AgentDashboardProps {
  agent: Agent;
}

interface Escalation {
  id: string;
  user_id: string;
  agent_id: string | null;
  status: 'waiting' | 'connected' | 'closed';
  reason: string;
  priority_score: number;
  created_at: string;
  updated_at: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  recent_messages: UserMessage[];
}

interface UserMessage {
  id: string;
  user_id: string;
  message: string;
  timestamp: string;
  from_type: 'user' | 'ai';
  priority_score: number | null;
  escalated: boolean;
  room_name: string | null;
}

interface VoiceCallRequest {
  id: string;
  user_id: string;
  room_name: string;
  user: { name: string; email: string };
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ agent }) => {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [voiceCallRequests, setVoiceCallRequests] = useState<VoiceCallRequest[]>([]);
  const [activeVoiceCall, setActiveVoiceCall] = useState<{
    roomName: string;
    token: string;
    requestId: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    waiting: 0,
    connected: 0,
    closed: 0
  });

  // Initialize agent session
  useEffect(() => {
    loadEscalations();
    loadVoiceCallRequests();
    
    // Set up real-time subscriptions
    const escalationSubscription = supabase
      .channel('escalations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'escalations' },
        () => {
          loadEscalations();
        }
      )
      .subscribe();

    const voiceCallSubscription = supabase
      .channel('voice_call_requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'voice_call_requests' },
        () => {
          loadVoiceCallRequests();
        }
      )
      .subscribe();

    return () => {
      escalationSubscription.unsubscribe();
      voiceCallSubscription.unsubscribe();
    };
  }, [agent.id]);

  const loadEscalations = async () => {
    try {
      setLoading(true);
      
      // Load escalations with user data and recent messages
      const { data: escalationData, error: escalationError } = await supabase
        .from('escalations')
        .select(`
          *,
          user:users(name, email, phone)
        `)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true });

      if (escalationError) throw escalationError;

      // Load recent messages for each escalation
      const escalationsWithMessages = await Promise.all(
        (escalationData || []).map(async (escalation) => {
          const { data: messages, error: messagesError } = await supabase
            .from('user_messages')
            .select('*')
            .eq('user_id', escalation.user_id)
            .order('timestamp', { ascending: false })
            .limit(10);

          if (messagesError) {
            console.error('Error loading messages:', messagesError);
            return { ...escalation, recent_messages: [] };
          }

          return { ...escalation, recent_messages: messages || [] };
        })
      );

      setEscalations(escalationsWithMessages);

      // Update stats
      const waiting = escalationsWithMessages.filter(e => e.status === 'waiting').length;
      const connected = escalationsWithMessages.filter(e => e.status === 'connected').length;
      const closed = escalationsWithMessages.filter(e => e.status === 'closed').length;
      
      setStats({ waiting, connected, closed });
    } catch (error) {
      console.error('Error loading escalations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVoiceCallRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_call_requests')
        .select(`
          id,
          user_id,
          room_name,
          status,
          created_at,
          user:users(name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVoiceCallRequests(data || []);
    } catch (error) {
      console.error('Error loading voice call requests:', error);
    }
  };

  const generateAgentToken = async (roomName: string): Promise<string> => {
    try {
      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: agent.name,
          participantId: agent.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      throw error;
    }
  };

  const joinVoiceCall = async (request: VoiceCallRequest) => {
    try {
      // Generate token for agent
      const token = await generateAgentToken(request.room_name);
      
      // Update request status to active
      const { error } = await supabase
        .from('voice_call_requests')
        .update({ status: 'active', agent_id: agent.id })
        .eq('id', request.id);

      if (error) throw error;
      
      // Set active voice call
      setActiveVoiceCall({
        roomName: request.room_name,
        token,
        requestId: request.id
      });
      
    } catch (error) {
      console.error('Error joining voice call:', error);
      alert('Failed to join voice call. Please try again.');
    }
  };

  const endVoiceCall = async () => {
    if (activeVoiceCall) {
      try {
        // Update request status to completed
        const { error } = await supabase
          .from('voice_call_requests')
          .update({ status: 'completed' })
          .eq('id', activeVoiceCall.requestId);

        if (error) throw error;
        
      } catch (error) {
        console.error('Error ending voice call:', error);
      }
      
      setActiveVoiceCall(null);
      loadVoiceCallRequests();
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-100';
    if (score >= 6) return 'text-orange-600 bg-orange-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="text-yellow-600" size={16} />;
      case 'connected':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'closed':
        return <XCircle className="text-gray-600" size={16} />;
      default:
        return <AlertTriangle className="text-red-600" size={16} />;
    }
  };

  // If agent is in a voice call, show voice call interface
  if (activeVoiceCall) {
    return (
      <AgentVoiceCallInterface
        roomName={activeVoiceCall.roomName}
        token={activeVoiceCall.token}
        participantName={agent.name}
        onCallEnd={endVoiceCall}
        onBack={() => setActiveVoiceCall(null)}
      />
    );
  }

  if (showAIChat) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAIChat(false)}
                  className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ←
                </button>
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Bot className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Assistant Chat</h1>
                  <p className="text-sm text-gray-500">Agent Support Chat Interface</p>
                </div>
              </div>
              
              {agent && (
                <AgentStatus agent={agent} />
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ChatInterface />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Headphones className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
                <p className="text-sm text-gray-500">Customer Support Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAIChat(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Bot size={16} />
                <span>AI Assistant</span>
              </button>
              
              {agent && (
                <AgentStatus agent={agent} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Voice Requests</p>
                <p className="text-2xl font-bold text-blue-600">{voiceCallRequests.length}</p>
              </div>
              <PhoneCall className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Escalations</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
              </div>
              <AlertTriangle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.closed}</p>
              </div>
              <CheckCircle className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Call Requests */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Voice Call Requests</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <PhoneCall size={16} />
                    <span>{voiceCallRequests.length} pending</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {voiceCallRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <PhoneCall className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No voice call requests</p>
                    <p className="text-sm text-gray-500">New requests will appear here</p>
                  </div>
                ) : (
                  voiceCallRequests.map((request) => (
                    <div key={request.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{request.user.name}</h3>
                          <p className="text-sm text-gray-500">{request.user.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Room: {request.room_name}
                          </p>
                        </div>
                        <button
                          onClick={() => joinVoiceCall(request)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <Phone size={16} />
                          <span>Join Call</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Escalations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Customer Escalations</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users size={16} />
                    <span>{escalations.length} total</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading escalations...</p>
                  </div>
                ) : escalations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No escalations at the moment</p>
                    <p className="text-sm text-gray-500">New escalations will appear here</p>
                  </div>
                ) : (
                  escalations.slice(0, 5).map((escalation) => (
                    <div
                      key={escalation.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedEscalation?.id === escalation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                      onClick={() => setSelectedEscalation(escalation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900 text-sm">{escalation.user.name}</h3>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(escalation.status)}
                              <span className="text-xs text-gray-500 capitalize">{escalation.status}</span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(escalation.priority_score)}`}>
                              P{escalation.priority_score}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{escalation.reason}</p>
                          
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{new Date(escalation.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {escalation.status === 'waiting' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updateEscalation = async () => {
                                try {
                                  const { error } = await supabase
                                    .from('escalations')
                                    .update({ 
                                      status: 'connected', 
                                      agent_id: agent.id,
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq('id', escalation.id);

                                  if (error) throw error;
                                  loadEscalations();
                                } catch (error) {
                                  console.error('Error updating escalation:', error);
                                }
                              };
                              updateEscalation();
                            }}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
                          >
                            <MessageSquare size={12} />
                            <span>Take</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message History Sidebar */}
          <div className="lg:col-span-1">
            {selectedEscalation ? (
              <MessageHistory escalation={selectedEscalation} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Select an escalation</p>
                <p className="text-sm text-gray-500">View customer chat history and details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};