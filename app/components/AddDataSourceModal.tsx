'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Media = Database['public']['Tables']['media']['Row'];

type DataSource = {
  id: string;
  name: string;
  size: string;
  addedDate: string;
};

interface AddDataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onMediaAdded: (media: Media) => void;
  existingSources: DataSource[];
}

export default function AddDataSourceModal({
  isOpen,
  onClose,
  workspaceId,
  onMediaAdded,
  existingSources,
}: AddDataSourceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSources, setAvailableSources] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('upload');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSources();
    }
  }, [isOpen]);

  const fetchAvailableSources = async () => {
    try {
      const supabaseClient = createClient();
      
      // Get user ID from localStorage instead of Supabase auth
      const userId = typeof window !== 'undefined' ? localStorage.getItem('clerk-user-id') : null;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: media, error } = await supabaseClient
        .from('media')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableSources(media || []);
    } catch (err) {
      console.error('Error fetching available sources:', err);
      setError('Failed to load available sources');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get user ID from localStorage instead of Supabase auth
      const userId = typeof window !== 'undefined' ? localStorage.getItem('clerk-user-id') : null;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const supabaseClient = createClient();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      formData.append('userId', userId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      onMediaAdded(result);
      onClose();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddExistingSource = async (media: Media) => {
    try {
      // Get user ID from localStorage instead of Supabase auth
      const userId = typeof window !== 'undefined' ? localStorage.getItem('clerk-user-id') : null;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const supabaseClient = createClient();
      const { error: mappingError } = await supabaseClient
        .from('media_workspace_mapping')
        .insert({
          media_id: media.id,
          workspace_id: workspaceId,
          added_by: userId,
        });

      if (mappingError) throw mappingError;

      onMediaAdded(media);
      onClose();
    } catch (err) {
      console.error('Error adding existing source:', err);
      setError('Failed to add source. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Add Data Source</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === 'upload'
                ? 'text-[#ff6d63] border-b-2 border-[#ff6d63]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload New
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === 'existing'
                ? 'text-[#ff6d63] border-b-2 border-[#ff6d63]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Existing Sources
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Click to upload a file'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
                </p>
              </label>
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        {/* Existing Sources Tab */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
                  </div>
                ))}
              </div>
            ) : availableSources.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No existing sources found
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableSources.map((source) => (
                  <div
                    key={source.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleAddExistingSource(source)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400">
                          {source.media_type === 'file' ? '📄' : '🖼️'}
                        </span>
                        <span className="text-sm font-medium text-[#1a1a1a]">
                          {source.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddExistingSource(source);
                        }}
                        className="px-3 py-1 text-sm bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Added {new Date(source.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 