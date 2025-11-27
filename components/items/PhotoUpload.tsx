'use client';

import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        return result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...photos, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      // Call delete API
      await fetch(`/api/upload?url=${encodeURIComponent(photoUrl)}`, {
        method: 'DELETE',
      });

      // Update local state
      onChange(photos.filter((p) => p !== photoUrl));
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      // Still remove from state even if delete fails
      onChange(photos.filter((p) => p !== photoUrl));
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div>
        <label
          htmlFor="photo-upload"
          className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-medium">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-gray-600">
              <Upload className="w-8 h-8" />
              <span className="font-medium">Click to upload photos</span>
              <span className="text-xs">JPG, PNG, or WebP (max 5MB)</span>
              <span className="text-xs text-gray-500">
                {photos.length}/{maxPhotos} photos
              </span>
            </div>
          )}
          <input
            id="photo-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={uploading || photos.length >= maxPhotos}
          />
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
            >
              <Image
                src={photo}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
