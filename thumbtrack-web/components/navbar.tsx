'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { SearchBar } from '@/components/search-bar';
import { useTheme, accentColors } from '@/lib/theme-context';

export function Navbar() {
  const { user, isLoading } = useAuth();
  const { accentColor } = useTheme();
  const colors = accentColors[accentColor];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="h-full px-4 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-xl hidden sm:block">Thumbtrack</span>
        </Link>

        {/* Search Bar - Centered */}
        <div className="flex-1 max-w-2xl mx-auto hidden sm:block">
          <SearchBar />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ) : user ? (
            <Link
              href={`/user/${user.username}`}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  <span className="text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium hidden lg:block">
                {user.username}
              </span>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-full text-white font-medium transition-colors"
                style={{ backgroundColor: colors.primary }}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
