import { BoardSize, Coordinate, StoneColor } from '../types/game';

// Check if a stone at the given coordinate would have any liberties
export const hasLiberties = (board: StoneColor[][], coordinate: Coordinate): boolean => {
  const [x, y] = coordinate;
  const color = board[y][x];
  
  if (!color) return false; // No stone here
  
  const checked: boolean[][] = Array(board.length)
    .fill(false)
    .map(() => Array(board.length).fill(false));
  
  const hasLiberty = (x: number, y: number): boolean => {
    // Out of bounds
    if (x < 0 || y < 0 || x >= board.length || y >= board.length) return false;
    
    // Already checked
    if (checked[y][x]) return false;
    
    checked[y][x] = true;
    
    // Empty intersection = liberty
    if (board[y][x] === null) return true;
    
    // Different color = not part of the group
    if (board[y][x] !== color) return false;
    
    // Check adjacent intersections
    return hasLiberty(x + 1, y) || 
           hasLiberty(x - 1, y) || 
           hasLiberty(x, y + 1) || 
           hasLiberty(x, y - 1);
  };
  
  return hasLiberty(x, y);
};

// Get all adjacent coordinates
export const getAdjacentIntersections = (
  board: StoneColor[][], 
  [x, y]: Coordinate
): Coordinate[] => {
  const adjacent: Coordinate[] = [];
  
  if (x > 0) adjacent.push([x - 1, y]);
  if (x < board.length - 1) adjacent.push([x + 1, y]);
  if (y > 0) adjacent.push([x, y - 1]);
  if (y < board.length - 1) adjacent.push([x, y + 1]);
  
  return adjacent;
};

// Find all stones in a group
export const findGroup = (
  board: StoneColor[][], 
  start: Coordinate
): Coordinate[] => {
  const [sx, sy] = start;
  const color = board[sy][sx];
  
  if (!color) return [];
  
  const checked: boolean[][] = Array(board.length)
    .fill(false)
    .map(() => Array(board.length).fill(false));
  
  const group: Coordinate[] = [];
  
  const findGroupRecursive = (x: number, y: number) => {
    // Out of bounds
    if (x < 0 || y < 0 || x >= board.length || y >= board.length) return;
    
    // Already checked or different color
    if (checked[y][x] || board[y][x] !== color) return;
    
    checked[y][x] = true;
    group.push([x, y]);
    
    // Check adjacent intersections
    findGroupRecursive(x + 1, y);
    findGroupRecursive(x - 1, y);
    findGroupRecursive(x, y + 1);
    findGroupRecursive(x, y - 1);
  };
  
  findGroupRecursive(sx, sy);
  
  return group;
};

// Check if a move is legal
export const checkLegalMove = (
  board: StoneColor[][], 
  coordinate: Coordinate, 
  color: StoneColor,
  previousBoard: StoneColor[][] | null
): boolean => {
  const [x, y] = coordinate;
  
  // Can't play outside the board or on a stone
  if (x < 0 || y < 0 || x >= board.length || y >= board.length || board[y][x] !== null) {
    return false;
  }
  
  // Place the stone temporarily
  const newBoard = board.map(row => [...row]);
  newBoard[y][x] = color;
  
  // Check if the stone has liberties
  if (hasLiberties(newBoard, coordinate)) {
    return true;
  }
  
  // If it doesn't have liberties, check if it captures any opponent stones
  const adjacent = getAdjacentIntersections(board, coordinate);
  const opponentColor = color === 'black' ? 'white' : 'black';
  
  for (const [ax, ay] of adjacent) {
    if (board[ay][ax] === opponentColor) {
      const adjacentGroup = findGroup(board, [ax, ay]);
      
      let hasLibertiesOtherThanPlacement = false;
      
      for (const [gx, gy] of adjacentGroup) {
        const groupAdjacent = getAdjacentIntersections(board, [gx, gy]);
        
        for (const [gadx, gady] of groupAdjacent) {
          // Skip the placement point
          if (gadx === x && gady === y) continue;
          
          if (board[gady][gadx] === null) {
            hasLibertiesOtherThanPlacement = true;
            break;
          }
        }
        
        if (hasLibertiesOtherThanPlacement) break;
      }
      
      if (!hasLibertiesOtherThanPlacement) {
        return true; // The move captures opponent stones
      }
    }
  }
  
  // Check for ko rule: don't repeat the previous board position
  if (previousBoard) {
    let isSameAsPrevious = true;
    
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        if (newBoard[y][x] !== previousBoard[y][x]) {
          isSameAsPrevious = false;
          break;
        }
      }
      if (!isSameAsPrevious) break;
    }
    
    if (isSameAsPrevious) {
      return false; // Ko rule violation
    }
  }
  
  // The move would be suicide and doesn't capture any stones
  return false;
};

// Find stones that would be captured by a move
export const findCaptures = (
  board: StoneColor[][], 
  coordinate: Coordinate, 
  color: StoneColor
): Coordinate[] => {
  const [x, y] = coordinate;
  const captures: Coordinate[] = [];
  const oppositeColor = color === 'black' ? 'white' : 'black';
  
  // Check each adjacent group of the opposite color
  const adjacent = getAdjacentIntersections(board, coordinate);
  
  for (const [ax, ay] of adjacent) {
    if (board[ay][ax] === oppositeColor) {
      const group = findGroup(board, [ax, ay]);
      
      let hasLiberties = false;
      
      for (const [gx, gy] of group) {
        const groupAdjacent = getAdjacentIntersections(board, [gx, gy]);
        
        for (const [gadx, gady] of groupAdjacent) {
          if (board[gady][gadx] === null) {
            hasLiberties = true;
            break;
          }
        }
        
        if (hasLiberties) break;
      }
      
      if (!hasLiberties) {
        // This group is captured
        captures.push(...group);
      }
    }
  }
  
  return captures;
};

// Get all empty intersections on the board
export const getEmptyIntersections = (board: StoneColor[][]): Coordinate[] => {
  const empty: Coordinate[] = [];
  
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      if (board[y][x] === null) {
        empty.push([x, y]);
      }
    }
  }
  
  return empty;
};

// Calculate territory
export const calculateTerritory = (board: StoneColor[][]) => {
  const size = board.length;
  
  // Create a territory map
  const territory: StoneColor[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
  
  // Create a visited map
  const visited: boolean[][] = Array(size)
    .fill(false)
    .map(() => Array(size).fill(false));
  
  // Count of territory points
  let blackTerritory = 0;
  let whiteTerritory = 0;
  
  // Helper function to check if territory belongs to a color
  const floodFillTerritory = (x: number, y: number): { color: StoneColor, points: Coordinate[] } => {
    if (x < 0 || y < 0 || x >= size || y >= size || visited[y][x]) {
      return { color: null, points: [] };
    }
    
    // If we hit a stone, return its color (not territory)
    if (board[y][x] !== null) {
      return { color: board[y][x], points: [] };
    }
    
    visited[y][x] = true;
    const points: Coordinate[] = [[x, y]];
    
    // Set to track which colors surround this territory
    const surroundingColors = new Set<StoneColor>();
    
    // Check each direction
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
        if (board[ny][nx] !== null) {
          // This is a stone, add to surrounding colors
          surroundingColors.add(board[ny][nx]);
        } else if (!visited[ny][nx]) {
          // Continue flood fill
          const result = floodFillTerritory(nx, ny);
          points.push(...result.points);
          
          if (result.color) {
            surroundingColors.add(result.color);
          }
        }
      }
    }
    
    // If only one color surrounds this area, it's territory for that color
    if (surroundingColors.size === 1) {
      return { 
        color: surroundingColors.has('black') ? 'black' : 'white', 
        points 
      };
    }
    
    // Neutral territory or contested
    return { color: null, points };
  };
  
  // Check each empty intersection
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === null && !visited[y][x]) {
        const { color, points } = floodFillTerritory(x, y);
        
        if (color === 'black') {
          blackTerritory += points.length;
          points.forEach(([px, py]) => {
            territory[py][px] = 'black';
          });
        } else if (color === 'white') {
          whiteTerritory += points.length;
          points.forEach(([px, py]) => {
            territory[py][px] = 'white';
          });
        }
      }
    }
  }
  
  return {
    black: blackTerritory,
    white: whiteTerritory,
    map: territory
  };
};