'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { User, Pin, Board } from '@/types';
import { MasonryGrid } from '@/components/masonry-grid';
import { BoardCard } from '@/components/board-card';
import { FollowButton } from '@/components/follow-button';

type Tab = 'pins' | 'boards';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('pins');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const { user } = await api.getUserProfile(username);
        setUser(user);

        // Fetch initial data based on active tab
        const [pinsRes, boardsRes] = await Promise.all([
          api.getUserPinsByUsername(username),
          api.getUserBoards(username),
        ]);
        setPins(pinsRes.pins);
        setBoards(boardsRes.boards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mt-4 animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mt-2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-red-500 text-lg">{error || 'User not found'}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-500 dark:text-gray-400">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold mt-4">{user.username}</h1>
        
        {user.bio && (
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center max-w-md">
            {user.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-3 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-gray-100">{user._count?.followers || 0}</strong> followers
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-gray-100">{user._count?.following || 0}</strong> following
          </span>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {user._count?.pins || 0} pins · {user._count?.boards || 0} boards
        </p>

        <div className="flex items-center gap-3 mt-4">
          {isOwnProfile ? (
            <Link
              href="/create"
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Create Pin
            </Link>
          ) : (
            <FollowButton 
              username={username} 
              onFollowChange={(isFollowing) => {
                setUser((prev) => prev ? {
                  ...prev,
                  _count: {
                    ...prev._count!,
                    followers: (prev._count?.followers || 0) + (isFollowing ? 1 : -1),
                  },
                } : null);
              }}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 border-b border-gray-200 dark:border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab('pins')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'pins'
              ? 'text-black dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Pins
          {activeTab === 'pins' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('boards')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'boards'
              ? 'text-black dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Boards
          {activeTab === 'boards' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pins' ? (
        <MasonryGrid pins={pins} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {isOwnProfile && (
            <Link
              href="/board/create"
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Create board</span>
            </Link>
          )}
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
          {boards.length === 0 && !isOwnProfile && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No boards yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
