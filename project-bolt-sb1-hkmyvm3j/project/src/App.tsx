import React from 'react';
import { useGameStore } from './store/gameStore';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import GameStatus from './components/GameStatus';
import Header from './components/Header';

function App() {
  const { boardSize, theme } = useGameStore();

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900'
    } pb-12`}>
      <Header />
      
      <main className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <GameControls />
          
          <div className="mb-6">
            <GameBoard boardSize={boardSize} />
          </div>
          
          <GameStatus />
        </div>
      </main>
      
      <footer className={`mt-12 text-center ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      } text-sm`}>
        <p>© 2025 Go Game with AI</p>
      </footer>
    </div>
  );
}

export default App;