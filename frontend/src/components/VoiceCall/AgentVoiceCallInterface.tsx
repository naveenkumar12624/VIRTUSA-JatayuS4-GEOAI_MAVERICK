import React, { useEffect, useState } from 'react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User } from 'lucide-react';

interface AgentVoiceCallInterfaceProps {
  roomName: string;
  token: string;
  participantName: string;
  onCallEnd: () => void;
  onBack: () => void;
}

export const AgentVoiceCallInterface: React.FC<AgentVoiceCallInterfaceProps> = ({
  roomName,
  token,
  participantName,
  onCallEnd,
  onBack
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    connectToRoom();
    return () => {
      disconnectFromRoom();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const connectToRoom = async () => {
    try {
      setConnectionStatus('connecting');
      
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up event listeners
      newRoom.on(RoomEvent.Connected, () => {
        console.log('Agent connected to room:', roomName);
        setIsConnected(true);
        setConnectionStatus('connected');
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Agent disconnected from room');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('User connected:', participant.identity);
        setParticipants(prev => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('User disconnected:', participant.identity);
        setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === 'audio') {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      // Connect to room
      const wsUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-server.com';
      await newRoom.connect(wsUrl, token);

      // Enable microphone
      await newRoom.localParticipant.enableCameraAndMicrophone(false, true);

      setRoom(newRoom);
    } catch (error) {
      console.error('Error connecting to room:', error);
      setConnectionStatus('error');
    }
  };

  const disconnectFromRoom = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
    }
  };

  const toggleMute = async () => {
    if (room?.localParticipant) {
      const audioTrack = room.localParticipant.getTrackPublication('microphone')?.track;
      if (audioTrack) {
        await audioTrack.setMuted(!isMuted);
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    participants.forEach(participant => {
      participant.audioTrackPublications.forEach(publication => {
        if (publication.track) {
          publication.track.setVolume(isSpeakerMuted ? 1 : 0);
        }
      });
    });
  };

  const endCall = async () => {
    await disconnectFromRoom();
    onCallEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting': return 'text-yellow-600';
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Connecting to customer...';
      case 'connected': return 'Connected with customer';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        <div className="bg-white rounded-t-3xl shadow-2xl flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="text-center">
                <h1 className="text-lg font-bold">Agent Call</h1>
                <p className="text-green-100 text-sm">Room: {roomName}</p>
              </div>
              <div className="w-10"></div>
            </div>
          </div>

          {/* Call Status */}
          <div className="p-6 text-center flex-1">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
              <div className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              {isConnected && (
                <div className="text-gray-600">
                  <p className="text-lg font-semibold">{formatDuration(callDuration)}</p>
                  <p className="text-sm">
                    {participants.length > 0 
                      ? `Speaking with ${participants[0]?.identity || 'customer'}`
                      : 'Waiting for customer...'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Customer Info */}
            {participants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Customer:</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
                      <User className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{participants[0]?.identity}</p>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-blue-700">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Agent:</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center">
                    <User className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{participantName}</p>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-700">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call Controls */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-center space-x-6 mb-6">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                  isMuted 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                    : 'bg-white text-gray-700 shadow-lg'
                }`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* Speaker Button */}
              <button
                onClick={toggleSpeaker}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                  isSpeakerMuted 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                    : 'bg-white text-gray-700 shadow-lg'
                }`}
              >
                {isSpeakerMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all transform hover:scale-110 hover:bg-red-600"
              >
                <PhoneOff size={24} />
              </button>
            </div>

            {/* Connection Info */}
            <div className="text-center text-xs text-gray-500">
              <p>Agent: {participantName}</p>
              {connectionStatus === 'error' && (
                <p className="text-red-500 mt-2">
                  Failed to connect. Please check your connection and try again.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};