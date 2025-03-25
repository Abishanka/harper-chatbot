'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { ReactNode } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';

function CustomModal({ isOpen, onClose, children, title }: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleMouseDown = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          event.stopPropagation();
        }
      };

      document.addEventListener('mousedown', handleMouseDown);

      return () => {
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const input = modalRef.current?.querySelector('input');
      input?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
        {children}
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg">Close</button>
      </div>
    </div>
  );
}

function getUserIdFromStorage() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('clerk-user-id');
  }
  return null;
}

export default function WorkspaceHomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const router = useRouter();

  const createWorkspace = async () => {
    if (!newWorkspaceName) return;
    
    const ownerId = getUserIdFromStorage();
    if (!ownerId) {
      console.error('User ID not found in local storage');
      return;
    }
    
    setIsCreatingWorkspace(true);
    const supabaseClient = createClient();

    try {
      const { data, error } = await supabaseClient
        .from('workspaces')
        .insert([{ name: newWorkspaceName, owner_id: ownerId }])
        .select();

      if (error) {
        console.error('Error creating workspace:', error);
      } else {
        setNewWorkspaceName('');
        setIsModalOpen(false);
        
        // Refresh the page or redirect to workspaces list
        router.push('/workspaces');
      }
    } catch (err) {
      console.error('Error in workspace creation:', err);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleSignOut = () => {
    // Clear any client-side storage related to the user's session
    localStorage.removeItem('clerk-db');
    sessionStorage.clear();
    // Additional cleanup if needed
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-50 relative">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Select or Create a Workspace</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mt-4 px-6 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
        >
          New Workspace
        </button>
      </div>
      <CustomModal onClose={() => setIsModalOpen(false)} title="Create New Workspace" isOpen={isModalOpen}>
        <input
          type="text"
          value={newWorkspaceName}
          onChange={(e) => setNewWorkspaceName(e.target.value)}
          placeholder="Workspace Name"
          className="w-full px-4 py-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6d63]"
        />
        <button
          onClick={createWorkspace}
          className="w-full px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
          disabled={isCreatingWorkspace}
        >
          {isCreatingWorkspace ? 'Creating...' : 'Create Workspace'}
        </button>
      </CustomModal>
    </div>
  );
} 