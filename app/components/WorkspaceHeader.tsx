'use client';

import { useEffect, useState, useCallback } from 'react';
import { Database } from '@/types/supabase';
import { createClient } from '@/lib/supabase';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

export default function WorkspaceHeader({ workspaceId }: { workspaceId: string }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const updateWorkspace = useCallback(async (workspaceId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error) {
      console.error('Error fetching workspace from Supabase:', error);
      return null;
    }

    return data;
  }, []);

  useEffect(() => {
    async function fetchAndSetWorkspace() {
      setLoading(true);
      const updatedWorkspace = await updateWorkspace(workspaceId);
      setWorkspace(updatedWorkspace);
      setLoading(false);
    }

    fetchAndSetWorkspace();
  }, [workspaceId, updateWorkspace]);

  if (loading) {
    return <div className="animate-pulse h-8 bg-gray-200 rounded w-48"></div>;
  }

  if (!workspace) {
    return <div className="text-red-500">Workspace not found</div>;
  }

  return (
    <div className="w-full max-w-3xl p-4">
      <h2 className="text-xl font-semibold text-[#1a1a1a]">{workspace.name}</h2>
      {workspace.description && (
        <p className="text-sm text-gray-600 mt-1">{workspace.description}</p>
      )}
    </div>
  );
} 