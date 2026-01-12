'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Pin, TagCount } from '@/types';
import { MasonryGrid } from '@/components/masonry-grid';
import { SearchBar } from '@/components/search-bar';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const tagParam = searchParams.get('tag');

  const [pins, setPins] = useState<Pin[]>([]);
  const [popularTags, setPopularTags] = useState<TagCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(tagParam ? [tagParam] : []);

  useEffect(() => {
    async function fetchPopularTags() {
      try {
        const { tags } = await api.getPopularTags();
        setPopularTags(tags);
      } catch (error) {
        console.error('Failed to fetch popular tags:', error);
      }
    }
    fetchPopularTags();
  }, []);

  useEffect(() => {
    async function search() {
      setIsLoading(true);
      try {
        const { pins } = await api.search(query, { tags: selectedTags });
        setPins(pins);
      } catch (error) {
        console.error('Search failed:', error);
        setPins([]);
      } finally {
        setIsLoading(false);
      }
    }

    search();
  }, [query, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchBar initialQuery={query} variant="page" />
      </div>

      {/* Popular tags */}
      {popularTags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Popular tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tag}
                <span className="ml-1 text-xs opacity-60">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active filters */}
      {(query || selectedTags.length > 0) && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Searching for:
          </span>
          {query && (
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              &quot;{query}&quot;
            </span>
          )}
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              #{tag}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          {(query || selectedTags.length > 0) && (
            <button
              onClick={() => {
                setSelectedTags([]);
                window.history.pushState({}, '', '/search');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              style={{ height: `${200 + Math.random() * 200}px` }}
            />
          ))}
        </div>
      ) : pins.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No pins found</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {query || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'Start exploring by searching for something'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Found {pins.length} pin{pins.length !== 1 ? 's' : ''}
          </p>
          <MasonryGrid pins={pins} />
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse max-w-2xl mx-auto" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
