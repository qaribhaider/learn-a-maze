import { describe, it, expect, beforeEach } from "vitest";
import { QLearningAgent } from "./QLearningAgent";
import { Action, Position, QTable } from "../types";

describe("QLearningAgent", () => {
  let agent: QLearningAgent;
  const testPosition: Position = { x: 5, y: 5 };
  const nextPosition: Position = { x: 6, y: 5 };

  beforeEach(() => {
    agent = new QLearningAgent(0.1, 0.9, 0.1);
  });

  describe("constructor", () => {
    it("should initialize with provided alpha, gamma, and epsilon values", () => {
      expect(agent.alpha).toBe(0.1);
      expect(agent.gamma).toBe(0.9);
      expect(agent.epsilon).toBe(0.1);
    });

    it("should initialize epsilon as initialEpsilon", () => {
      expect(agent.initialEpsilon).toBe(0.1);
    });

    it("should initialize with empty Q-table", () => {
      expect(Object.keys(agent.qTable).length).toBe(0);
    });

    it("should set default minEpsilon", () => {
      expect(agent.minEpsilon).toBe(0.01);
    });

    it("should set default decayRate", () => {
      expect(agent.decayRate).toBe(0.995);
    });

    it("should work with different parameter values", () => {
      const customAgent = new QLearningAgent(0.5, 0.8, 0.9);
      expect(customAgent.alpha).toBe(0.5);
      expect(customAgent.gamma).toBe(0.8);
      expect(customAgent.epsilon).toBe(0.9);
    });
  });

  describe("getQValues", () => {
    it("should return existing Q-values for a visited state", () => {
      const pos: Position = { x: 1, y: 2 };
      agent.qTable["1,2"] = [0.1, 0.2, 0.3, 0.4];

      const qValues = agent.getQValues(pos);
      expect(qValues).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    it("should initialize Q-values to zeros for new state", () => {
      const pos: Position = { x: 3, y: 4 };
      const qValues = agent.getQValues(pos);

      expect(qValues).toEqual([0, 0, 0, 0]);
    });

    it("should store initialized Q-values in qTable", () => {
      const pos: Position = { x: 7, y: 8 };
      agent.getQValues(pos);

      expect(agent.qTable["7,8"]).toEqual([0, 0, 0, 0]);
    });

    it("should return array with 4 elements (one per action)", () => {
      const qValues = agent.getQValues(testPosition);
      expect(qValues).toHaveLength(4);
    });
  });

  describe("getMaxQ", () => {
    it("should return the maximum Q-value for a state", () => {
      agent.qTable["2,3"] = [0.1, 0.5, 0.3, 0.2];
      const maxQ = agent.getMaxQ({ x: 2, y: 3 });

      expect(maxQ).toBe(0.5);
    });

    it("should return 0 for unvisited state", () => {
      const maxQ = agent.getMaxQ({ x: 10, y: 10 });
      expect(maxQ).toBe(0);
    });

    it("should handle negative Q-values", () => {
      agent.qTable["1,1"] = [-0.5, -0.2, -0.8, -0.3];
      const maxQ = agent.getMaxQ({ x: 1, y: 1 });

      expect(maxQ).toBe(-0.2);
    });

    it("should handle all zero Q-values", () => {
      const maxQ = agent.getMaxQ({ x: 5, y: 5 });
      expect(maxQ).toBe(0);
    });
  });

  describe("chooseAction", () => {
    it("should return a valid Action", () => {
      const action = agent.chooseAction(testPosition);
      expect([Action.UP, Action.RIGHT, Action.DOWN, Action.LEFT]).toContain(
        action
      );
    });

    it("should exploit when epsilon is 0", () => {
      agent.epsilon = 0;
      agent.qTable["5,5"] = [0.1, 0.8, 0.3, 0.2];

      // Should consistently choose RIGHT (index 1) with highest Q-value
      const actions = Array.from({ length: 10 }, () =>
        agent.chooseAction(testPosition)
      );
      expect(actions.every((a) => a === Action.RIGHT)).toBe(true);
    });

    it("should choose best action when multiple actions have same max Q-value", () => {
      agent.epsilon = 0;
      agent.qTable["5,5"] = [0.5, 0.5, 0.1, 0.1];

      const action = agent.chooseAction(testPosition);
      // Should be either UP or RIGHT
      expect([Action.UP, Action.RIGHT]).toContain(action);
    });

    it("should explore all actions with epsilon = 1", () => {
      agent.epsilon = 1;
      const actions = new Set<Action>();

      // Run many times to get all possible actions
      for (let i = 0; i < 100; i++) {
        actions.add(agent.chooseAction(testPosition));
      }

      // With high epsilon, we should eventually see multiple different actions
      expect(actions.size).toBeGreaterThan(1);
    });

    it("should work with unvisited states", () => {
      const newPos: Position = { x: 99, y: 99 };
      const action = agent.chooseAction(newPos);

      expect([Action.UP, Action.RIGHT, Action.DOWN, Action.LEFT]).toContain(
        action
      );
    });
  });

  describe("update", () => {
    it("should update Q-value using Bellman equation", () => {
      const state: Position = { x: 1, y: 1 };
      const action = Action.RIGHT;
      const reward = 10;
      const nextState: Position = { x: 2, y: 1 };

      agent.update(state, action, reward, nextState);

      const qValues = agent.getQValues(state);
      // newQ = 0 + 0.1 * (10 + 0.9 * 0 - 0) = 1.0
      expect(qValues[action]).toBeCloseTo(1.0);
    });

    it("should correctly apply learning rate (alpha)", () => {
      const state: Position = { x: 0, y: 0 };
      agent.qTable["0,0"] = [5, 0, 0, 0]; // Pre-existing Q-value

      // Update with reward, alpha=0.1
      agent.update(state, Action.UP, 10, { x: 0, y: 1 });

      // newQ = 5 + 0.1 * (10 + 0.9 * 0 - 5) = 5 + 0.1 * 5 = 5.5
      expect(agent.getQValues(state)[Action.UP]).toBeCloseTo(5.5);
    });

    it("should correctly apply discount factor (gamma)", () => {
      const state: Position = { x: 1, y: 1 };
      const nextState: Position = { x: 1, y: 2 };

      // Set future state Q-value
      agent.qTable["1,2"] = [0, 0, 20, 0];

      agent.update(state, Action.DOWN, 0, nextState);

      // newQ = 0 + 0.1 * (0 + 0.9 * 20 - 0) = 1.8
      expect(agent.getQValues(state)[Action.DOWN]).toBeCloseTo(1.8);
    });

    it("should handle negative rewards", () => {
      const state: Position = { x: 2, y: 2 };
      agent.update(state, Action.LEFT, -1, { x: 1, y: 2 });

      // newQ = 0 + 0.1 * (-1 + 0.9 * 0 - 0) = -0.1
      expect(agent.getQValues(state)[Action.LEFT]).toBeCloseTo(-0.1);
    });

    it("should update only the specified action", () => {
      const state: Position = { x: 3, y: 3 };
      agent.update(state, Action.UP, 5, { x: 3, y: 2 });

      const qValues = agent.getQValues(state);
      expect(qValues[Action.UP]).not.toBe(0);
      expect(qValues[Action.RIGHT]).toBe(0);
      expect(qValues[Action.DOWN]).toBe(0);
      expect(qValues[Action.LEFT]).toBe(0);
    });

    it("should accumulate learning over multiple updates", () => {
      const state: Position = { x: 5, y: 5 };

      agent.update(state, Action.RIGHT, 1, nextPosition);
      const firstUpdate = agent.getQValues(state)[Action.RIGHT];

      agent.update(state, Action.RIGHT, 1, nextPosition);
      const secondUpdate = agent.getQValues(state)[Action.RIGHT];

      expect(secondUpdate).toBeGreaterThan(firstUpdate);
    });
  });

  describe("decayCuriosity", () => {
    it("should decay epsilon by decayRate", () => {
      agent.epsilon = 0.5;
      agent.decayRate = 0.995;

      agent.decayCuriosity();

      expect(agent.epsilon).toBeCloseTo(0.5 * 0.995);
    });

    it("should not decay below minEpsilon", () => {
      agent.epsilon = 0.02;
      agent.minEpsilon = 0.01;
      agent.decayRate = 0.5;

      agent.decayCuriosity();

      expect(agent.epsilon).toBe(0.01);
    });

    it("should converge to minEpsilon after many decays", () => {
      agent.epsilon = 1.0;
      agent.minEpsilon = 0.01;

      for (let i = 0; i < 1000; i++) {
        agent.decayCuriosity();
      }

      expect(agent.epsilon).toBe(agent.minEpsilon);
    });

    it("should maintain minEpsilon when already at minimum", () => {
      agent.epsilon = 0.01;
      agent.minEpsilon = 0.01;

      agent.decayCuriosity();

      expect(agent.epsilon).toBe(0.01);
    });
  });

  describe("resetQTable", () => {
    it("should clear all Q-values", () => {
      agent.qTable = {
        "1,1": [0.1, 0.2, 0.3, 0.4],
        "2,2": [0.5, 0.6, 0.7, 0.8],
        "3,3": [0.9, 1.0, 1.1, 1.2],
      };

      agent.resetQTable();

      expect(Object.keys(agent.qTable).length).toBe(0);
    });

    it("should reset epsilon to initialEpsilon", () => {
      agent.initialEpsilon = 0.8;
      agent.epsilon = 0.05;

      agent.resetQTable();

      expect(agent.epsilon).toBe(0.8);
    });

    it("should not affect learning parameters", () => {
      const alpha = agent.alpha;
      const gamma = agent.gamma;

      agent.resetQTable();

      expect(agent.alpha).toBe(alpha);
      expect(agent.gamma).toBe(gamma);
    });
  });

  describe("setParameters", () => {
    it("should update alpha, gamma, and initialEpsilon", () => {
      agent.setParameters(0.5, 0.7, 0.3);

      expect(agent.alpha).toBe(0.5);
      expect(agent.gamma).toBe(0.7);
      expect(agent.initialEpsilon).toBe(0.3);
    });

    it("should set epsilon to new initialEpsilon", () => {
      agent.setParameters(0.2, 0.8, 0.6);

      expect(agent.epsilon).toBe(0.6);
    });

    it("should not affect existing Q-table", () => {
      agent.qTable["1,1"] = [0.1, 0.2, 0.3, 0.4];

      agent.setParameters(0.3, 0.6, 0.4);

      expect(agent.qTable["1,1"]).toEqual([0.1, 0.2, 0.3, 0.4]);
    });
  });

  describe("setQTable", () => {
    it("should replace Q-table with new values", () => {
      const newQTable: QTable = {
        "1,1": [1, 2, 3, 4],
        "2,2": [5, 6, 7, 8],
      };

      agent.setQTable(newQTable);

      expect(agent.qTable).toEqual(newQTable);
    });

    it("should create a copy of the provided Q-table", () => {
      const newQTable: QTable = {
        "1,1": [1, 2, 3, 4],
      };

      agent.setQTable(newQTable);
      newQTable["2,2"] = [5, 6, 7, 8];

      // Agent's Q-table should not be affected
      expect(agent.qTable["2,2"]).toBeUndefined();
    });

    it("should not affect learning parameters", () => {
      const alpha = agent.alpha;
      const gamma = agent.gamma;
      const epsilon = agent.epsilon;

      agent.setQTable({ "1,1": [0, 0, 0, 0] });

      expect(agent.alpha).toBe(alpha);
      expect(agent.gamma).toBe(gamma);
      expect(agent.epsilon).toBe(epsilon);
    });
  });

  describe("integration scenarios", () => {
    it("should learn optimal path through repeated updates", () => {
      const start: Position = { x: 0, y: 0 };
      const goal: Position = { x: 2, y: 0 };

      // Simulate learning a simple path: start -> middle -> goal
      for (let i = 0; i < 100; i++) {
        agent.update(start, Action.RIGHT, -1, { x: 1, y: 0 });
        agent.update({ x: 1, y: 0 }, Action.RIGHT, 100, goal);
      }

      // Agent should learn that RIGHT from start is valuable
      const startQ = agent.getQValues(start)[Action.RIGHT];
      expect(startQ).toBeGreaterThan(0);

      // Middle position should have even higher Q-value for RIGHT
      const middleQ = agent.getQValues({ x: 1, y: 0 })[Action.RIGHT];
      expect(middleQ).toBeGreaterThan(startQ);
    });

    it("should maintain state after exploration decay", () => {
      agent.epsilon = 0.5;
      agent.qTable["1,1"] = [1, 2, 3, 4];

      for (let i = 0; i < 100; i++) {
        agent.decayCuriosity();
      }

      expect(agent.qTable["1,1"]).toEqual([1, 2, 3, 4]);
    });

    it("should support full training cycle", () => {
      // Initialize
      expect(Object.keys(agent.qTable).length).toBe(0);

      // Train
      agent.update({ x: 0, y: 0 }, Action.RIGHT, 10, { x: 1, y: 0 });
      expect(Object.keys(agent.qTable).length).toBeGreaterThan(0);

      // Decay
      const epsilonBefore = agent.epsilon;
      agent.decayCuriosity();
      expect(agent.epsilon).toBeLessThan(epsilonBefore);

      // Reset
      agent.resetQTable();
      expect(Object.keys(agent.qTable).length).toBe(0);
      expect(agent.epsilon).toBe(agent.initialEpsilon);
    });
  });
});
