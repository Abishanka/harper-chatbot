import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase'

// Client-side Supabase client for use in browser components
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Function to check if a workspace exists
export async function checkWorkspaceExists(userId: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        console.error('Error checking workspace:', error);
        return false;
    }
    return !!data;
}

// Function to create a new workspace
export async function createWorkspace(userId: string, workspaceName: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('workspaces')
        .insert({
            user_id: userId,
            name: workspaceName
        });
    
    if (error) {
        console.error('Error creating workspace:', error);
        return false;
    }
    return true;
} 