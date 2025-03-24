'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import AddDataSourceModal from '@/app/components/AddDataSourceModal';
import MediaSources from '@/app/components/MediaSources';
import WorkspaceHeader from '@/app/components/WorkspaceHeader';
import ChatInterface from '@/app/components/ChatInterface';

type Media = Database['public']['Tables']['media']['Row'];

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMediaAdded = (media: Media) => {
    // Refresh the media sources list
    // This will be handled by the MediaSources component's useEffect
  };

  return (
    <div className="flex h-full">
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
        
        <MediaSources workspaceId={params.id} />
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        <WorkspaceHeader workspaceId={params.id} />
        <ChatInterface workspaceId={params.id} />
      </div>

      {/* Add Data Source Modal */}
      <AddDataSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={params.id}
        onMediaAdded={handleMediaAdded}
      />
    </div>
  );
} 