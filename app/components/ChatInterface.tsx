'use client';

import { useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface ChatInterfaceProps {
  workspaceId: string;
}

export default function ChatInterface({ workspaceId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you analyze and discuss the data sources in this workspace. What would you like to know?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = { role: 'user' as const, content: inputMessage };
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // First get the media IDs for this workspace
      const { data: mediaMappings, error: mappingError } = await fetch(`/api/getMediaMappings?workspaceId=${workspaceId}`)
        .then(response => response.json());

      if (mappingError) throw mappingError;

      const mediaIds = mediaMappings.map((mapping: { media_id: any; }) => mapping.media_id);

      // Then get the chunks for these media items
      const { data: chunks, error: chunksError } = await fetch(`/api/getChunks?mediaIds=${mediaIds.join(',')}`)
        .then(response => response.json());

      if (chunksError) throw chunksError;

      // TODO: Implement semantic search and response generation
      // For now, just echo back a response with some context
      const response = {
        role: 'assistant' as const,
        content: `I received your message: "${inputMessage}". I have access to ${chunks?.length || 0} chunks of text from your workspace's media sources.`
      };
      setMessages(prev => [...prev, response]);
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
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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