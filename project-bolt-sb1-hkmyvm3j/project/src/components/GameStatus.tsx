import React from 'react';
import { useGameStore } from '../store/gameStore';

const GameStatus: React.FC = () => {
  const { 
    gameOver, 
    winner,
    blackCaptures,
    whiteCaptures,
    showTerritory,
    territoryMap,
    board
  } = useGameStore();
  
  // Calculate territory if it's being shown
  const calculateScore = () => {
    if (!showTerritory || !territoryMap) return null;
    
    let blackTerritory = 0;
    let whiteTerritory = 0;
    
    territoryMap.forEach(row => {
      row.forEach(cell => {
        if (cell === 'black') blackTerritory++;
        else if (cell === 'white') whiteTerritory++;
      });
    });
    
    // Count stones on the board
    let blackStones = 0;
    let whiteStones = 0;
    
    board.forEach(row => {
      row.forEach(cell => {
        if (cell === 'black') blackStones++;
        else if (cell === 'white') whiteStones++;
      });
    });
    
    return {
      black: {
        territory: blackTerritory,
        captures: blackCaptures,
        stones: blackStones,
        total: blackTerritory + blackCaptures
      },
      white: {
        territory: whiteTerritory,
        captures: whiteCaptures,
        stones: whiteStones,
        total: whiteTerritory + whiteCaptures
      }
    };
  };
  
  const score = calculateScore();
  
  if (!gameOver && !score) return null;
  
  return (
    <div className="w-full max-w-xl mx-auto">
      {gameOver && (
        <div className={`text-center p-4 mb-4 rounded-lg shadow-md ${
          winner === 'black' 
            ? 'bg-emerald-100 text-emerald-800' 
            : winner === 'white' 
            ? 'bg-amber-100 text-amber-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          <h2 className="text-xl font-bold mb-2">
            {winner === 'black' 
              ? 'You Won!' 
              : winner === 'white' 
              ? 'AI Won!' 
              : 'Game Ended in a Draw!'}
          </h2>
        </div>
      )}
      
      {score && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-8 overflow-hidden">
          <h3 className="text-lg font-semibold mb-3 text-center">Score</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-stone-black mr-2"></div>
                  <span className="font-medium">You (Black)</span>
                </span>
                <span className="font-bold">{score.black.total}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1 pl-5">
                <div className="flex justify-between">
                  <span>Territory:</span>
                  <span>{score.black.territory}</span>
                </div>
                <div className="flex justify-between">
                  <span>Captures:</span>
                  <span>{score.black.captures}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stones:</span>
                  <span>{score.black.stones}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-stone-white border border-gray-300 mr-2"></div>
                  <span className="font-medium">AI (White)</span>
                </span>
                <span className="font-bold">{score.white.total}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1 pl-5">
                <div className="flex justify-between">
                  <span>Territory:</span>
                  <span>{score.white.territory}</span>
                </div>
                <div className="flex justify-between">
                  <span>Captures:</span>
                  <span>{score.white.captures}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stones:</span>
                  <span>{score.white.stones}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Result visualization */}
          <div className="mt-4 pt-3 border-t">
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-stone-black"
                style={{
                  width: `${Math.min(100, (score.black.total / (score.black.total + score.white.total)) * 100)}%`,
                }}
              />
              <div 
                className="absolute top-0 right-0 h-full bg-gray-100"
                style={{
                  width: `${Math.min(100, (score.white.total / (score.black.total + score.white.total)) * 100)}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                {score.black.total > score.white.total 
                  ? `Black leads by ${score.black.total - score.white.total}` 
                  : score.white.total > score.black.total
                  ? `White leads by ${score.white.total - score.black.total}`
                  : 'Even score'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStatus;