import { NextResponse } from 'next/server';
import { checkWorkspaceExists, createWorkspace } from '@/lib/supabase';

export async function GET(req: Request) {
    const userId = req.headers.get('user-id');
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const exists = await checkWorkspaceExists(userId);
    return NextResponse.json({ exists });
}

export async function POST(req: Request) {
    const { userId, workspaceName } = await req.json();
    if (!userId || !workspaceName) {
        return NextResponse.json({ error: 'User ID and workspace name are required' }, { status: 400 });
    }

    const success = await createWorkspace(userId, workspaceName);
    if (!success) {
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
} 