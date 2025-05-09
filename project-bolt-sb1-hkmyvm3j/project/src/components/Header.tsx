import React from 'react';
import { GitMerge } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const Header: React.FC = () => {
  const { theme } = useGameStore();
  
  return (
    <header className={`w-full ${
      theme === 'dark' ? 'bg-stone-800' : 'bg-white'
    } shadow-sm py-4 mb-6`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <GitMerge size={28} className="text-accent-primary mr-2" />
          <h1 className="text-2xl font-bold text-accent-primary">Go Game</h1>
        </div>
        <p className={`text-center ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        } mt-1`}>Play against AI with customizable difficulty</p>
      </div>
    </header>
  );
};

export default Header;