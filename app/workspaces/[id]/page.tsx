'use client';

import { useState, useEffect } from 'react';
import AddDataSourceModal from '@/app/components/AddDataSourceModal';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/clerk-react';
import ChatInterface from '@/app/components/ChatInterface';

type Media = Database['public']['Tables']['media']['Row'] & {
  size?: number;
};

type DataSource = {
  id: string;
  name: string;
  original_name: string;
  size: string;
  addedDate: string;
};

// Helper function to get user ID from localStorage
function getUserIdFromStorage() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('clerk-user-id');
}

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Database['public']['Tables']['workspaces']['Row'][]>([]);
  const [workspaceNotFound, setWorkspaceNotFound] = useState(false);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const resolvedParams = await params;
        setWorkspaceId(resolvedParams.id);

        if (!user || !isLoaded) {
          console.error('User not authenticated');
          setLoading(false);
          return;
        }

        const supabase = createClient();

        // First, check if the workspace exists and belongs to the user
        const { data: workspacesData, error: workspacesError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', resolvedParams.id)
          .eq('owner_id', user.id)
          .single();

        if (workspacesError || !workspacesData) {
          console.error('Workspace not found or unauthorized:', workspacesError);
          setLoading(false);
          setWorkspaceNotFound(true);
          return;
        }

        setWorkspaces([workspacesData]);

        // Then fetch the media data for this workspace
        const fetchMediaData = async (workspaceId: string, userId: string) => {
          try {
            // Step 1: Get media IDs associated with the workspace
            const { data: mediaMapping, error: mappingError } = await supabase
              .from('media_workspace_mapping')
              .select('media_id')
              .eq('workspace_id', workspaceId)

            if (mappingError) throw mappingError;

            const mediaIds = mediaMapping?.map((mapping: { media_id: string }) => mapping.media_id) || [];

            // Step 2: Fetch media records using the media IDs
            if (mediaIds.length > 0) {
              const { data: mediaData, error: mediaError } = await supabase
                .from('media')
                .select('*')
                .in('id', mediaIds)
                .order('created_at', { ascending: false });

              if (mediaError) throw mediaError;

              const formattedDataSources: DataSource[] = (mediaData || []).map(media => ({
                id: media.id,
                name: media.name,
                original_name: media.original_name,
                size: media.size?.toString() || 'Unknown',
                addedDate: new Date(media.created_at).toLocaleDateString()
              }));

              setDataSources(formattedDataSources);
            } else {
              setDataSources([]); // No media found for the workspace
            }
          } catch (error) {
            console.error('Error fetching media:', error);
          }
        };

        fetchMediaData(resolvedParams.id, user.id);
      } catch (error) {
        console.error('Error in fetchData:', error);
        setWorkspaceNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params, user, isLoaded]);

  // Loading state
  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6d63]"></div>
      </div>
    );
  }

  // Not found state
  if (workspaceNotFound) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4 text-[#ff6d63]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-16 h-16 mx-auto"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v-.008H12v.008z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Workspace Not Found</h1>
          <p className="text-gray-600 mt-2">
            The workspace you are looking for does not exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/workspaces')}
            className="mt-4 px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
          >
            Return to Workspaces
          </button>
        </div>
      </div>
    );
  }

  const onMediaAdded = (media: Media) => {
    // const newSource: DataSource = {
    //   id: media.id,
    //   name: media.name,
    //   original_name: media.original_name,
    //   size: media.size?.toString() || 'Unknown',
    //   addedDate: new Date(media.created_at).toLocaleDateString(),
    // };
    // setDataSources(prevSources => [...prevSources, newSource]);
  };

  return (
    <div className="flex h-full">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>
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
              {dataSources.map((source) => (
                <div key={source.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1a1a1a]">{source.original_name}</span>
                    <span className="text-xs text-gray-600">{source.size}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">Added {source.addedDate}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col items-center bg-gray-50">
            {/* Chat Header */}
            <div className="w-full max-w-3xl p-4">
              <h2 className="text-xl font-semibold text-[#1a1a1a]">
                {workspaces[0]?.name || 'Workspace'}
              </h2>
            </div>

            {/* Chat Interface */}
            <ChatInterface workspaceId={workspaceId || ''} userId={user?.id || ''} />

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
          </div>
        </>
      )}
    </div>
  );
} 