import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Media = Database['public']['Tables']['media']['Row'];
type MediaMapping = Database['public']['Tables']['media_workspace_mapping']['Row'] & {
  media: Media;
};

export default function MediaSources({ workspaceId }: { workspaceId: string }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      const { data, error } = await supabase
        .from('media_workspace_mapping')
        .select(`
          media:media_id (
            id,
            name,
            media_type,
            created_at,
            owner_id,
            vector_id
          )
        `)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error fetching media:', error);
        return;
      }

      const mediaItems = (data as MediaMapping[]).map(item => item.media);
      setMedia(mediaItems);
      setLoading(false);
    }

    fetchMedia();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No media sources added yet. Click "Add Source" to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {media.map((item) => (
        <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1a1a1a]">{item.name}</span>
            <span className="text-xs text-gray-600">
              {item.media_type === 'file' ? '📄' : '🖼️'}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Added {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
} 