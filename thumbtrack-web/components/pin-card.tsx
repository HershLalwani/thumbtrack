'use client';

import Link from 'next/link';
import { Pin } from '@/types';

interface PinCardProps {
  pin: Pin;
}

export function PinCard({ pin }: PinCardProps) {
  return (
    <Link href={`/pin/${pin.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={pin.imageUrl}
          alt={pin.title}
          className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
      <div className="mt-2 px-1">
        <h3 className="font-medium text-sm line-clamp-2">{pin.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {pin.user.avatarUrl ? (
            <img
              src={pin.user.avatarUrl}
              alt={pin.user.username}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-xs font-medium">
                {pin.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {pin.user.username}
          </span>
        </div>
      </div>
    </Link>
  );
}
