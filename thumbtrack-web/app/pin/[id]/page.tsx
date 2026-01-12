'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Pin } from '@/types';
import { SavePinModal } from '@/components/save-pin-modal';
import { CommentsSection } from '@/components/comments-section';

export default function PinPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [pin, setPin] = useState<Pin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const pinId = params.id as string;

  useEffect(() => {
    async function fetchPin() {
      try {
        const { pin } = await api.getPin(pinId);
        setPin(pin);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pin');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPin();
  }, [pinId]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this pin?')) return;

    setIsDeleting(true);
    try {
      await api.deletePin(pinId);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pin');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse aspect-[3/4]" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !pin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-red-500 text-lg">{error || 'Pin not found'}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === pin.userId;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="bg-gray-100 dark:bg-gray-800">
            <img
              src={pin.imageUrl}
              alt={pin.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{pin.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                {user && (
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium transition-colors"
                  >
                    Save
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>

            {pin.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                {pin.description}
              </p>
            )}

            {pin.link && (
              <a
                href={pin.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-blue-500 hover:underline"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Visit link
              </a>
            )}

            <Link
              href={`/user/${pin.user.username}`}
              className="flex items-center gap-3 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-2 rounded-lg transition-colors"
            >
              {pin.user.avatarUrl ? (
                <img
                  src={pin.user.avatarUrl}
                  alt={pin.user.username}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {pin.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{pin.user.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(pin.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>

            {/* Comments Section */}
            <CommentsSection pinId={pinId} />
          </div>
        </div>
      </div>

      {/* Save Modal */}
      <SavePinModal
        pinId={pinId}
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
      />

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
}
