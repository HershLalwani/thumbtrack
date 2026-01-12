'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface FollowButtonProps {
  username: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ username, initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [isLoading, setIsLoading] = useState(!initialIsFollowing);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && initialIsFollowing === undefined) {
      api.checkFollowing(username)
        .then(({ isFollowing }) => setIsFollowing(isFollowing))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user, username, initialIsFollowing]);

  async function handleClick() {
    if (!user || isUpdating) return;

    setIsUpdating(true);
    try {
      if (isFollowing) {
        await api.unfollowUser(username);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await api.followUser(username);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  if (!user || user.username === username) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`px-6 py-2 rounded-full font-medium transition-all ${
        isFollowing
          ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
          : 'bg-red-500 hover:bg-red-600 text-white'
      } disabled:opacity-50`}
    >
      {isUpdating ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
