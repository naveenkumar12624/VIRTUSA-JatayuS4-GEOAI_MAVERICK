import React from 'react';
import { Phone, Clock, AlertTriangle, User } from 'lucide-react';

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

interface EscalationListProps {
  escalations: Escalation[];
  onJoinVoiceChannel: (escalation: Escalation) => void;
  onSelectEscalation: (escalation: Escalation) => void;
  selectedEscalation: Escalation | null;
}

export const EscalationList: React.FC<EscalationListProps> = ({
  escalations,
  onJoinVoiceChannel,
  onSelectEscalation,
  selectedEscalation
}) => {
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
        return <Phone className="text-green-600" size={16} />;
      case 'closed':
        return <AlertTriangle className="text-gray-600" size={16} />;
      default:
        return <AlertTriangle className="text-red-600" size={16} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-4">
      {escalations.map((escalation) => (
        <div
          key={escalation.id}
          className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
            selectedEscalation?.id === escalation.id ? 'ring-2 ring-blue-500 border-blue-200' : ''
          }`}
          onClick={() => onSelectEscalation(escalation)}
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{escalation.user.name}</h3>
                    <p className="text-sm text-gray-500">{escalation.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(escalation.status)}
                    <span className="text-sm text-gray-600 capitalize">{escalation.status}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(escalation.priority_score)}`}>
                    Priority {escalation.priority_score}
                  </span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(escalation.created_at)}</span>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="text-red-600 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm font-medium text-red-800">Escalation Reason</p>
                      <p className="text-sm text-red-700">{escalation.reason}</p>
                    </div>
                  </div>
                </div>

                {escalation.recent_messages.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Recent Message:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {escalation.recent_messages[0].message}
                    </p>
                  </div>
                )}
              </div>

              {escalation.status === 'waiting' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoinVoiceChannel(escalation);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 ml-4"
                >
                  <Phone size={16} />
                  <span>Join Call</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};