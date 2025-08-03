import React from 'react';
import { User } from '../../types';
import { GroqVoiceAssistant } from './GroqVoiceAssistant';

interface VoiceChannelProps {
  onBack: () => void;
  user: User;
}

export const VoiceChannel: React.FC<VoiceChannelProps> = ({ onBack, user }) => {
  return <GroqVoiceAssistant onBack={onBack} user={user} />;
};