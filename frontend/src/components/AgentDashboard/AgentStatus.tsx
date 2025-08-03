import React from 'react';
import { User, Circle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  email: string;
  is_online: boolean;
  is_busy: boolean;
  created_at: string;
}

interface AgentStatusProps {
  agent: Agent;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ agent }) => {
  const getStatusColor = () => {
    if (!agent.is_online) return 'text-gray-500';
    if (agent.is_busy) return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!agent.is_online) return 'Offline';
    if (agent.is_busy) return 'Busy';
    return 'Available';
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className="bg-gray-100 p-2 rounded-full">
          <User className="text-gray-600" size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{agent.name}</p>
          <div className="flex items-center space-x-1">
            <Circle className={`${getStatusColor()} fill-current`} size={8} />
            <span className={`text-xs ${getStatusColor()}`}>{getStatusText()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};