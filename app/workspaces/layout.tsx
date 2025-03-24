'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useUser } from '@clerk/clerk-react';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [workspaces, setWorkspaces] = useState<Database['public']['Tables']['workspaces']['Row'][]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Call the useUser hook at the top level of the component
  const { user } = useUser();
  const ownerId = user?.id; // Assuming user.id is the Clerk client ID

  useEffect(() => {
    async function fetchWorkspaces() {
      const supabaseClient = createClient();
      const { data: workspacesData, error } = await supabaseClient
        .from('workspaces')
        .select('*');

      if (error) {
        console.error('Error fetching workspaces:', error);
      } else {
        if (workspacesData) {
          setWorkspaces(workspacesData);
        }
      }
    }

    fetchWorkspaces();
  }, []);

  const handleWorkspaceClick = (workspaceId: string) => {
    const workspaceExists = workspaces.some(workspace => workspace.id === workspaceId);
    if (!workspaceExists) {
      return <div>404 Not Found</div>;
    }
    // Navigate to the workspace
  };

  const openModal = () => {
    console.log("Opening modal");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log("Closing modal");
    setIsModalOpen(false);
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName) return;
    setIsCreatingWorkspace(true);
    const supabaseClient = createClient();

    if (!ownerId) {
      console.error('User is not authenticated');
      setIsCreatingWorkspace(false);
      return;
    }

    const { data, error } = await supabaseClient
      .from('workspaces')
      .insert([{ name: newWorkspaceName, owner_id: ownerId }]);

    if (error) {
      console.error('Error creating workspace:', error);
    } else {
      if (data) {
        setWorkspaces([...workspaces, ...data]);
      }
      setNewWorkspaceName('');
      closeModal();
    }
    setIsCreatingWorkspace(false);
  };

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

  return (
    <div className="flex h-screen bg-[#2a4450]">
      {/* Sidebar */}
      <div className={`bg-white transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-xl font-semibold text-[#2a4450]">Workspaces</h2>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className={`w-6 h-6 text-[#2a4450] transform transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {!isSidebarCollapsed && (
          <button
            onClick={openModal}
            className="mx-4 px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors w-[calc(100%-2rem)]"
          >
            New Workspace
          </button>
        )}

        <nav className="mt-4">
          {!isSidebarCollapsed && (
            <div className="px-4 py-2 text-sm text-gray-500">Your Workspaces</div>
          )}
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <Link 
                key={workspace.id}
                href={`/workspaces/${workspace.id}`} 
                className={`flex items-center px-4 py-2 text-[#2a4450] hover:bg-gray-100 transition-colors ${
                  isSidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <span className="w-2 h-2 bg-[#ff6d63] rounded-full mr-2"></span>
                {!isSidebarCollapsed && <span>{workspace.name}</span>}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white">
        {children}
      </div>

      {/* New Workspace Modal */}
      {isModalOpen && (
        <CustomModal onClose={closeModal} title="Create New Workspace" isOpen={isModalOpen}>
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => {
              console.log('Input value:', e.target.value);
              setNewWorkspaceName(e.target.value);
            }}
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
      )}
    </div>
  );
} 