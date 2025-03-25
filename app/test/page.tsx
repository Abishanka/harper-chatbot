'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function TestPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<string>('');
  const [openaiStatus, setOpenaiStatus] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');

  const testSupabaseConnection = async () => {
    try {
      setSupabaseStatus('Testing Supabase connection...');
      const supabase = createClient();
      const { data: workspaceData, error: workspaceError } = await supabase.from('workspaces').select('count');
      if (workspaceError) throw workspaceError;
      setSupabaseStatus('✅ Supabase connection to users and workspaces successful!');
    } catch (error) {
      setSupabaseStatus('❌ Supabase connection failed: ' + (error as Error).message);
    }
  };

  const testOpenAI = async () => {
    try {
      setOpenaiStatus('Testing OpenAI connection...');
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test' }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setOpenaiStatus('✅ OpenAI connection successful!');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setOpenaiStatus('❌ OpenAI connection failed: ' + (error as Error).message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTestFile(file);
    }
  };

  const testFileUpload = async () => {
    if (!testFile) {
      setUploadStatus('❌ Please select a file first');
      return;
    }

    try {
      setUploadStatus('Uploading file...');
      const fileExt = testFile.name.split('.').pop();
      const fileName = `test-${Math.random()}.${fileExt}`;
      const filePath = `test/${fileName}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, testFile);

      if (uploadError) throw uploadError;
      setUploadStatus('✅ File uploaded successfully!');
    } catch (error) {
      setUploadStatus('❌ File upload failed: ' + (error as Error).message);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'chat',
          message: chatMessage 
        }),
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setChatResponse(data.response);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setChatResponse('Error: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-12 text-center">API Test Page</h1>

        <div className="space-y-6">
          {/* Supabase Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-[#1a1a1a] mb-4">Supabase Connection</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={testSupabaseConnection}
                className="px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
              >
                Test Connection
              </button>
              <span className="text-sm text-gray-600">{supabaseStatus}</span>
            </div>
          </div>

          {/* OpenAI Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-[#1a1a1a] mb-4">OpenAI Connection</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={testOpenAI}
                className="px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
              >
                Test Connection
              </button>
              <span className="text-sm text-gray-600">{openaiStatus}</span>
            </div>
          </div>

          {/* File Upload Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-[#1a1a1a] mb-4">File Upload</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="flex-1 text-sm text-gray-600"
                />
                <button
                  onClick={testFileUpload}
                  className="px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
                >
                  Upload
                </button>
              </div>
              <span className="text-sm text-gray-600">{uploadStatus}</span>
            </div>
          </div>

          {/* Chat Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-[#1a1a1a] mb-4">Chat Test</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6d63] focus:border-transparent text-[#1a1a1a] placeholder-gray-400"
                />
                <button
                  onClick={sendChatMessage}
                  className="px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
                >
                  Send
                </button>
              </div>
              {chatResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-[#1a1a1a] mb-2">Response:</p>
                  <p className="text-sm text-gray-600">{chatResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 