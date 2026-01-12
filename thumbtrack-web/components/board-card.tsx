'use client';

import Link from 'next/link';
import { Board } from '@/types';

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  const coverImages = board.coverImages || [];

  return (
    <Link href={`/board/${board.id}`} className="group block">
      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        {coverImages.length > 0 ? (
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5">
            {coverImages.slice(0, 4).map((imageUrl, index) => (
              <div
                key={index}
                className={`bg-gray-200 dark:bg-gray-700 overflow-hidden ${
                  coverImages.length === 1 ? 'col-span-2 row-span-2' : ''
                } ${coverImages.length === 2 && index === 0 ? 'col-span-2' : ''}`}
              >
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {coverImages.length < 4 &&
              [...Array(4 - coverImages.length)].map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-gray-200 dark:bg-gray-700"
                />
              ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        )}
        {board.isPrivate && (
          <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <div className="mt-2 px-1">
        <h3 className="font-medium text-sm">{board.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {board.pinCount} {board.pinCount === 1 ? 'pin' : 'pins'}
        </p>
      </div>
    </Link>
  );
}
