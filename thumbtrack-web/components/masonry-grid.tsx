'use client';

import { Pin } from '@/types';
import { PinCard } from './pin-card';

interface MasonryGridProps {
  pins: Pin[];
}

export function MasonryGrid({ pins }: MasonryGridProps) {
  if (pins.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No pins yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Be the first to create one!
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
      {pins.map((pin) => (
        <div key={pin.id} className="break-inside-avoid">
          <PinCard pin={pin} />
        </div>
      ))}
    </div>
  );
}
