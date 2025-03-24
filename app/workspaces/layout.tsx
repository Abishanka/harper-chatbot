'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
          <button className="mx-4 px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors w-[calc(100%-2rem)]">
            New Workspace
          </button>
        )}

        <nav className="mt-4">
          {!isSidebarCollapsed && (
            <div className="px-4 py-2 text-sm text-gray-500">Your Workspaces</div>
          )}
          <div className="space-y-1">
            <Link 
              href="/workspaces/1" 
              className={`flex items-center px-4 py-2 text-[#2a4450] hover:bg-gray-100 transition-colors ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <span className="w-2 h-2 bg-[#ff6d63] rounded-full mr-2"></span>
              {!isSidebarCollapsed && <span>Research Papers</span>}
            </Link>
            <Link 
              href="/workspaces/2" 
              className={`flex items-center px-4 py-2 text-[#2a4450] hover:bg-gray-100 transition-colors ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <span className="w-2 h-2 bg-[#ff6d63] rounded-full mr-2"></span>
              {!isSidebarCollapsed && <span>Company Docs</span>}
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white">
        {children}
      </div>
    </div>
  );
} 