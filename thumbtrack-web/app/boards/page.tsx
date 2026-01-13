'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { BoardSummary } from '@/types';
import { BoardCard } from '@/components/board-card';
import { useTheme, accentColors } from '@/lib/theme-context';

export default function MyBoardsPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const { accentColor } = useTheme();
  const colors = accentColors[accentColor];
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user]);

  const fetchBoards = async () => {
    try {
      const { boards } = await api.getMyBoards();
      setBoards(boards);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" 
          style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} 
        />
      </div>
    );
  }

  if (!user) return null;

  const ownedBoards = boards.filter(b => b.isOwner);
  const memberBoards = boards.filter(b => !b.isOwner);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Boards</h1>
        <Link
          href="/board/create"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium transition-colors"
          style={{ backgroundColor: colors.primary }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Board
        </Link>
      </div>

      {/* Owned Boards */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Your Boards</h2>
        {ownedBoards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ownedBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&apos;t created any boards yet</p>
            <Link
              href="/board/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              Create your first board
            </Link>
          </div>
        )}
      </section>

      {/* Member Boards */}
      {memberBoards.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Group Boards</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {memberBoards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
