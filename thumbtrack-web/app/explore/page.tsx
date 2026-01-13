'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Pin, TagCount } from '@/types';
import { MasonryGrid } from '@/components/masonry-grid';
import { useTheme, accentColors } from '@/lib/theme-context';

// Popular topic categories with icons and colors
const topicCategories = [
  { name: 'Nature', icon: '🌿', color: 'bg-green-100 dark:bg-green-900/30', tags: ['nature', 'landscape', 'wildlife', 'forest', 'ocean'] },
  { name: 'Travel', icon: '✈️', color: 'bg-blue-100 dark:bg-blue-900/30', tags: ['travel', 'adventure', 'vacation', 'beach', 'mountains'] },
  { name: 'Food', icon: '🍕', color: 'bg-orange-100 dark:bg-orange-900/30', tags: ['food', 'cooking', 'recipes', 'baking', 'healthy'] },
  { name: 'Art', icon: '🎨', color: 'bg-purple-100 dark:bg-purple-900/30', tags: ['art', 'painting', 'illustration', 'design', 'creative'] },
  { name: 'Photography', icon: '📷', color: 'bg-pink-100 dark:bg-pink-900/30', tags: ['photography', 'portrait', 'macro', 'street'] },
  { name: 'Fashion', icon: '👗', color: 'bg-rose-100 dark:bg-rose-900/30', tags: ['fashion', 'style', 'outfit', 'clothing'] },
  { name: 'Home', icon: '🏠', color: 'bg-amber-100 dark:bg-amber-900/30', tags: ['home', 'interior', 'decor', 'diy', 'garden'] },
  { name: 'Tech', icon: '💻', color: 'bg-cyan-100 dark:bg-cyan-900/30', tags: ['technology', 'gadgets', 'coding', 'apps'] },
  { name: 'Fitness', icon: '💪', color: 'bg-red-100 dark:bg-red-900/30', tags: ['fitness', 'workout', 'gym', 'health', 'yoga'] },
  { name: 'Animals', icon: '🐾', color: 'bg-yellow-100 dark:bg-yellow-900/30', tags: ['animals', 'pets', 'dogs', 'cats', 'wildlife'] },
  { name: 'Music', icon: '🎵', color: 'bg-indigo-100 dark:bg-indigo-900/30', tags: ['music', 'instruments', 'concerts', 'bands'] },
  { name: 'Books', icon: '📚', color: 'bg-teal-100 dark:bg-teal-900/30', tags: ['books', 'reading', 'library', 'quotes'] },
];

export default function ExplorePage() {
  const [popularTags, setPopularTags] = useState<TagCount[]>([]);
  const [trendingPins, setTrendingPins] = useState<Pin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPins, setCategoryPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const { accentColor } = useTheme();
  const colors = accentColors[accentColor];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsRes, trendingRes] = await Promise.all([
          api.getPopularTags(),
          api.getTrendingPins(),
        ]);
        setPopularTags(tagsRes.tags);
        setTrendingPins(trendingRes.pins);
      } catch (error) {
        console.error('Failed to fetch explore data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = async (category: typeof topicCategories[0]) => {
    if (selectedCategory === category.name) {
      setSelectedCategory(null);
      setCategoryPins([]);
      return;
    }

    setSelectedCategory(category.name);
    setIsLoadingCategory(true);

    try {
      // Search for pins matching any of the category's tags
      const results = await api.search('', { tags: category.tags, limit: 30 });
      setCategoryPins(results.pins);
    } catch (error) {
      console.error('Failed to fetch category pins:', error);
    } finally {
      setIsLoadingCategory(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Explore</h1>

      {/* Topic Categories */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Popular Topics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {topicCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategoryClick(category)}
              className={`${category.color} rounded-2xl p-4 text-center transition-all hover:scale-105 ${
                selectedCategory === category.name ? 'ring-2 ring-offset-2' : ''
              }`}
              style={selectedCategory === category.name ? { '--tw-ring-color': colors.primary } as React.CSSProperties : undefined}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{category.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Category Results */}
      {selectedCategory && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{selectedCategory} Pins</h2>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setCategoryPins([]);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear
            </button>
          </div>
          {isLoadingCategory ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
            </div>
          ) : categoryPins.length > 0 ? (
            <MasonryGrid pins={categoryPins} />
          ) : (
            <p className="text-center text-gray-500 py-8">No pins found for this category</p>
          )}
        </section>
      )}

      {/* Popular Tags */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Trending Tags</h2>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Link
              key={tag.tag}
              href={`/search?tags=${encodeURIComponent(tag.tag)}`}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: colors.light, color: colors.primary }}
            >
              #{tag.tag}
              <span className="ml-2 text-gray-500 dark:text-gray-400">({tag.count})</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Pins */}
      {!selectedCategory && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Trending Right Now</h2>
          {trendingPins.length > 0 ? (
            <MasonryGrid pins={trendingPins} />
          ) : (
            <p className="text-center text-gray-500 py-8">No trending pins yet</p>
          )}
        </section>
      )}
    </div>
  );
}
