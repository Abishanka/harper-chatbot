import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase'

// Helper function to get user ID from localStorage
function getUserIdFromStorage() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('clerk-user-id');
}

// Client-side Supabase client for use in browser components
export function createClient() {
  const userId = getUserIdFromStorage();
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-clerk-user-id': userId || ''
        }
      }
    }
  );
}

// Helper function to check if a workspace exists
export async function checkWorkspaceExists(name: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('name', name)
    .single();

  if (error) {
    console.error('Error checking workspace:', error);
    return false;
  }

  return !!data;
}

// Helper function to create a new workspace
export async function createWorkspace(name: string) {
  const supabase = createClient();
  const userId = getUserIdFromStorage();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('workspaces')
    .insert([
      {
        name,
        owner_id: userId
      }
    ]);

  if (error) {
    console.error('Error creating workspace:', error);
    throw error;
  }
} 