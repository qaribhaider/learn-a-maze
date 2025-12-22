
import { Action, Position, QTable } from '../types';

export class QLearningAgent {
  public qTable: QTable = {};
  public alpha: number = 0.1;   // Learning rate
  public gamma: number = 0.9;   // Discount factor
  public epsilon: number = 0.1; // Current exploration rate
  public initialEpsilon: number = 0.1;
  public minEpsilon: number = 0.01;
  public decayRate: number = 0.995; // Decay multiplier per episode (0.5% decay)
  
  private actions: Action[] = [Action.UP, Action.RIGHT, Action.DOWN, Action.LEFT];

  constructor(alpha: number, gamma: number, epsilon: number) {
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.initialEpsilon = epsilon;
  }

  private getStateKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  public getQValues(pos: Position): number[] {
    const key = this.getStateKey(pos);
    if (!this.qTable[key]) {
      this.qTable[key] = [0, 0, 0, 0];
    }
    return this.qTable[key];
  }

  public getMaxQ(pos: Position): number {
    return Math.max(...this.getQValues(pos));
  }

  public chooseAction(pos: Position): Action {
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }
    const qValues = this.getQValues(pos);
    const maxQ = Math.max(...qValues);
    const bestActions = this.actions.filter(a => qValues[a] === maxQ);
    return bestActions[Math.floor(Math.random() * bestActions.length)];
  }

  public update(
    state: Position,
    action: Action,
    reward: number,
    nextState: Position
  ): void {
    const currentQValues = this.getQValues(state);
    const oldQ = currentQValues[action];
    const maxNextQ = this.getMaxQ(nextState);

    // Bellman Equation: Q(s,a) = Q(s,a) + alpha * [Reward + gamma * max(Q(s',a')) - Q(s,a)]
    const newQ = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
    
    currentQValues[action] = newQ;
    this.qTable[this.getStateKey(state)] = currentQValues;
  }

  public decayCuriosity(): void {
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.decayRate);
  }

  public resetQTable(): void {
    this.qTable = {};
    this.epsilon = this.initialEpsilon;
  }

  public setParameters(alpha: number, gamma: number, initialEpsilon: number): void {
    this.alpha = alpha;
    this.gamma = gamma;
    this.initialEpsilon = initialEpsilon;
    this.epsilon = initialEpsilon;
  }

  public setQTable(newQTable: QTable): void {
    this.qTable = { ...newQTable };
  }
}
