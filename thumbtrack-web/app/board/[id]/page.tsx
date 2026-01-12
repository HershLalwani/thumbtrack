'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Board, Pin } from '@/types';
import { MasonryGrid } from '@/components/masonry-grid';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === board?.user?.id;

  useEffect(() => {
    async function fetchBoard() {
      try {
        const [boardRes, pinsRes] = await Promise.all([
          api.getBoard(boardId),
          api.getBoardPins(boardId),
        ]);
        setBoard(boardRes.board);
        setPins(pinsRes.pins);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load board');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBoard();
  }, [boardId]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this board? All saved pins will be removed.')) return;

    setIsDeleting(true);
    try {
      await api.deleteBoard(boardId);
      router.push(`/user/${user?.username}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              style={{ height: `${Math.random() * 150 + 200}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-red-500 text-lg">{error || 'Board not found'}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Board Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{board.name}</h1>
          {board.isPrivate && (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          )}
        </div>

        {board.description && (
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
            {board.description}
          </p>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {board.pinCount} {board.pinCount === 1 ? 'pin' : 'pins'}
        </p>

        {board.user && (
          <Link
            href={`/user/${board.user.username}`}
            className="flex items-center gap-2 mt-4 hover:underline"
          >
            {board.user.avatarUrl ? (
              <img
                src={board.user.avatarUrl}
                alt={board.user.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {board.user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-medium">{board.user.username}</span>
          </Link>
        )}

        {isOwner && (
          <div className="flex gap-2 mt-4">
            <Link
              href={`/board/${boardId}/edit`}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Pins */}
      <MasonryGrid pins={pins} />
    </div>
  );
}
