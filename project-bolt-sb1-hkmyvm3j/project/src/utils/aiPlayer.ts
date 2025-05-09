import { BoardSize, Coordinate, Difficulty, StoneColor } from '../types/game';
import { checkLegalMove, findGroup, getAdjacentIntersections, getEmptyIntersections } from './gameLogic';

// Prioritize corners and edges for openings
const getStrategicPoints = (boardSize: BoardSize): Coordinate[] => {
  const points: Coordinate[] = [];
  const edgeDistance = boardSize === 19 ? 3 : boardSize === 13 ? 2 : 2;
  
  // Corner star points (hoshi)
  points.push([edgeDistance, edgeDistance]);
  points.push([boardSize - edgeDistance - 1, edgeDistance]);
  points.push([edgeDistance, boardSize - edgeDistance - 1]);
  points.push([boardSize - edgeDistance - 1, boardSize - edgeDistance - 1]);
  
  // Side star points
  if (boardSize >= 13) {
    const mid = Math.floor(boardSize / 2);
    points.push([mid, edgeDistance]);
    points.push([mid, boardSize - edgeDistance - 1]);
    points.push([edgeDistance, mid]);
    points.push([boardSize - edgeDistance - 1, mid]);
    
    // Center point
    if (boardSize === 19) {
      points.push([mid, mid]);
    }
  }
  
  return points;
};

// Calculate a simple "influence map" based on stone positions
const calculateInfluenceMap = (board: StoneColor[][]): { black: number[][], white: number[][] } => {
  const size = board.length;
  const blackInfluence: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  const whiteInfluence: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Function to add influence from a stone
  const addInfluence = (map: number[][], x: number, y: number, strength: number) => {
    const radius = 3; // How far the influence extends
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        
        // Skip out of bounds
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        
        // Calculate distance-based influence
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const influence = Math.max(0, strength * (1 - distance / radius));
          map[ny][nx] += influence;
        }
      }
    }
  };
  
  // Add influence for each stone
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === 'black') {
        addInfluence(blackInfluence, x, y, 1.0);
      } else if (board[y][x] === 'white') {
        addInfluence(whiteInfluence, x, y, 1.0);
      }
    }
  }
  
  return { black: blackInfluence, white: whiteInfluence };
};

// Find groups with few liberties (in atari or close to it)
const findWeakGroups = (board: StoneColor[][], color: StoneColor): Coordinate[] => {
  const size = board.length;
  const visited: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));
  const weakPoints: Coordinate[] = [];
  
  // Find all groups of the given color
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === color && !visited[y][x]) {
        const group = findGroup(board, [x, y]);
        
        // Mark all stones in the group as visited
        group.forEach(([gx, gy]) => {
          visited[gy][gx] = true;
        });
        
        // Count liberties of the group
        const liberties = new Set<string>();
        
        group.forEach(([gx, gy]) => {
          const adjacent = getAdjacentIntersections(board, [gx, gy]);
          
          adjacent.forEach(([ax, ay]) => {
            if (board[ay][ax] === null) {
              liberties.add(`${ax},${ay}`);
            }
          });
        });
        
        // If the group has few liberties, add its liberty points as weak points
        if (liberties.size <= 2) {
          Array.from(liberties).forEach(lib => {
            const [lx, ly] = lib.split(',').map(Number);
            weakPoints.push([lx, ly]);
          });
        }
      }
    }
  }
  
  return weakPoints;
};

// Rate a move based on various heuristics
const rateMove = (
  board: StoneColor[][], 
  coordinate: Coordinate, 
  color: StoneColor,
  influence: { black: number[][], white: number[][] },
  strategicPoints: Coordinate[]
): number => {
  const [x, y] = coordinate;
  const size = board.length;
  let score = 0;
  
  // Avoid edges on larger boards for opening moves
  const moveCount = board.flat().filter(cell => cell !== null).length;
  const isOpening = moveCount < 12;
  
  if (isOpening && (x <= 1 || y <= 1 || x >= size - 2 || y >= size - 2)) {
    score -= 5;
  }
  
  // Prefer strategic points in the opening
  if (isOpening) {
    const isStrategic = strategicPoints.some(([sx, sy]) => sx === x && sy === y);
    if (isStrategic) {
      score += 10;
    }
  }
  
  // Consider influence maps
  const blackInfluence = influence.black[y][x];
  const whiteInfluence = influence.white[y][x];
  
  // If we're black, we want more black influence than white, and vice versa
  if (color === 'black') {
    score += (blackInfluence - whiteInfluence) * 3;
  } else {
    score += (whiteInfluence - blackInfluence) * 3;
  }
  
  // Avoid totally dominated areas of opponent
  const opponentInfluence = color === 'black' ? whiteInfluence : blackInfluence;
  const ourInfluence = color === 'black' ? blackInfluence : whiteInfluence;
  
  if (opponentInfluence > 2 * ourInfluence + 1) {
    score -= 8;
  }
  
  // Check if the move captures opponent stones
  const testBoard = board.map(row => [...row]);
  testBoard[y][x] = color;
  
  // Check if this move puts opponent groups in atari
  const opponentColor = color === 'black' ? 'white' : 'black';
  const adjacent = getAdjacentIntersections(board, coordinate);
  
  for (const [ax, ay] of adjacent) {
    if (board[ay][ax] === opponentColor) {
      const group = findGroup(board, [ax, ay]);
      
      // Count liberties of the group after our move
      const liberties = new Set<string>();
      
      group.forEach(([gx, gy]) => {
        const groupAdjacent = getAdjacentIntersections(board, [gx, gy]);
        
        groupAdjacent.forEach(([gadx, gady]) => {
          // Skip the point where we're placing our stone
          if (gadx === x && gady === y) return;
          
          if (board[gady][gadx] === null) {
            liberties.add(`${gadx},${gady}`);
          }
        });
      });
      
      // If the group would have only one liberty, this is a good move
      if (liberties.size === 1) {
        score += 15 + group.length * 2; // More points for larger groups
      } else if (liberties.size === 2) {
        score += 5; // Still good to reduce liberties
      }
    }
  }
  
  // Prefer connecting our stones
  let connectsOurStones = false;
  for (const [ax, ay] of adjacent) {
    if (board[ay][ax] === color) {
      connectsOurStones = true;
      score += 5;
      break;
    }
  }
  
  // Extra points for forming good shape (diagonal connections, etc.)
  if (connectsOurStones) {
    const diagonals: Coordinate[] = [
      [x - 1, y - 1], [x + 1, y - 1], 
      [x - 1, y + 1], [x + 1, y + 1]
    ];
    
    for (const [dx, dy] of diagonals) {
      if (dx >= 0 && dy >= 0 && dx < size && dy < size && board[dy][dx] === color) {
        score += 3; // Diagonal connections are good for eyes
      }
    }
  }
  
  return score;
};

// Generate a move for the AI based on difficulty
export const generateAiMove = (
  board: StoneColor[][], 
  previousBoard: StoneColor[][] | null,
  difficulty: Difficulty,
  boardSize: BoardSize
): Coordinate | null => {
  const color: StoneColor = 'white'; // AI plays as white
  const emptyPoints = getEmptyIntersections(board);
  
  if (emptyPoints.length === 0) return null;
  
  // Check for legal moves
  const legalMoves = emptyPoints.filter(coord => 
    checkLegalMove(board, coord, color, previousBoard)
  );
  
  if (legalMoves.length === 0) return null;
  
  // Very easy: pick a random legal move
  if (difficulty === 'very-easy') {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }
  
  // Get strategic points (corners, sides, center)
  const strategicPoints = getStrategicPoints(boardSize);
  
  // Calculate influence map
  const influence = calculateInfluenceMap(board);
  
  // Find weak groups
  const opponentWeakGroups = findWeakGroups(board, 'black');
  const ourWeakGroups = findWeakGroups(board, 'white');
  
  // Rate each move
  const ratedMoves = legalMoves.map(move => {
    let baseScore = rateMove(board, move, color, influence, strategicPoints);
    
    // Attacking opponent's weak groups is a priority
    if (opponentWeakGroups.some(([wx, wy]) => wx === move[0] && wy === move[1])) {
      baseScore += 20;
    }
    
    // Defending our weak groups is also important
    if (ourWeakGroups.some(([wx, wy]) => wx === move[0] && wy === move[1])) {
      baseScore += 18;
    }
    
    return { move, score: baseScore };
  });
  
  // For easy difficulty: 60% random, 40% best move
  if (difficulty === 'easy') {
    if (Math.random() < 0.6) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else {
      ratedMoves.sort((a, b) => b.score - a.score);
      return ratedMoves[0].move;
    }
  }
  
  // For medium difficulty: pick randomly among top 40% moves
  if (difficulty === 'medium') {
    ratedMoves.sort((a, b) => b.score - a.score);
    const topMoves = ratedMoves.slice(0, Math.max(1, Math.floor(ratedMoves.length * 0.4)));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }
  
  // For hard difficulty: pick randomly among top 20% moves
  if (difficulty === 'hard') {
    ratedMoves.sort((a, b) => b.score - a.score);
    const topMoves = ratedMoves.slice(0, Math.max(1, Math.floor(ratedMoves.length * 0.2)));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }
  
  // For very hard: pick the best move
  ratedMoves.sort((a, b) => b.score - a.score);
  return ratedMoves[0].move;
};