'use client';

import { useState, useEffect } from 'react';
import AddDataSourceModal from '@/app/components/AddDataSourceModal';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Media = Database['public']['Tables']['media']['Row'];

type DataSource = {
  id: string;
  name: string;
  size: string;
  addedDate: string;
};

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Database['public']['Tables']['workspaces']['Row'][]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const resolvedParams = await params;
      setWorkspaceId(resolvedParams.id);

      const supabase = createClient();

      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', resolvedParams.id);

      if (workspacesError || !workspacesData || workspacesData.length === 0) {
        console.error('Workspace not found:', workspacesError);
        setLoading(false);
        return <div>404 Not Found</div>;
      }

      setWorkspaces(workspacesData);

      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('owner_id', resolvedParams.id);

      if (mediaError) {
        console.error('Error fetching media:', mediaError);
      } else {
        setDataSources(mediaData);
      }

      setLoading(false);
    }

    fetchData();
  }, [params]);

  if (loading) return <div>Loading...</div>;

  if (!workspaceId) return <div>404 Not Found</div>;

  const onMediaAdded = (media: Media) => {
    const newSource: DataSource = {
      id: media.id,
      name: media.name,
      size: 'Unknown', // You might want to calculate or fetch the actual size
      addedDate: new Date(media.created_at).toLocaleDateString(),
    };
    setDataSources((prevSources) => [...prevSources, newSource]);
  };

  return (
    <div className="flex h-full">
      {workspaces.length > 0 && (
        <>
          {/* Data Sources Panel */}
          <div className="w-80 bg-white border-r border-gray-100 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Data Sources</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1 text-sm bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
              >
                Add Source
              </button>
            </div>
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1a1a1a]">{workspace.name}</span>
                    <span className="text-xs text-gray-600">{workspace.description || 'No description'}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">Created at {new Date(workspace.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col items-center bg-gray-50">
            {/* Chat Header */}
            <div className="w-full max-w-3xl p-4">
              <h2 className="text-xl font-semibold text-[#1a1a1a]">Research Papers Chat</h2>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-4 pb-8">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#ff6d63] flex items-center justify-center text-white">
                  AI
                </div>
                <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-[#1a1a1a]">Hello! I'm your AI assistant. I can help you analyze and discuss the data sources in this workspace. What would you like to know?</p>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="w-full max-w-3xl border border-gray-200 p-4 bg-white mb-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6d63] focus:border-transparent text-[#1a1a1a] placeholder-gray-400"
                />
                <button className="px-6 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Add Data Source Modal */}
          {workspaceId && (
            <AddDataSourceModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              existingSources={dataSources}
              workspaceId={workspaceId}
              onMediaAdded={onMediaAdded}
            />
          )}
        </>
      )}
    </div>
  );
} 