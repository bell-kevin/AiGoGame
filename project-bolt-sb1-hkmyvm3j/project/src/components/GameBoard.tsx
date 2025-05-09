import React, { useCallback, useMemo } from 'react';
import { BoardSize, Coordinate, StoneColor } from '../types/game';
import Stone from './Stone';
import { useGameStore } from '../store/gameStore';

interface GameBoardProps {
  boardSize: BoardSize;
}

const GameBoard: React.FC<GameBoardProps> = ({ boardSize }) => {
  const { 
    board, 
    placeStone, 
    currentTurn, 
    lastMove, 
    gameOver,
    showTerritory,
    territoryMap,
    isAiThinking,
    theme
  } = useGameStore();
  
  const boardSizeClass = useMemo(() => {
    switch (boardSize) {
      case 9: return 'w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]';
      case 13: return 'w-[300px] h-[300px] sm:w-[390px] sm:h-[390px] md:w-[450px] md:h-[450px]';
      case 19: return 'w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px] lg:w-[600px] lg:h-[600px]';
      default: return 'w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px] lg:w-[600px] lg:h-[600px]';
    }
  }, [boardSize]);
  
  const handlePlaceStone = useCallback((x: number, y: number) => {
    if (gameOver || isAiThinking || currentTurn !== 'black') return;
    placeStone([x, y]);
  }, [placeStone, gameOver, currentTurn, isAiThinking]);
  
  const isLastMove = useCallback((x: number, y: number) => {
    return lastMove !== null && lastMove[0] === x && lastMove[1] === y;
  }, [lastMove]);
  
  // Render the board grid and stones
  const renderBoard = () => {
    const cells = [];
    const stoneSize = `calc(100% / ${boardSize})`;
    
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const isLast = isLastMove(x, y);
        const stoneColor = board[y][x];
        const territoryColor = showTerritory && territoryMap ? territoryMap[y][x] : null;
        
        // Calculate grid line classes
        let gridLineClasses = `absolute inset-0 pointer-events-none ${
          theme === 'dark' 
            ? 'bg-board-pattern-dark' 
            : 'bg-board-pattern'
        }`;
        
        // Determine if this is a hoshi (star) point
        const isHoshi = (() => {
          if (boardSize === 9) {
            return (x === 2 && y === 2) || 
                   (x === 6 && y === 2) || 
                   (x === 2 && y === 6) || 
                   (x === 6 && y === 6) ||
                   (x === 4 && y === 4);
          } else if (boardSize === 13) {
            return (x === 3 && y === 3) || 
                   (x === 9 && y === 3) || 
                   (x === 3 && y === 9) || 
                   (x === 9 && y === 9) ||
                   (x === 6 && y === 6);
          } else {
            return (x === 3 && y === 3) || 
                   (x === 9 && y === 3) || 
                   (x === 15 && y === 3) || 
                   (x === 3 && y === 9) || 
                   (x === 9 && y === 9) || 
                   (x === 15 && y === 9) || 
                   (x === 3 && y === 15) || 
                   (x === 9 && y === 15) || 
                   (x === 15 && y === 15);
          }
        })();
        
        cells.push(
          <div 
            key={`${x}-${y}`}
            className="relative"
            style={{ width: stoneSize, height: stoneSize }}
            onClick={() => handlePlaceStone(x, y)}
          >
            {/* Grid lines */}
            <div className={gridLineClasses}></div>
            
            {/* Hoshi (star) points */}
            {isHoshi && (
              <div className={`absolute w-2.5 h-2.5 rounded-full ${
                theme === 'dark' ? 'bg-stone-300' : 'bg-board-border'
              } transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 pointer-events-none`} />
            )}
            
            {/* Territory markers */}
            {showTerritory && territoryColor && !stoneColor && (
              <div 
                className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 opacity-60 ${
                  territoryColor === 'black' ? 'bg-stone-black' : 'bg-stone-white border border-gray-300'
                }`}
              />
            )}
            
            {/* Stones */}
            {stoneColor && (
              <Stone 
                color={stoneColor} 
                isLast={isLast}
                x={x}
                y={y}
                theme={theme}
              />
            )}
          </div>
        );
      }
    }
    
    return cells;
  };
  
  return (
    <div 
      className={`relative ${boardSizeClass} ${
        theme === 'dark' 
          ? 'bg-stone-700 border-stone-900' 
          : 'bg-board-light border-board-border'
      } border-4 rounded-sm shadow-lg grid`}
      style={{
        gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
        gridTemplateRows: `repeat(${boardSize}, 1fr)`,
        backgroundSize: `calc(100% / ${boardSize - 1}) calc(100% / ${boardSize - 1})`,
      }}
    >
      {renderBoard()}
      
      {/* Hover effect for black stones (player's turn) */}
      <style jsx>{`
        @media (hover: hover) {
          div[role="button"]:hover::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 85%;
            height: 85%;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.15);
            z-index: 5;
            pointer-events: none;
            display: ${currentTurn === 'black' && !gameOver && !isAiThinking ? 'block' : 'none'};
          }
        }
        
        .bg-board-pattern {
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.2) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 1px, transparent 1px);
        }
        
        .bg-board-pattern-dark {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
        }
      `}</style>
      
      {/* Loading overlay when AI is thinking */}
      {isAiThinking && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-10 rounded-sm">
          <div className={`${
            theme === 'dark' ? 'bg-stone-800 text-white' : 'bg-white text-accent-primary'
          } px-4 py-2 rounded-md shadow-md`}>
            <p className="animate-pulse">AI is thinking...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;