'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface ImageUploadProps {
  onImageUrl: (url: string) => void;
  currentUrl?: string;
}

interface UploadStats {
  originalSize: number;
  convertedSize: number;
  compressionRatio: string;
  width: number;
  height: number;
}

export function ImageUpload({ onImageUrl, currentUrl }: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [isR2Available, setIsR2Available] = useState<boolean | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    // Check if R2 uploads are available
    api.getUploadStatus()
      .then(({ configured }) => {
        setIsR2Available(configured);
        if (!configured) {
          setMode('url');
        }
      })
      .catch(() => {
        setIsR2Available(false);
        setMode('url');
      });
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError('');
    setUploadStats(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Simulate progress during upload + conversion
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90));
      }, 150);

      // Upload and convert to WebP on server
      const result = await api.uploadImageToR2(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update to the actual URL (now WebP)
      setPreviewUrl(result.publicUrl);
      onImageUrl(result.publicUrl);
      
      // Store stats for display
      setUploadStats({
        originalSize: result.originalSize,
        convertedSize: result.convertedSize,
        compressionRatio: result.compressionRatio,
        width: result.width,
        height: result.height,
      });
      
      // Clean up local preview
      URL.revokeObjectURL(localPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      setPreviewUrl(urlInput);
      onImageUrl(urlInput);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      {isR2Available && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Upload Image
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'url'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Image URL
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {mode === 'upload' && isR2Available ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto">
                <svg className="animate-spin w-full h-full text-red-500" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                {dragActive ? 'Drop your image here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                PNG, JPG, GIF, WEBP up to 10MB
              </p>
              <p className="text-green-600 dark:text-green-400 text-xs mt-2">
                ✨ Auto-converted to WebP for faster loading
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="imageUrl" className="block text-sm font-medium">
            Image URL <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="imageUrl"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={handleUrlSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-shadow"
              placeholder="https://example.com/image.jpg"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Load
            </button>
          </div>
          {!isR2Available && isR2Available !== null && (
            <p className="text-xs text-gray-500">
              Image upload is not configured. Please use an external image URL.
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-xl object-cover max-h-96"
              onError={() => {
                setError('Failed to load image');
                setPreviewUrl('');
              }}
            />
            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                setUrlInput('');
                setUploadStats(null);
                onImageUrl('');
              }}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conversion Stats */}
          {uploadStats && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Converted to WebP
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-600 dark:text-green-400">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Original:</span>{' '}
                  {formatFileSize(uploadStats.originalSize)}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">WebP:</span>{' '}
                  {formatFileSize(uploadStats.convertedSize)}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Saved:</span>{' '}
                  <span className="font-medium">{uploadStats.compressionRatio}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Size:</span>{' '}
                  {uploadStats.width}×{uploadStats.height}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
