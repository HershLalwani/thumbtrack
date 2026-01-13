'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme, ThemeMode, AccentColor, accentColors } from '@/lib/theme-context';

export default function SettingsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { mode, accentColor, setMode, setAccentColor } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'appearance' | 'account'>('appearance');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" 
          style={{ borderColor: accentColors[accentColor].primary, borderTopColor: 'transparent' }} 
        />
      </div>
    );
  }

  if (!user) return null;

  const themeModes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: 'System',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const colorOptions: { value: AccentColor; label: string }[] = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'purple', label: 'Purple' },
    { value: 'orange', label: 'Orange' },
    { value: 'pink', label: 'Pink' },
    { value: 'teal', label: 'Teal' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'appearance'
              ? 'border-b-2'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          style={activeTab === 'appearance' ? { borderColor: accentColors[accentColor].primary, color: accentColors[accentColor].primary } : undefined}
        >
          Appearance
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === 'account'
              ? 'border-b-2'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          style={activeTab === 'account' ? { borderColor: accentColors[accentColor].primary, color: accentColors[accentColor].primary } : undefined}
        >
          Account
        </button>
      </div>

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-8">
          {/* Theme Mode */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Theme Mode</h2>
            <div className="grid grid-cols-3 gap-4">
              {themeModes.map((themeMode) => (
                <button
                  key={themeMode.value}
                  onClick={() => setMode(themeMode.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    mode === themeMode.value
                      ? 'border-current'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={mode === themeMode.value ? { borderColor: accentColors[accentColor].primary, color: accentColors[accentColor].primary } : undefined}
                >
                  {themeMode.icon}
                  <span className="text-sm font-medium">{themeMode.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Accent Color */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Accent Color</h2>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={`w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                    accentColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''
                  }`}
                  style={{ backgroundColor: accentColors[color.value].primary }}
                  title={color.label}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Current: <span className="font-medium capitalize">{accentColor}</span>
            </p>
          </section>

          {/* Preview */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
              <button
                className="px-6 py-2 rounded-full text-white font-medium transition-colors"
                style={{ backgroundColor: accentColors[accentColor].primary }}
              >
                Primary Button
              </button>
              <div 
                className="px-4 py-2 rounded-lg inline-block ml-4"
                style={{ backgroundColor: accentColors[accentColor].light, color: accentColors[accentColor].primary }}
              >
                Tag Example
              </div>
              <p className="text-sm text-gray-500">
                Your selected theme will be applied across the entire app.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-8">
          {/* Profile Info */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: accentColors[accentColor].primary }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{user.username}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Username</label>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  {user.bio && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Bio</label>
                      <p className="font-medium">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: accentColors[accentColor].primary }}>
                  {user.followers ?? user._count?.followers ?? 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: accentColors[accentColor].primary }}>
                  {user.following ?? user._count?.following ?? 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-300">Log out</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">Sign out of your account on this device</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
