'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
};

type Source = {
  id: string;
  original_name: string;
  chunk_id: string;
  text: string;
  similarity: number;
};

interface ChatInterfaceProps {
  workspaceId: string;
  userId?: string;
}

export default function ChatInterface({ workspaceId, userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you analyze and discuss the data sources in this workspace. What would you like to know?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    console.log('Sending message:', inputMessage);  
    if (!inputMessage.trim() || !userId) return;

    const newMessage = { role: 'user' as const, content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://24.45.173.113:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': userId,
        },
        body: JSON.stringify({
          query: inputMessage,
          workspace_id: workspaceId,
          user_id: userId,
          max_context_chunks: 5
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from API:', errorData);
        throw new Error(`Failed to get response from AI: ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.context_sources
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center bg-gray-50">
      {/* Chat Messages */}
      <div className="flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-4 pb-8">
        {messages.map((message, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
              message.role === 'assistant' ? 'bg-[#ff6d63]' : 'bg-gray-500'
            }`}>
              {message.role === 'assistant' ? 'AI' : 'U'}
            </div>
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
              <p className="text-[#1a1a1a]">{message.content}</p>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 border-t pt-2">
                  <p className="text-sm text-gray-500 font-medium">Sources:</p>
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    {message.sources.map((source, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>{source.original_name} (similarity: {Math.round(source.similarity * 100)}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#ff6d63] flex items-center justify-center text-white">
              AI
            </div>
            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="w-full max-w-3xl border border-gray-200 p-4 bg-white mb-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6d63] focus:border-transparent text-[#1a1a1a] placeholder-gray-400"
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 