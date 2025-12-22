
export type Position = {
  x: number;
  y: number;
};

export enum Action {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3
}

export type MazeCell = {
  x: number;
  y: number;
  isWall: boolean;
};

export type QTable = Record<string, number[]>;

export interface SimulationState {
  episode: number;
  step: number;
  totalReward: number;
  epsilon: number;
  isGoalReached: boolean;
  bestStepCount: number | null;
  startPos?: Position;
  goalPos?: Position;
}

export type View = 'landing' | 'simulator' | 'designer';
