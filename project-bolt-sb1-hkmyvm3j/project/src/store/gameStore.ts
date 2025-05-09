import { create } from 'zustand';
import { BoardSize, Coordinate, Difficulty, GameState, Move, StoneColor, Theme } from '../types/game';
import { checkLegalMove, findCaptures, getAdjacentIntersections, getEmptyIntersections, calculateTerritory } from '../utils/gameLogic';
import { generateAiMove } from '../utils/aiPlayer';

const createEmptyBoard = (size: BoardSize): StoneColor[][] => {
  return Array(size).fill(null).map(() => Array(size).fill(null));
};

const cloneBoard = (board: StoneColor[][]): StoneColor[][] => {
  return board.map(row => [...row]);
};

const initialState: GameState = {
  board: createEmptyBoard(19),
  currentTurn: 'black',
  blackCaptures: 0,
  whiteCaptures: 0,
  previousBoard: null,
  previousTwoBoard: null,
  moveHistory: [],
  gameOver: false,
  winner: null,
  lastMove: null,
  boardSize: 19,
  difficulty: 'easy',
  showTerritory: false,
  territoryMap: null,
  isAiThinking: false,
  showTutorial: false,
  tutorialStep: 0,
  theme: 'light',
  aiTimeoutId: null
};

const tutorialSteps = [
  "Welcome to Go! Let's learn how to play. Click 'Next' to continue.",
  "You'll play as Black, and the AI will play as White. Click on any intersection to place a stone.",
  "The goal is to surround territory and capture opponent's stones. Stones are captured when they have no empty spaces (liberties) adjacent to them.",
  "You can pass your turn if you don't want to make a move. Two consecutive passes end the game.",
  "The score is calculated based on territory (empty spaces surrounded by your stones) and captured stones.",
  "Let's start playing! Try placing your first stone near the center of the board."
];

export const useGameStore = create<GameState & {
  placeStone: (coordinate: Coordinate) => void;
  resetGame: (size?: BoardSize) => void;
  passTurn: () => void;
  resign: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  toggleTerritoryView: () => void;
  setBoardSize: (size: BoardSize) => void;
  nextTutorialStep: () => void;
  previousTutorialStep: () => void;
  closeTutorial: () => void;
  toggleTheme: () => void;
}>((set, get) => ({
  ...initialState,
  
  placeStone: (coordinate: Coordinate) => {
    const state = get();
    
    if (state.gameOver || state.isAiThinking) return;
    
    // Player can only play as black
    if (state.currentTurn !== 'black') return;
    
    const [x, y] = coordinate;
    
    // Check if the move is legal
    if (!checkLegalMove(state.board, coordinate, state.currentTurn, state.previousBoard)) {
      return;
    }
    
    // Clone the current board to create the new board
    const newBoard = cloneBoard(state.board);
    
    // Place the stone
    newBoard[y][x] = state.currentTurn;
    
    // Find and remove captured stones
    const captures = findCaptures(newBoard, coordinate, state.currentTurn);
    
    // Update captures count
    const newBlackCaptures = state.currentTurn === 'black' 
      ? state.blackCaptures + captures.length 
      : state.blackCaptures;
    
    const newWhiteCaptures = state.currentTurn === 'white' 
      ? state.whiteCaptures + captures.length 
      : state.whiteCaptures;
    
    // Remove captured stones from the board
    captures.forEach(([cx, cy]) => {
      newBoard[cy][cx] = null;
    });
    
    // Record the move
    const newMove: Move = {
      color: state.currentTurn,
      coordinate,
      captures: captures.length
    };
    
    // Clear any existing AI timeout
    if (state.aiTimeoutId) {
      clearTimeout(state.aiTimeoutId);
    }
    
    // Advance tutorial if active
    const newTutorialStep = state.showTutorial ? state.tutorialStep + 1 : state.tutorialStep;
    const showTutorial = state.showTutorial && newTutorialStep < tutorialSteps.length;
    
    // Update the game state
    set({
      board: newBoard,
      currentTurn: 'white', // Switch to AI's turn
      blackCaptures: newBlackCaptures,
      whiteCaptures: newWhiteCaptures,
      previousTwoBoard: state.previousBoard, 
      previousBoard: state.board,
      moveHistory: [...state.moveHistory, newMove],
      lastMove: coordinate,
      isAiThinking: true, // AI will think about its move now
      tutorialStep: newTutorialStep,
      showTutorial,
    });
    
    // Set a timeout for AI's move
    const aiTimeoutId = setTimeout(() => {
      const currentState = get();
      if (currentState.gameOver || currentState.currentTurn !== 'white') return;
      
      // AI took too long, auto-resign
      set({
        gameOver: true,
        winner: 'black',
        isAiThinking: false,
        aiTimeoutId: null
      });
    }, 10000) as unknown as number;
    
    // Let the AI make its move
    setTimeout(() => {
      const currentState = get();
      if (currentState.gameOver || currentState.currentTurn !== 'white') return;
      
      // Generate AI move
      const aiMove = generateAiMove(
        currentState.board, 
        currentState.previousBoard,
        currentState.difficulty,
        currentState.boardSize
      );
      
      // Clear the timeout since we got a move
      if (currentState.aiTimeoutId) {
        clearTimeout(currentState.aiTimeoutId);
      }
      
      // AI passes if no move is returned
      if (!aiMove) {
        get().passTurn();
        return;
      }
      
      const [aiX, aiY] = aiMove;
      
      // Create new board with AI move
      const aiBoard = cloneBoard(currentState.board);
      aiBoard[aiY][aiX] = 'white';
      
      // Find and remove captured stones
      const aiCaptures = findCaptures(aiBoard, aiMove, 'white');
      
      // Update captures count
      const newBlackCapturesAfterAI = currentState.blackCaptures;
      const newWhiteCapturesAfterAI = currentState.whiteCaptures + aiCaptures.length;
      
      // Remove captured stones from the board
      aiCaptures.forEach(([cx, cy]) => {
        aiBoard[cy][cx] = null;
      });
      
      // Record the AI move
      const aiMoveRecord: Move = {
        color: 'white',
        coordinate: aiMove,
        captures: aiCaptures.length
      };
      
      // Update the game state after AI move
      set({
        board: aiBoard,
        currentTurn: 'black', // Back to player's turn
        blackCaptures: newBlackCapturesAfterAI,
        whiteCaptures: newWhiteCapturesAfterAI,
        previousTwoBoard: currentState.previousBoard,
        previousBoard: currentState.board,
        moveHistory: [...currentState.moveHistory, aiMoveRecord],
        lastMove: aiMove,
        isAiThinking: false,
        aiTimeoutId: null
      });
      
      // Check for end game condition (two consecutive passes)
      const moveHistoryWithAI = [...currentState.moveHistory, aiMoveRecord];
      if (moveHistoryWithAI.length >= 2) {
        const lastTwoMoves = moveHistoryWithAI.slice(-2);
        
        if (lastTwoMoves.every(move => move.coordinate === null)) {
          // Two consecutive passes, game is over
          const territory = calculateTerritory(aiBoard);
          
          // Determine winner based on captures and territory
          const blackScore = territory.black + newBlackCapturesAfterAI;
          const whiteScore = territory.white + newWhiteCapturesAfterAI;
          
          const winner = blackScore > whiteScore ? 'black' : 
                         whiteScore > blackScore ? 'white' : null;
          
          set({ 
            gameOver: true, 
            winner,
            territoryMap: territory.map,
            showTerritory: true
          });
        }
      }
    }, 1000); // Delay to simulate AI thinking
    
    // Store the timeout ID
    set({ aiTimeoutId });
  },
  
  passTurn: () => {
    const state = get();
    
    if (state.gameOver || state.isAiThinking) return;
    
    // Record the pass move
    const newMove: Move = {
      color: state.currentTurn,
      coordinate: null, // null indicates a pass
      captures: 0
    };
    
    const newMoveHistory = [...state.moveHistory, newMove];
    
    // Check if there are two consecutive passes
    if (newMoveHistory.length >= 2) {
      const lastTwoMoves = newMoveHistory.slice(-2);
      
      if (lastTwoMoves.every(move => move.coordinate === null)) {
        // Two consecutive passes, game is over
        const territory = calculateTerritory(state.board);
        
        // Determine winner based on captures and territory
        const blackScore = territory.black + state.blackCaptures;
        const whiteScore = territory.white + state.whiteCaptures;
        
        const winner = blackScore > whiteScore ? 'black' : 
                       whiteScore > blackScore ? 'white' : null;
        
        set({ 
          moveHistory: newMoveHistory,
          gameOver: true, 
          winner,
          territoryMap: territory.map,
          showTerritory: true
        });
        return;
      }
    }
    
    // Switch turns and update history
    set({
      currentTurn: state.currentTurn === 'black' ? 'white' : 'black',
      moveHistory: newMoveHistory,
      lastMove: null,
    });
    
    // If it's now AI's turn after player passed
    if (state.currentTurn === 'black') {
      set({ isAiThinking: true });
      
      const aiTimeoutId = setTimeout(() => {
        set({
          gameOver: true,
          winner: 'black',
          isAiThinking: false,
          aiTimeoutId: null
        });
      }, 10000) as unknown as number;
      
      setTimeout(() => {
        // AI usually also passes if player passes
        const randomPassOrPlay = Math.random();
        
        // Clear the timeout since we're making a decision
        if (state.aiTimeoutId) {
          clearTimeout(state.aiTimeoutId);
        }
        
        if (randomPassOrPlay > 0.3) {
          // AI passes as well
          get().passTurn();
        } else {
          // AI makes a move sometimes even after player passes
          const aiState = get();
          const aiMove = generateAiMove(
            aiState.board, 
            aiState.previousBoard,
            aiState.difficulty,
            aiState.boardSize
          );
          
          if (aiMove) {
            const [aiX, aiY] = aiMove;
            
            // Create new board with AI move
            const aiBoard = cloneBoard(aiState.board);
            aiBoard[aiY][aiX] = 'white';
            
            // Find and remove captured stones
            const aiCaptures = findCaptures(aiBoard, aiMove, 'white');
            
            // Update captures count
            const newWhiteCapturesAfterAI = aiState.whiteCaptures + aiCaptures.length;
            
            // Remove captured stones from the board
            aiCaptures.forEach(([cx, cy]) => {
              aiBoard[cy][cx] = null;
            });
            
            // Record the AI move
            const aiMoveRecord: Move = {
              color: 'white',
              coordinate: aiMove,
              captures: aiCaptures.length
            };
            
            set({
              board: aiBoard,
              currentTurn: 'black',
              whiteCaptures: newWhiteCapturesAfterAI,
              previousTwoBoard: aiState.previousBoard,
              previousBoard: aiState.board,
              moveHistory: [...aiState.moveHistory, aiMoveRecord],
              lastMove: aiMove,
              isAiThinking: false,
              aiTimeoutId: null
            });
          } else {
            // AI couldn't find a good move, so it passes too
            get().passTurn();
          }
        }
      }, 1000);
      
      // Store the timeout ID
      set({ aiTimeoutId });
    }
  },
  
  resign: () => {
    const state = get();
    if (state.aiTimeoutId) {
      clearTimeout(state.aiTimeoutId);
    }
    set({ 
      gameOver: true, 
      winner: 'white', // Player (black) resigns, so white (AI) wins
      aiTimeoutId: null
    });
  },
  
  resetGame: (size = 19) => {
    const state = get();
    if (state.aiTimeoutId) {
      clearTimeout(state.aiTimeoutId);
    }
    const showTutorial = state.difficulty === 'very-easy';
    
    set({
      ...initialState,
      board: createEmptyBoard(size),
      boardSize: size,
      difficulty: state.difficulty, // Keep the current difficulty
      theme: state.theme, // Keep the current theme
      showTutorial,
      tutorialStep: showTutorial ? 0 : -1,
      aiTimeoutId: null
    });
  },
  
  setDifficulty: (difficulty: Difficulty) => {
    const state = get();
    if (state.aiTimeoutId) {
      clearTimeout(state.aiTimeoutId);
    }
    const showTutorial = difficulty === 'very-easy';
    set({ 
      difficulty,
      showTutorial,
      tutorialStep: showTutorial ? 0 : -1,
      aiTimeoutId: null
    });
    get().resetGame(get().boardSize);
  },
  
  nextTutorialStep: () => {
    const state = get();
    const newStep = state.tutorialStep + 1;
    set({
      tutorialStep: newStep,
      showTutorial: newStep < tutorialSteps.length
    });
  },
  
  previousTutorialStep: () => {
    const state = get();
    if (state.tutorialStep > 0) {
      set({
        tutorialStep: state.tutorialStep - 1,
        showTutorial: true
      });
    }
  },
  
  closeTutorial: () => {
    set({
      showTutorial: false,
      tutorialStep: -1
    });
  },
  
  toggleTheme: () => {
    const state = get();
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    
    // Update document class for dark mode
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  toggleTerritoryView: () => {
    const state = get();
    
    if (!state.territoryMap) {
      const territory = calculateTerritory(state.board);
      set({
        showTerritory: !state.showTerritory,
        territoryMap: territory.map
      });
    } else {
      set({ showTerritory: !state.showTerritory });
    }
  },
  
  setBoardSize: (size: BoardSize) => {
    const state = get();
    if (state.aiTimeoutId) {
      clearTimeout(state.aiTimeoutId);
    }
    set({
      ...initialState,
      board: createEmptyBoard(size),
      boardSize: size,
      difficulty: state.difficulty, // Keep the current difficulty
      theme: state.theme, // Keep the current theme
      aiTimeoutId: null
    });
  }
}));