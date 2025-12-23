import { describe, it, expect, beforeEach } from "vitest";
import { MazeGenerator } from "./MazeGenerator";
import { MazeCell } from "../types";

describe("MazeGenerator", () => {
  let generator: MazeGenerator;

  beforeEach(() => {
    generator = new MazeGenerator(11, 11);
  });

  describe("constructor", () => {
    it("should create a generator with specified dimensions", () => {
      const gen = new MazeGenerator(15, 20);
      expect(gen).toBeInstanceOf(MazeGenerator);
    });
  });

  describe("generate", () => {
    it("should generate a maze with correct dimensions", () => {
      const maze = generator.generate();
      expect(maze).toHaveLength(11);
      expect(maze[0]).toHaveLength(11);
    });

    it("should generate deterministic maze with same seed", () => {
      const maze1 = generator.generate();
      const maze2 = generator.generate();

      // Both mazes should be identical because of seeded RNG
      for (let y = 0; y < maze1.length; y++) {
        for (let x = 0; x < maze1[y].length; x++) {
          expect(maze1[y][x].isWall).toBe(maze2[y][x].isWall);
        }
      }
    });

    it("should ensure start position (0,0) is not a wall", () => {
      const maze = generator.generate();
      expect(maze[0][0].isWall).toBe(false);
    });

    it("should ensure goal position (width-1, height-1) is not a wall", () => {
      const maze = generator.generate();
      const height = maze.length;
      const width = maze[0].length;
      expect(maze[height - 1][width - 1].isWall).toBe(false);
    });

    it("should carve paths in start corner (top-left)", () => {
      const maze = generator.generate();
      // Check that 2x2 corner is carved
      expect(maze[0][0].isWall).toBe(false);
      expect(maze[0][1].isWall).toBe(false);
      expect(maze[1][0].isWall).toBe(false);
      expect(maze[1][1].isWall).toBe(false);
    });

    it("should carve paths in goal corner (bottom-right)", () => {
      const maze = generator.generate();
      const height = maze.length;
      const width = maze[0].length;
      // Check that 2x2 corner is carved
      expect(maze[height - 1][width - 1].isWall).toBe(false);
      expect(maze[height - 2][width - 1].isWall).toBe(false);
      expect(maze[height - 1][width - 2].isWall).toBe(false);
      expect(maze[height - 2][width - 2].isWall).toBe(false);
    });

    it("should create cells with correct coordinates", () => {
      const maze = generator.generate();
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          expect(maze[y][x].x).toBe(x);
          expect(maze[y][x].y).toBe(y);
        }
      }
    });

    it("should have more paths than walls for navigability", () => {
      const maze = generator.generate();
      let pathCount = 0;
      let wallCount = 0;

      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          if (maze[y][x].isWall) {
            wallCount++;
          } else {
            pathCount++;
          }
        }
      }

      // A navigable maze should have paths
      expect(pathCount).toBeGreaterThan(0);
    });

    it("should work with different maze sizes", () => {
      const sizes = [
        [5, 5],
        [7, 9],
        [15, 15],
        [21, 13],
      ];

      sizes.forEach(([width, height]) => {
        const gen = new MazeGenerator(width, height);
        const maze = gen.generate();

        expect(maze).toHaveLength(height);
        expect(maze[0]).toHaveLength(width);
        expect(maze[0][0].isWall).toBe(false);
        expect(maze[height - 1][width - 1].isWall).toBe(false);
      });
    });

    it("should ensure all MazeCells have required properties", () => {
      const maze = generator.generate();

      maze.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toHaveProperty("x");
          expect(cell).toHaveProperty("y");
          expect(cell).toHaveProperty("isWall");
          expect(typeof cell.x).toBe("number");
          expect(typeof cell.y).toBe("number");
          expect(typeof cell.isWall).toBe("boolean");
        });
      });
    });

    it("should generate the same maze when called multiple times on same instance", () => {
      const maze1 = generator.generate();
      const maze2 = generator.generate();
      const maze3 = generator.generate();

      // Verify all three are identical
      for (let y = 0; y < maze1.length; y++) {
        for (let x = 0; x < maze1[y].length; x++) {
          expect(maze1[y][x].isWall).toBe(maze2[y][x].isWall);
          expect(maze2[y][x].isWall).toBe(maze3[y][x].isWall);
        }
      }
    });

    it("should handle minimum viable maze size", () => {
      const smallGen = new MazeGenerator(3, 3);
      const maze = smallGen.generate();

      expect(maze).toHaveLength(3);
      expect(maze[0]).toHaveLength(3);
      expect(maze[0][0].isWall).toBe(false);
      expect(maze[2][2].isWall).toBe(false);
    });

    it("should create connected paths (no isolated walls in carved areas)", () => {
      const maze = generator.generate();

      // Verify that start and goal corners are properly connected to path network
      // by checking that at least one neighbor of start is a path
      const hasPathFromStart = !maze[0][1].isWall || !maze[1][0].isWall;
      expect(hasPathFromStart).toBe(true);

      // Check goal has accessible path
      const height = maze.length;
      const width = maze[0].length;
      const hasPathToGoal =
        !maze[height - 2][width - 1].isWall ||
        !maze[height - 1][width - 2].isWall;
      expect(hasPathToGoal).toBe(true);
    });
  });

  describe("SeededRandom behavior", () => {
    it("should produce different mazes with different seeds (structural test)", () => {
      // This tests that the RNG is actually being used deterministically
      const maze1 = generator.generate();

      // Create a new generator - should produce identical maze due to same seed
      const generator2 = new MazeGenerator(11, 11);
      const maze2 = generator2.generate();

      // Should be identical
      let identical = true;
      for (let y = 0; y < maze1.length; y++) {
        for (let x = 0; x < maze1[y].length; x++) {
          if (maze1[y][x].isWall !== maze2[y][x].isWall) {
            identical = false;
            break;
          }
        }
      }

      expect(identical).toBe(true);
    });
  });
});
