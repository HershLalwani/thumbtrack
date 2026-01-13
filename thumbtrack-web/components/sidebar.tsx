'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme, accentColors } from '@/lib/theme-context';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Explore',
    href: '/explore',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    name: 'My Boards',
    href: '/boards',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    requiresAuth: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { accentColor } = useTheme();
  const colors = accentColors[accentColor];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40">
      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          // Skip auth-required items if not logged in
          if (item.requiresAuth && !user) return null;

          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                active
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              style={active ? { backgroundColor: colors.primary } : undefined}
            >
              {item.icon}
              {/* Tooltip */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Create Button */}
        {user && (
          <Link
            href="/create"
            className="group relative flex items-center justify-center w-12 h-12 rounded-xl text-white transition-colors mt-4"
            style={{ backgroundColor: colors.primary }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Create Pin
            </span>
          </Link>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        {user ? (
          <Link
            href="/settings"
            className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
              pathname === '/settings'
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={pathname === '/settings' ? { backgroundColor: colors.primary } : undefined}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Settings
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="group relative flex items-center justify-center w-12 h-12 rounded-xl text-white transition-colors"
            style={{ backgroundColor: colors.primary }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Sign in
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}

// Mobile bottom navigation
export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { accentColor } = useTheme();
  const colors = accentColors[accentColor];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const mobileItems = [
    { name: 'Home', href: '/', icon: navItems[0].icon },
    { name: 'Explore', href: '/explore', icon: navItems[1].icon },
    ...(user ? [{ name: 'Create', href: '/create', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )}] : []),
    ...(user ? [{ name: 'Boards', href: '/boards', icon: navItems[2].icon }] : []),
    { 
      name: user ? 'Settings' : 'Login', 
      href: user ? '/settings' : '/login', 
      icon: user ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 md:hidden">
      <div className="flex items-center justify-around h-full">
        {mobileItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors ${
                active ? '' : 'text-gray-500 dark:text-gray-400'
              }`}
              style={active ? { color: colors.primary } : undefined}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
