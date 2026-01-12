'use client';

import Link from 'next/link';

const sampleImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=550&fit=crop',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400&h=650&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=550&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1482049016gy-7c8e97cf8d76?w=400&h=650&fit=crop',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=600&fit=crop',
];

export function LandingPage() {
  return (
    <div className="min-h-screen -mt-16">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-white dark:from-gray-900/80 dark:via-gray-900/50 dark:to-gray-900 z-10" />
          <div className="flex gap-4 opacity-40 dark:opacity-20">
            {[0, 1, 2, 3, 4, 5].map((col) => (
              <div
                key={col}
                className={`flex flex-col gap-4 min-w-[200px] ${col % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'}`}
              >
                {[...sampleImages, ...sampleImages].map((img, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl overflow-hidden"
                    style={{ height: `${200 + (idx % 3) * 100}px` }}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto pt-16">
          <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Welcome to Thumbtrack
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-red-600 to-gray-900 dark:from-white dark:via-red-400 dark:to-white bg-clip-text text-transparent">
            Get your next
            <br />
            great idea
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Discover recipes, home ideas, style inspiration, and other ideas to try.
            Save what you love, organized in boards.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-red-500/25"
            >
              Join for free
            </Link>
            <Link
              href="/login"
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Save ideas you love
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Collect your favorite ideas and organize them into boards to keep everything in one place.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Discover</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Explore millions of ideas for every part of your life.
              </p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Save</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Keep your favorite ideas organized in boards.
              </p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your ideas and inspire others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Explore popular categories
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Find inspiration in categories that match your interests.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Home Decor', color: 'from-amber-400 to-orange-500', icon: '🏠' },
              { name: 'Recipes', color: 'from-green-400 to-emerald-500', icon: '🍳' },
              { name: 'Travel', color: 'from-blue-400 to-cyan-500', icon: '✈️' },
              { name: 'Fashion', color: 'from-pink-400 to-rose-500', icon: '👗' },
              { name: 'Art', color: 'from-purple-400 to-violet-500', icon: '🎨' },
              { name: 'Fitness', color: 'from-red-400 to-rose-500', icon: '💪' },
              { name: 'DIY', color: 'from-yellow-400 to-amber-500', icon: '🔧' },
              { name: 'Photography', color: 'from-gray-400 to-slate-500', icon: '📷' },
            ].map((category) => (
              <div
                key={category.name}
                className={`relative aspect-square rounded-3xl bg-gradient-to-br ${category.color} p-6 flex flex-col justify-end cursor-pointer hover:scale-105 transition-transform overflow-hidden group`}
              >
                <div className="absolute top-4 right-4 text-4xl opacity-50 group-hover:opacity-100 transition-opacity">
                  {category.icon}
                </div>
                <span className="text-white font-semibold text-lg relative z-10">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-red-500 to-rose-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join millions of people discovering and saving creative ideas.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-red-500 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
          >
            Sign up for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold">Thumbtrack</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 Thumbtrack. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
