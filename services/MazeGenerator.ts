
import { MazeCell, Position } from '../types';

// Simple deterministic random number generator to ensure the "Static" maze requirement
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export class MazeGenerator {
  private width: number;
  private height: number;
  private rng: SeededRandom;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.rng = new SeededRandom(555); // Changed seed to 555 for a more winding, non-direct path
  }

  public generate(): MazeCell[][] {
    // Reset RNG state with the specific seed to ensure identical generation every time
    this.rng = new SeededRandom(555);

    const grid: MazeCell[][] = Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => ({
        x,
        y,
        isWall: true,
      }))
    );

    const stack: Position[] = [];
    // Start DFS at an odd coordinate to align with the 2-step carving logic
    const startNode: Position = { x: 1, y: 1 };
    grid[startNode.y][startNode.x].isWall = false;
    stack.push(startNode);

    const visited = new Set<string>();
    visited.add(`${startNode.x},${startNode.y}`);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current, visited);

      if (neighbors.length > 0) {
        // Deterministic choice based on seed
        const next = neighbors[Math.floor(this.rng.next() * neighbors.length)];
        
        // Remove the wall between current and next
        const wallX = (current.x + next.x) / 2;
        const wallY = (current.y + next.y) / 2;
        grid[wallY][wallX].isWall = false;
        grid[next.y][next.x].isWall = false;

        visited.add(`${next.x},${next.y}`);
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    // Connect the absolute start (0,0) and goal (width-1, height-1) to the carved paths
    // Carve corners specifically to ensure accessibility
    grid[0][0].isWall = false;
    grid[0][1].isWall = false;
    grid[1][0].isWall = false;
    grid[1][1].isWall = false;

    // Carve end corner
    grid[this.height - 1][this.width - 1].isWall = false;
    grid[this.height - 2][this.width - 1].isWall = false;
    grid[this.height - 1][this.width - 2].isWall = false;
    grid[this.height - 2][this.width - 2].isWall = false;

    return grid;
  }

  private getUnvisitedNeighbors(pos: Position, visited: Set<string>): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -2 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: -2, y: 0 },
    ];

    for (const dir of directions) {
      const nx = pos.x + dir.x;
      const ny = pos.y + dir.y;

      if (
        nx > 0 && nx < this.width - 1 &&
        ny > 0 && ny < this.height - 1 &&
        !visited.has(`${nx},${ny}`)
      ) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }
}
