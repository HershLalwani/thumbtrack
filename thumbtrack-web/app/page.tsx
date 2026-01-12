'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Pin } from '@/types';
import { MasonryGrid } from '@/components/masonry-grid';
import { LandingPage } from '@/components/landing-page';

type FeedType = 'for-you' | 'following' | 'trending';

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<FeedType>('for-you');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchFeed() {
      setIsLoading(true);
      setError(null);

      try {
        let result: { pins: Pin[] };
        
        switch (feedType) {
          case 'for-you':
            result = await api.getForYouFeed();
            break;
          case 'following':
            result = await api.getFollowingFeed();
            break;
          case 'trending':
            result = await api.getTrendingPins();
            break;
          default:
            result = await api.getForYouFeed();
        }
        
        setPins(result.pins);
      } catch (err) {
        // Fallback to regular pins if recommendation fails
        try {
          const { pins } = await api.getPins(1, 40);
          setPins(pins);
        } catch (fallbackErr) {
          setError(err instanceof Error ? err.message : 'Failed to load pins');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeed();
  }, [user, authLoading, feedType]);

  // Show landing page for non-authenticated users
  if (!authLoading && !user) {
    return <LandingPage />;
  }

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              style={{ height: `${200 + (i % 3) * 50}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Feed Type Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setFeedType('for-you')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            feedType === 'for-you'
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setFeedType('following')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            feedType === 'following'
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Following
        </button>
        <button
          onClick={() => setFeedType('trending')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            feedType === 'trending'
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Trending
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              style={{ height: `${200 + (i % 3) * 50}px` }}
            />
          ))}
        </div>
      ) : pins.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {feedType === 'following' ? 'No pins from people you follow' : 'No pins yet'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {feedType === 'following'
              ? 'Follow some creators to see their pins here'
              : 'Be the first to create a pin!'}
          </p>
        </div>
      ) : (
        <MasonryGrid pins={pins} />
      )}
    </div>
  );
}
