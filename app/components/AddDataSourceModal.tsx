import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Media = Database['public']['Tables']['media']['Row'];

interface AddDataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onMediaAdded: (media: Media) => void;
}

export default function AddDataSourceModal({
  isOpen,
  onClose,
  workspaceId,
  onMediaAdded,
}: AddDataSourceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${workspaceId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create media record in database
      const mediaType = file.type.startsWith('image/') ? 'image' : 'file';
      const { data: media, error: mediaError } = await supabase
        .from('media')
        .insert({
          name: file.name,
          media_type: mediaType,
          owner_id: (await supabase.auth.getUser()).data.user?.id || '',
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Create media-workspace mapping
      const { error: mappingError } = await supabase
        .from('media_workspace_mapping')
        .insert({
          media_id: media.id,
          workspace_id: workspaceId,
          added_by: (await supabase.auth.getUser()).data.user?.id || '',
        });

      if (mappingError) throw mappingError;

      onMediaAdded(media);
      onClose();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Data Source</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6d63] focus:border-transparent"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-[#ff6d63] text-white rounded-lg hover:bg-[#ff857c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
} 