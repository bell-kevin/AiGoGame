import React from 'react';
import { StoneColor, Theme } from '../types/game';

interface StoneProps {
  color: StoneColor;
  isLast: boolean;
  x: number;
  y: number;
  theme: Theme;
}

const Stone: React.FC<StoneProps> = ({ color, isLast, x, y, theme }) => {
  if (!color) return null;
  
  return (
    <div 
      className={`
        absolute inset-0 m-auto w-[95%] h-[95%] rounded-full 
        ${color === 'black' ? 'bg-stone-black' : 'bg-stone-white border border-gray-300'} 
        shadow-stone transform -translate-x-1/2 -translate-y-1/2 
        top-1/2 left-1/2 animate-stone-place z-10
        ${isLast ? `ring-4 ${theme === 'dark' ? 'ring-amber-500' : 'ring-accent-highlight'} ring-opacity-60` : ''}
      `}
      data-position={`${x},${y}`}
      style={{
        boxShadow: color === 'black' 
          ? '0 3px 6px rgba(0, 0, 0, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.2)' 
          : '0 3px 6px rgba(0, 0, 0, 0.3), inset 0 -2px 2px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Stone gradient effect */}
      <div 
        className={`absolute inset-0 rounded-full ${
          color === 'black' 
            ? 'bg-gradient-to-br from-gray-600 to-transparent opacity-30' 
            : 'bg-gradient-to-br from-white to-transparent opacity-70'
        }`}
      />
    </div>
  );
};

export default Stone;