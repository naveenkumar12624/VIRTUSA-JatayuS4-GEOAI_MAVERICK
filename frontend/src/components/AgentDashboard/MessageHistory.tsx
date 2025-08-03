import React from 'react';
import { Bot, User, Clock, AlertTriangle } from 'lucide-react';

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

interface MessageHistoryProps {
  escalation: Escalation;
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({ escalation }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPriorityColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 8) return 'text-red-600';
    if (score >= 6) return 'text-orange-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{escalation.user.name}</h3>
            <p className="text-sm text-gray-500">{escalation.user.email}</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="text-red-600 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-medium text-red-800">Escalation Reason</p>
              <p className="text-sm text-red-700">{escalation.reason}</p>
              <p className="text-xs text-red-600 mt-1">
                Priority: {escalation.priority_score}/10
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Recent Chat History</h4>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {escalation.recent_messages.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent messages</p>
            </div>
          ) : (
            escalation.recent_messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.from_type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`p-2 rounded-full ${
                  message.from_type === 'user' 
                    ? 'bg-blue-100' 
                    : 'bg-purple-100'
                }`}>
                  {message.from_type === 'user' ? (
                    <User className="text-blue-600" size={16} />
                  ) : (
                    <Bot className="text-purple-600" size={16} />
                  )}
                </div>
                
                <div className={`flex-1 max-w-xs ${
                  message.from_type === 'user' ? 'text-right' : 'text-left'
                }`}>
                  <div className={`p-3 rounded-lg ${
                    message.from_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                  </div>
                  
                  <div className={`flex items-center mt-1 text-xs text-gray-500 ${
                    message.from_type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.priority_score && (
                      <>
                        <span className="mx-1">•</span>
                        <span className={getPriorityColor(message.priority_score)}>
                          Priority {message.priority_score}
                        </span>
                      </>
                    )}
                    {message.escalated && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-red-500">Escalated</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};