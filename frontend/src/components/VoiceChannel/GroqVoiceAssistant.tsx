import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  Brain, 
  MessageSquare,
  Activity,
  Play,
  Pause,
  User,
  Bot,
  Send,
  Zap,
  Sparkles,
  Radio as RadioIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id?: string;
  name: string;
  balance?: number;
  email?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  audioUrl?: string;
  isTranscribed?: boolean;
}

interface GroqVoiceAssistantProps {
  onBack: () => void;
  user: User;
}

export const GroqVoiceAssistant: React.FC<GroqVoiceAssistantProps> = ({ onBack, user }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // API configuration
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const YOUR_BACKEND_URL = import.meta.env.VITE_LOCAL_LLM_URL || 'http://localhost:8000';

  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      message: `Hello ${user.name}! I'm your AI Voice Assistant. I can help you with various questions and tasks. Click the microphone to start speaking or type your message below!`,
      timestamp: new Date()
    };
    setChatHistory([welcomeMessage]);

    return () => {
      cleanup();
    };
  }, [user.name]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophonePermission('granted');
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicrophonePermission('denied');
      setError('Microphone access is required for voice assistant. Please allow microphone access and try again.');
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) return;

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      setupAudioLevelMonitoring(streamRef.current);

      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        await processVoicePipeline(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setCurrentStage('🎤 Listening...');

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check your microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setCurrentStage('🔄 Processing...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setAudioLevel(0);
  };

  const setupAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedLevel = Math.min(100, (average / 255) * 100);
        
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
    }
  };

  const processVoicePipeline = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      setCurrentStage('🧠 Transcribing...');
      const transcript = await groqSpeechToText(audioBlob);
      
      if (!transcript) {
        throw new Error('Failed to transcribe audio');
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        message: transcript,
        timestamp: new Date(),
        isTranscribed: true
      };
      setChatHistory(prev => [...prev, userMessage]);

      setCurrentStage('🧾 Getting response...');
      const backendResponse = await callYourBackend(transcript);
      
      setCurrentStage('🗣️ Synthesizing...');
      const audioUrl = await groqTextToSpeech(backendResponse);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: backendResponse,
        timestamp: new Date(),
        ...(audioUrl ? { audioUrl } : {})
      };
      setChatHistory(prev => [...prev, aiMessage]);

      setCurrentStage('🔊 Playing response...');
      if (audioUrl) {
        await playAudio(audioUrl, aiMessage.id);
      }

      setCurrentStage('✅ Ready for next question');
      setTimeout(() => setCurrentStage(''), 2000);

    } catch (error) {
      console.error('Error in voice pipeline:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(`Pipeline error: ${errorMsg}`);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        message: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setCurrentStage('');
    }
  };

  const groqSpeechToText = async (audioBlob: Blob): Promise<string> => {
    try {
      if (!GROQ_API_KEY) {
        throw new Error('Groq API key is missing');
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq STT API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Groq STT error:', error);
      setError('Speech recognition failed. Please try again.');
      throw error;
    }
  };

  const callYourBackend = async (question: string): Promise<string> => {
    try {
      setCurrentStage('🧠 Processing query...');
      
      if (!YOUR_BACKEND_URL) {
        throw new Error('Backend URL not configured. Please set VITE_LOCAL_LLM_URL in your environment variables.');
      }

      const formData = new FormData();
      formData.append('question', question);
      formData.append('user_id', user.id || 'demo-user');
      formData.append('use_case', 'voice_assistant');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${YOUR_BACKEND_URL}/ask`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.response;
      
    } catch (error) {
      console.error('Backend error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Request timed out. Please check if your backend service is running and try again.");
        }
        if (error.message.includes('fetch')) {
          throw new Error(`Cannot connect to backend at ${YOUR_BACKEND_URL}. Please ensure your local LLM backend is running (python backend.py) and accessible.`);
        }
        throw error;
      }
      
      throw new Error("Sorry, I'm having trouble connecting to the backend service. Please try again later.");
    }
  };

  const groqTextToSpeech = async (text: string): Promise<string | undefined> => {
    try {
      if (!GROQ_API_KEY) {
        return undefined;
      }

      const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'playai-tts',
          input: text,
          voice: 'Arista-PlayAI',
          response_format: 'mp3'
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq TTS API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Groq TTS error:', error);
      return undefined;
    }
  };

  const playAudio = async (audioUrl: string, messageId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      setPlayingMessageId(messageId);
      setIsSpeaking(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        setPlayingMessageId(null);
        setIsSpeaking(false);
        resolve();
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setPlayingMessageId(null);
        setIsSpeaking(false);
        reject(new Error('Failed to play audio'));
      };
      
      audio.onloadstart = () => setIsPlaying(true);
      
      audio.play().catch(reject);
    });
  };

  const replayAudio = async (audioUrl: string | undefined, messageId: string) => {
    if (audioUrl) {
      await playAudio(audioUrl, messageId);
    }
  };

  const handleTextSubmit = async () => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: userInput,
      timestamp: new Date(),
      isTranscribed: false
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setCurrentStage('🧾 Getting response...');
    
    try {
      const backendResponse = await callYourBackend(userInput);
      setCurrentStage('🗣️ Synthesizing speech...');
      const audioUrl = await groqTextToSpeech(backendResponse);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: backendResponse,
        timestamp: new Date(),
        ...(audioUrl ? { audioUrl } : {})
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
      
      if (audioUrl) {
        setCurrentStage('🔊 Playing response...');
        await playAudio(audioUrl, aiMessage.id);
      }
    } catch (error) {
      console.error('Text submission error:', error);
      setError('Failed to process your message. Please try again.');
    } finally {
      setCurrentStage('');
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Avatar component with talking animation
  const TalkingAvatar = () => {
    return (
      <div className="relative">
        {/* Main Avatar Circle */}
        <motion.div 
          className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl relative overflow-hidden"
          animate={{ 
            scale: isSpeaking ? [1, 1.05, 1] : isRecording ? [1, 1.02, 1] : 1,
            boxShadow: isSpeaking 
              ? ['0 0 0 0 rgba(139, 92, 246, 0.7)', '0 0 0 20px rgba(139, 92, 246, 0)', '0 0 0 0 rgba(139, 92, 246, 0)']
              : isRecording 
              ? ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 15px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0)']
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          transition={{ 
            scale: { duration: 0.6, repeat: isSpeaking || isRecording ? Infinity : 0, repeatType: "reverse" },
            boxShadow: { duration: 1.5, repeat: isSpeaking || isRecording ? Infinity : 0 }
          }}
        >
          {/* Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-300/30 to-blue-300/30 animate-pulse"></div>
          
          {/* Avatar Icon */}
          <motion.div
            animate={{ 
              rotate: isSpeaking ? [0, 5, -5, 0] : 0,
              scale: isProcessing ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              rotate: { duration: 0.5, repeat: isSpeaking ? Infinity : 0 },
              scale: { duration: 1, repeat: isProcessing ? Infinity : 0 }
            }}
          >
            <Bot size={80} className="text-white relative z-10" />
          </motion.div>

          {/* Mouth Animation for Speaking */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0.8, 1, 0.8], 
                  scale: [0.8, 1.2, 0.8],
                  y: [0, -2, 0]
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  duration: 0.3, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <div className="w-6 h-3 bg-white/80 rounded-full"></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="absolute top-4 right-4"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0.5, 1, 0.5], 
                  scale: [0.8, 1, 0.8]
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Audio Level Visualization */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-2 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full"
              animate={{ 
                height: isRecording 
                  ? `${Math.max(4, (audioLevel > (i * 12) ? (audioLevel / 3) + 8 : 4))}px`
                  : '4px',
                opacity: isRecording && audioLevel > (i * 12) ? 1 : 0.3
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-all transform hover:scale-110"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Voice Assistant</h1>
                  <p className="text-sm text-gray-600">Powered by Groq Voice Technology</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                {GROQ_API_KEY ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-700">Demo Mode</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Main Voice Interface */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm max-w-md w-full"
                >
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current Stage */}
            <AnimatePresence>
              {currentStage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-sm"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Activity className="animate-pulse text-blue-600" size={16} />
                    <p className="text-blue-800 font-medium text-sm">{currentStage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Talking Avatar */}
            <div className="mb-8">
              <TalkingAvatar />
            </div>

            {/* Assistant Name and Status */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">FINMENTOR</h2>
              <p className="text-gray-600 flex items-center justify-center space-x-2">
                <Sparkles size={16} className="text-purple-500" />
                <span>Your AI Voice Assistant DESIGNED BY GEOAI MAVERICKS</span>
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                  isRecording ? 'bg-green-100 text-green-800' :
                  isSpeaking ? 'bg-blue-100 text-blue-800' :
                  isProcessing ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isRecording ? 'bg-green-500 animate-pulse' :
                    isSpeaking ? 'bg-blue-500 animate-pulse' :
                    isProcessing ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-500'
                  }`}></div>
                  <span>
                    {isRecording ? 'Listening...' :
                     isSpeaking ? 'Speaking...' :
                     isProcessing ? 'Thinking...' :
                     'Ready to help'}
                  </span>
                </span>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex flex-col items-center space-y-6">
              {/* Main Voice Button */}
              <motion.button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isProcessing || microphonePermission === 'denied'}
                className={`relative w-20 h-20 rounded-full font-semibold transition-all transform active:scale-95 flex items-center justify-center shadow-2xl ${
                  isRecording
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/50' 
                    : isProcessing 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white cursor-not-allowed shadow-yellow-500/50' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105'
                }`}
                whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ 
                    rotate: isRecording ? 360 : 0,
                    scale: isRecording ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: isRecording ? Infinity : 0, ease: "linear" },
                    scale: { duration: 0.5, repeat: isRecording ? Infinity : 0, repeatType: "reverse" }
                  }}
                >
                  {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                </motion.div>
                
                {/* Pulse effect when recording */}
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
                )}
              </motion.button>

              <p className="text-sm text-gray-600 font-medium">
                {isRecording ? 'Release to stop recording' : 'Hold to speak'}
              </p>
            </div>

            {/* Text Input Alternative */}
            <div className="mt-8 w-full max-w-md">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
                <div className="flex">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Or type your message here..."
                    className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                  />
                  <motion.button
                    onClick={handleTextSubmit}
                    disabled={!userInput.trim() || isProcessing}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-xl disabled:opacity-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send size={20} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat History Sidebar */}
          <div className="w-80 bg-white/60 backdrop-blur-md border-l border-white/20">
            <div className="p-4 border-b border-white/20">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <MessageSquare size={20} className="text-purple-600" />
                <span className="text-gray-800">Conversation</span>
              </h3>
            </div>

            <div className="h-full overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {chatHistory.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      {msg.type === 'ai' ? (
                        <div className="flex items-center space-x-1">
                          <Bot size={12} className="text-purple-500" />
                          <span className="font-medium">ARIA</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <User size={12} className="text-blue-500" />
                          <span className="font-medium">You</span>
                          {msg.isTranscribed && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                              Voice
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs">{formatTime(msg.timestamp)}</span>
                  </div>
                  
                  <div className={`rounded-2xl p-3 shadow-sm transition-all ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white ml-4'
                      : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white mr-4'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    {msg.audioUrl && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <button
                          onClick={() => replayAudio(msg.audioUrl, msg.id)}
                          disabled={playingMessageId === msg.id || !msg.audioUrl}
                          className="flex items-center space-x-1 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-all"
                        >
                          {playingMessageId === msg.id ? (
                            <>
                              <Pause size={10} className="animate-pulse" />
                              <span>Playing...</span>
                            </>
                          ) : (
                            <>
                              <Play size={10} />
                              <span>Replay</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};