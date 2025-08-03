import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User as UserIcon, Paperclip, Phone } from 'lucide-react';
import { VoiceCallInterface } from '../VoiceCall/VoiceCallInterface';

interface User {
  id?: string;
  name: string;
  balance?: number;
  email?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: Array<{ type: 'text' | 'table' | 'list'; value: string | { headers: string[]; rows: string[][] } | string[] }>;
  timestamp: Date;
  imageUrl?: string;
}

interface ChatInterfaceProps {
  onBack: () => void;
  user: User;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: [{ type: 'text', value: `Hello ${user.name}! How can I assist you today?` }],
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStage, setCurrentStage] = useState('');
  const [voiceCallActive, setVoiceCallActive] = useState(false);
  const [voiceCallData, setVoiceCallData] = useState<{
    agentId: string;
    roomName: string;
    token?: string;
  } | null>(null);

  const YOUR_BACKEND_URL = import.meta.env.VITE_LOCAL_LLM_URL || 'http://localhost:8000';

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Parse markdown content (tables, lists, and text)
  const parseMarkdownContent = (text: string): Array<{ type: 'text' | 'table' | 'list'; value: string | { headers: string[]; rows: string[][] } | string[] }> => {
    const lines = text.split('\n').map(line => line.trim());
    const content: Array<{ type: 'text' | 'table' | 'list'; value: any }> = [];
    let currentText: string[] = [];
    let currentList: string[] = [];
    let tableLines: string[] = [];
    let inTable = false;

    const flushText = () => {
      if (currentText.length) {
        content.push({ type: 'text', value: currentText.join('\n') });
        currentText = [];
      }
    };

    const flushList = () => {
      if (currentList.length) {
        content.push({ type: 'list', value: currentList });
        currentList = [];
      }
    };

    const flushTable = () => {
      if (tableLines.length >= 2) {
        const headers = tableLines[0].slice(1, -1).split('|').map(h => h.trim());
        const separator = tableLines[1];
        if (separator.match(/^\|[-:\s|]+\|$/)) {
          const rows = tableLines.slice(2).filter(line => line !== '...' && line.trim().length > 0).map(row => row.slice(1, -1).split('|').map(cell => cell.trim()));
          content.push({ type: 'table', value: { headers, rows } });
        }
      }
      tableLines = [];
      inTable = false;
    };

    for (const line of lines) {
      if (line.startsWith('|') && line.endsWith('|')) {
        flushText();
        flushList();
        inTable = true;
        tableLines.push(line);
      } else if (inTable && !line.startsWith('|')) {
        flushTable();
        if (line.startsWith('•')) {
          currentList.push(line.slice(1).trim());
        } else {
          currentText.push(line);
        }
      } else if (line.startsWith('•')) {
        flushText();
        currentList.push(line.slice(1).trim());
      } else {
        flushList();
        currentText.push(line);
      }
    }

    flushTable();
    flushList();
    flushText();

    return content;
  };

  // Parse voice call trigger from backend response
  const parseVoiceCallTrigger = (message: string): { agentId: string; roomName: string } | null => {
    const triggerPattern = /<<VOICE_CALL_TRIGGER::([^:]+)::([^>]+)>>/;
    const match = message.match(triggerPattern);
    return match ? { agentId: match[1], roomName: match[2] } : null;
  };

  // Generate LiveKit token for user
  const generateUserToken = async (roomName: string): Promise<string> => {
    try {
      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: user.name,
          participantId: user.id || 'demo-user',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate token');
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      throw error;
    }
  };

  // Handle voice call trigger
  const handleVoiceCallTrigger = async (agentId: string, roomName: string) => {
    try {
      setCurrentStage('🔗 Connecting to agent...');
      const token = await generateUserToken(roomName);
      setVoiceCallData({ agentId, roomName, token });
      setVoiceCallActive(true);
      await createEscalationRecord(agentId, roomName);
    } catch (error) {
      console.error('Error initiating voice call:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: [{ type: 'text', value: 'Sorry, I was unable to connect you to an agent. Please try again later.' }],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setCurrentStage('');
    }
  };

  // Create escalation record
  const createEscalationRecord = async (agentId: string, roomName: string) => {
    try {
      const { error } = await supabase
        .from('voice_call_requests')
        .insert([
          {
            user_id: user.id || 'demo-user',
            agent_id: agentId,
            room_name: roomName,
            status: 'pending',
          },
        ]);
      if (error) console.error('Error creating escalation record:', error);
    } catch (error) {
      console.error('Error creating escalation record:', error);
    }
  };

  // Handle call end
  const handleCallEnd = () => {
    setVoiceCallActive(false);
    setVoiceCallData(null);
    const callEndMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: [{ type: 'text', value: 'Voice call ended. Is there anything else I can help you with?' }],
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, callEndMessage]);
  };

  const callYourBackend = async (
    question: string,
    useCase: 'text_query' | 'image_analysis' = 'text_query'
  ): Promise<string> => {
    try {
      setCurrentStage('🧠 Processing query...');
      if (!YOUR_BACKEND_URL) {
        throw new Error('Backend URL not configured. Please set VITE_LOCAL_LLM_URL in your environment variables.');
      }

      const formData = new FormData();
      formData.append('question', question);
      formData.append('user_id', user.id || 'demo-user');
      formData.append('use_case', useCase);

      if (selectedFile) formData.append('image', selectedFile);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100000);

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
      if (data.image_url) return `IMAGE_RESPONSE:${data.image_url}`;
      if (data.response) {
        const imgTagMatch = data.response.match(/<img[^>]+src="(data:image\/[^"]+)"[^>]*>/i);
        if (imgTagMatch) return `IMAGE_RESPONSE:${imgTagMatch[1]}`;
        if (data.response.startsWith('data:image/')) return `IMAGE_RESPONSE:${data.response}`;
        if (data.response.match(/^[A-Za-z0-9+/]+=*$/) && data.response.length > 100) {
          return `IMAGE_RESPONSE:data:image/png;base64,${data.response}`;
        }
      }
      return data.response;
    } catch (error) {
      console.error('Backend error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check if your backend service is running and try again.');
        }
        if (error.message.includes('fetch')) {
          throw new Error(
            `Cannot connect to backend at ${YOUR_BACKEND_URL}. Please ensure your local LLM backend is running (python backend.py) and accessible.`
          );
        }
        throw error;
      }
      throw new Error('Sorry, I’m having trouble connecting to the backend service. Please try again later.');
    } finally {
      setCurrentStage('');
    }
  };

  // Call an agent function
  const callAnAgent = async () => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: [{ type: 'text', value: 'Call an Agent' }],
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await callYourBackend('Call an Agent');
      const voiceCallTrigger = parseVoiceCallTrigger(response);

      if (voiceCallTrigger) {
        await handleVoiceCallTrigger(voiceCallTrigger.agentId, voiceCallTrigger.roomName);
      } else {
        const content = parseMarkdownContent(response);
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Error calling agent:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: [{ type: 'text', value: 'Sorry, I was unable to connect you to an agent. Please try again later.' }],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: [{ type: 'text', value: 'I uploaded this image' }],
        timestamp: new Date(),
        imageUrl,
      };
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);
      handleSendMessage('', 'image_analysis');
    }
  };

  const handleSendMessage = async (
    message = inputMessage,
    useCase: 'text_query' | 'image_analysis' = 'text_query'
  ) => {
    if (!message.trim() && !selectedFile) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: [{ type: 'text', value: message || 'I uploaded an image' }],
      timestamp: new Date(),
      ...(selectedFile ? { imageUrl: URL.createObjectURL(selectedFile) } : {}),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await callYourBackend(message, useCase);
      const voiceCallTrigger = parseVoiceCallTrigger(response);

      if (voiceCallTrigger) {
        await handleVoiceCallTrigger(voiceCallTrigger.agentId, voiceCallTrigger.roomName);
        return;
      }

      let botMessage: ChatMessage;
      if (response.startsWith('IMAGE_RESPONSE:')) {
        const imageUrl = response.replace('IMAGE_RESPONSE:', '');
        botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: [{ type: 'text', value: 'Here is the generated image:' }],
          timestamp: new Date(),
          imageUrl,
        };
      } else {
        const content = parseMarkdownContent(response);
        botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content,
          timestamp: new Date(),
        };
      }
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: [{ type: 'text', value: error instanceof Error ? error.message : 'Sorry, something went wrong.' }],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  if (voiceCallActive && voiceCallData) {
    return (
      <VoiceCallInterface
        roomName={voiceCallData.roomName}
        token={voiceCallData.token!}
        participantName={user.name}
        onCallEnd={handleCallEnd}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-1 hover:bg-blue-700 rounded-full transition-all transform hover:scale-110"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 p-2 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold">AI Assistant</h1>
                <p className="text-xs text-blue-200">Welcome, {user.name}</p>
              </div>
              {currentStage && <span className="text-xs ml-2">{currentStage}</span>}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    message.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {message.type === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content.map((item, index) => (
                    <div key={index} className="mb-4 first:mb-0 last:mb-0">
                      {item.type === 'text' && (
                        <p className="whitespace-pre-wrap break-words">{item.value}</p>
                      )}
                      {item.type === 'list' && (
                        <ul className="list-disc pl-5 space-y-2">
                          {(item.value as string[]).map((listItem, liIndex) => (
                            <li key={liIndex} className="text-sm">{listItem}</li>
                          ))}
                        </ul>
                      )}
                      {item.type === 'table' && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-200">
                                {(item.value as { headers: string[]; rows: string[][] }).headers.map((header, hIndex) => (
                                  <th
                                    key={hIndex}
                                    className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(item.value as { headers: string[]; rows: string[][] }).rows.map((row, rIndex) => (
                                <tr
                                  key={rIndex}
                                  className={rIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                  {row.map((cell, cIndex) => (
                                    <td
                                      key={cIndex}
                                      className={`border border-gray-300 px-4 py-2 text-sm ${
                                        cIndex > 1 ? 'text-right' : 'text-left' // Right-align numeric columns
                                      } text-gray-600`}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {index < message.content.length - 1 && message.content[index + 1].type === 'text' && message.content[index + 1].value.startsWith('(Total months:') && (
                            <p className="mt-2 text-sm text-gray-600">{message.content[index + 1].value}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {message.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={message.imageUrl}
                        alt="Response content"
                        className="max-w-full h-auto rounded border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src =
                            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTIzIDE5YTIgMiAwIDAgMS0yIDJIM2EyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmg0bDIgMmgxMGExIDEgMCAwIDEgMSAxdjExWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTMiIHI9IjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
                          target.alt = 'Image failed to load';
                        }}
                      />
                    </div>
                  )}

                  <p
                    className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 text-gray-600 p-2 rounded-full">
                  <Bot size={16} />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={callAnAgent}
              disabled={isTyping}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
            >
              <Phone size={16} />
              <span>Call an Agent</span>
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={triggerFileInput}
              className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
              title="Upload image"
            >
              <Paperclip size={20} />
            </button>
            {selectedFile && (
              <span className="text-sm text-gray-500 truncate max-w-[120px]">
                {selectedFile.name}
              </span>
            )}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() && !selectedFile}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};