import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { BoardSize, Difficulty } from '../types/game';
import { Menu, ChevronDown, Play, SkipForward, Flag, HelpCircle, Award, X, ArrowLeft, Sun, Moon } from 'lucide-react';

const tutorialSteps = [
  "Welcome to Go! Let's learn how to play. Click 'Next' to continue.",
  "You'll play as Black, and the AI will play as White. Click on any intersection to place a stone.",
  "The goal is to surround territory and capture opponent's stones. Stones are captured when they have no empty spaces (liberties) adjacent to them.",
  "You can pass your turn if you don't want to make a move. Two consecutive passes end the game.",
  "The score is calculated based on territory (empty spaces surrounded by your stones) and captured stones.",
  "Let's start playing! Try placing your first stone near the center of the board."
];

const GameControls: React.FC = () => {
  const { 
    passTurn, 
    resign, 
    resetGame, 
    setDifficulty, 
    difficulty, 
    toggleTerritoryView, 
    setBoardSize, 
    boardSize,
    gameOver,
    currentTurn,
    blackCaptures,
    whiteCaptures,
    showTutorial,
    tutorialStep,
    nextTutorialStep,
    previousTutorialStep,
    closeTutorial,
    theme,
    toggleTheme
  } = useGameStore();
  
  const [showRules, setShowRules] = useState(false);
  
  const difficultyOptions: { value: Difficulty, label: string }[] = [
    { value: 'very-easy', label: 'Very Easy' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'very-hard', label: 'Very Hard' }
  ];
  
  const sizeOptions: { value: BoardSize, label: string }[] = [
    { value: 9, label: '9×9' },
    { value: 13, label: '13×13' },
    { value: 19, label: '19×19' }
  ];
  
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Tutorial overlay */}
      {showTutorial && (
        <div className={`${
          theme === 'dark' ? 'bg-stone-800 text-white' : 'bg-white'
        } rounded-lg shadow-lg p-6 mb-4 relative`}>
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={previousTutorialStep}
              className={`${
                tutorialStep > 0 
                  ? 'text-accent-primary hover:text-accent-highlight' 
                  : 'text-gray-400 cursor-not-allowed'
              } transition-colors`}
              disabled={tutorialStep === 0}
            >
              <ArrowLeft size={20} />
            </button>
            <button 
              onClick={closeTutorial}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-lg mb-4">{tutorialSteps[tutorialStep]}</p>
          <button
            onClick={nextTutorialStep}
            className="bg-accent-primary hover:bg-accent-highlight text-white px-4 py-2 rounded-md transition-colors"
          >
            Next
          </button>
        </div>
      )}
      
      <div className={`${
        theme === 'dark' ? 'bg-stone-800 text-white' : 'bg-white'
      } rounded-lg shadow-md p-4 mb-4`}>
        {/* Theme toggle and current turn */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${
              currentTurn === 'black' 
                ? 'bg-stone-black animate-pulse' 
                : 'bg-stone-white border border-gray-300'
            } mr-2`}></div>
            <span className="font-semibold">{currentTurn === 'black' ? "Your Turn" : "AI's Turn"}</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        {/* Captures */}
        <div className="flex justify-end gap-4 mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-stone-black mr-1"></div>
            <span>Captures: {blackCaptures}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-stone-white border border-gray-200 mr-1"></div>
            <span>Captures: {whiteCaptures}</span>
          </div>
        </div>
        
        {/* Game controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button 
            onClick={() => resetGame(boardSize)}
            className="flex items-center justify-center gap-1 bg-accent-primary hover:bg-accent-highlight text-white py-2 px-3 rounded-md transition-colors"
          >
            <Play size={18} />
            <span>New Game</span>
          </button>
          
          <button 
            onClick={passTurn}
            disabled={gameOver}
            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-md transition-colors ${
              gameOver 
                ? 'bg-gray-200 text-gray-500 dark:bg-stone-700 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-accent-secondary hover:bg-accent-highlight text-accent-primary dark:bg-stone-700 dark:text-white dark:hover:bg-stone-600'
            }`}
          >
            <SkipForward size={18} />
            <span>Pass</span>
          </button>
          
          <button 
            onClick={resign}
            disabled={gameOver}
            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-md transition-colors ${
              gameOver 
                ? 'bg-gray-200 text-gray-500 dark:bg-stone-700 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-red-50 text-accent-danger border border-accent-danger dark:bg-stone-700 dark:hover:bg-stone-600'
            }`}
          >
            <Flag size={18} />
            <span>Resign</span>
          </button>
          
          <button 
            onClick={toggleTerritoryView}
            className={`flex items-center justify-center gap-1 py-2 px-3 rounded-md transition-colors ${
              theme === 'dark'
                ? 'bg-stone-700 hover:bg-stone-600 text-white border border-stone-600'
                : 'bg-white hover:bg-accent-secondary/20 text-accent-primary border border-accent-secondary'
            }`}
          >
            <Award size={18} />
            <span>Territory</span>
          </button>
        </div>
        
        {/* Game settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            } mb-1`}>AI Difficulty</label>
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className={`block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md border appearance-none ${
                  theme === 'dark'
                    ? 'bg-stone-700 border-stone-600 text-white'
                    : 'border-gray-300 focus:ring-accent-primary focus:border-accent-primary'
                }`}
              >
                {difficultyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} />
              </div>
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            } mb-1`}>Board Size</label>
            <div className="relative">
              <select
                value={boardSize}
                onChange={(e) => resetGame(Number(e.target.value) as BoardSize)}
                className={`block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md border appearance-none ${
                  theme === 'dark'
                    ? 'bg-stone-700 border-stone-600 text-white'
                    : 'border-gray-300 focus:ring-accent-primary focus:border-accent-primary'
                }`}
              >
                {sizeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronDown size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Rules button */}
        <div className="mt-4 text-right">
          <button 
            onClick={() => setShowRules(!showRules)}
            className={`flex items-center gap-1 ${
              theme === 'dark'
                ? 'text-accent-highlight hover:text-accent-secondary'
                : 'text-accent-primary hover:text-accent-highlight'
            } transition-colors ml-auto`}
          >
            <HelpCircle size={16} />
            <span>{showRules ? 'Hide Rules' : 'Show Rules'}</span>
          </button>
        </div>
        
        {/* Rules section */}
        {showRules && (
          <div className={`mt-4 p-4 rounded-md border ${
            theme === 'dark'
              ? 'bg-stone-700 border-stone-600'
              : 'bg-stone-50 border-accent-secondary/30'
          } text-sm`}>
            <h3 className="text-lg font-semibold mb-2">Rules of Go</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Go is played on a grid where stones are placed on intersections.</li>
              <li>Players take turns placing stones - you play as Black, AI plays as White.</li>
              <li>Stones of the same color that are connected by lines form groups.</li>
              <li>A group must have at least one liberty (empty adjacent intersection) to remain on the board.</li>
              <li>When a group has no liberties, it is captured and removed from the board.</li>
              <li>The Ko rule prevents immediate repetition of board positions.</li>
              <li>The game ends when both players pass consecutively.</li>
              <li>The winner is determined by territory (empty intersections surrounded by one color) and captures.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameControls;