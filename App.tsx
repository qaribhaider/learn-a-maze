import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Brain,
  Target,
  Activity,
  Download,
  Upload,
  Settings,
  Lock,
  Unlock,
  Info,
  X,
  Trophy,
  AlertTriangle,
  Edit3,
  Home,
} from "lucide-react";
import { MazeGenerator } from "./services/MazeGenerator";
import { QLearningAgent } from "./services/QLearningAgent";
import { MazeScene } from "./components/MazeScene";
import { MazeDesigner } from "./components/MazeDesigner";
import { LandingPage } from "./components/LandingPage";
import { Position, MazeCell, Action, SimulationState, View } from "./types";

const MAZE_SIZE = 15;
const DEFAULT_START: Position = { x: 0, y: 0 };
const DEFAULT_GOAL: Position = { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 };
const MAX_STEPS = 2000;

const DEFAULT_ALPHA = 0.1;
const DEFAULT_GAMMA = 0.9;
const DEFAULT_EPSILON = 0.2;
const DEFAULT_SPEED = 400;

const App: React.FC = () => {
  const agentRef = useRef<QLearningAgent>(
    new QLearningAgent(DEFAULT_ALPHA, DEFAULT_GAMMA, DEFAULT_EPSILON)
  );
  const mazeGen = useRef<MazeGenerator>(
    new MazeGenerator(MAZE_SIZE, MAZE_SIZE)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<View>("landing");
  const [startPos, setStartPos] = useState<Position>(DEFAULT_START);
  const [goalPos, setGoalPos] = useState<Position>(DEFAULT_GOAL);

  const [alpha, setAlpha] = useState(DEFAULT_ALPHA);
  const [gamma, setGamma] = useState(DEFAULT_GAMMA);
  const [initialEpsilon, setInitialEpsilon] = useState(DEFAULT_EPSILON);
  const [showInfo, setShowInfo] = useState(false);

  const [gridState, setGridState] = useState<MazeCell[][]>([]);
  const [agentPosState, setAgentPosState] = useState<Position>(DEFAULT_START);
  const [exploredCellsState, setExploredCellsState] = useState<Set<string>>(
    new Set()
  );
  const [simUIState, setSimUIState] = useState<SimulationState>({
    episode: 1,
    step: 0,
    totalReward: 0,
    epsilon: DEFAULT_EPSILON,
    isGoalReached: false,
    bestStepCount: null,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedValue, setSpeedValue] = useState(DEFAULT_SPEED);
  const [qTableState, setQTableState] = useState<Record<string, number[]>>({});

  const simInternalState = useRef<SimulationState>({
    episode: 1,
    step: 0,
    totalReward: 0,
    epsilon: DEFAULT_EPSILON,
    isGoalReached: false,
    bestStepCount: null,
  });
  const agentPosInternal = useRef<Position>(DEFAULT_START);
  const gridInternal = useRef<MazeCell[][]>([]);
  const exploredCellsInternal = useRef<Set<string>>(new Set());

  const syncToUI = useCallback(() => {
    setSimUIState({ ...simInternalState.current });
    setAgentPosState({ ...agentPosInternal.current });
    setExploredCellsState(new Set(exploredCellsInternal.current));
  }, []);

  const isLocked = simUIState.episode > 1 || simUIState.step > 0;

  useEffect(() => {
    if (!isLocked) {
      agentRef.current.setParameters(alpha, gamma, initialEpsilon);
      simInternalState.current.epsilon = initialEpsilon;
      setSimUIState((prev) => ({ ...prev, epsilon: initialEpsilon }));
    }
  }, [alpha, gamma, initialEpsilon, isLocked]);

  const resetRunner = useCallback(() => {
    // Reset positions
    agentPosInternal.current = { ...startPos };
    setAgentPosState({ ...startPos });

    // Reset exploration
    exploredCellsInternal.current = new Set([`${startPos.x},${startPos.y}`]);
    setExploredCellsState(new Set(exploredCellsInternal.current));

    // Reset Agent Knowledge and Traits
    agentRef.current.resetQTable();
    agentRef.current.setParameters(
      DEFAULT_ALPHA,
      DEFAULT_GAMMA,
      DEFAULT_EPSILON
    );

    // Reset UI inputs
    setAlpha(DEFAULT_ALPHA);
    setGamma(DEFAULT_GAMMA);
    setInitialEpsilon(DEFAULT_EPSILON);
    setSpeedValue(DEFAULT_SPEED);

    const freshState: SimulationState = {
      episode: 1,
      step: 0,
      totalReward: 0,
      epsilon: DEFAULT_EPSILON,
      isGoalReached: false,
      bestStepCount: null,
    };
    simInternalState.current = freshState;
    setSimUIState(freshState);

    setQTableState({});
    setIsPlaying(false);
  }, [startPos]);

  useEffect(() => {
    const staticMaze = mazeGen.current.generate();
    gridInternal.current = staticMaze;
    setGridState(staticMaze);
    resetRunner();
  }, []);

  const runStep = useCallback(() => {
    const s = simInternalState.current;
    const pos = agentPosInternal.current;
    const grid = gridInternal.current;

    if (s.isGoalReached || s.step >= MAX_STEPS) {
      const finalCount = s.step;
      const success = s.isGoalReached;
      agentRef.current.decayCuriosity();
      agentPosInternal.current = { ...startPos };
      s.episode += 1;
      s.step = 0;
      s.totalReward = 0;
      s.epsilon = agentRef.current.epsilon;
      s.isGoalReached = false;
      if (success) {
        s.bestStepCount =
          s.bestStepCount === null
            ? finalCount
            : Math.min(s.bestStepCount, finalCount);
      }
      exploredCellsInternal.current = new Set([`${startPos.x},${startPos.y}`]);
      return;
    }

    const action = agentRef.current.chooseAction(pos);
    let nextX = pos.x;
    let nextY = pos.y;
    if (action === Action.UP) nextY -= 1;
    else if (action === Action.RIGHT) nextX += 1;
    else if (action === Action.DOWN) nextY += 1;
    else if (action === Action.LEFT) nextX -= 1;

    let reward = -1;
    let finalNextPos = { x: nextX, y: nextY };
    let reached = false;

    const outOfBounds =
      nextX < 0 || nextX >= MAZE_SIZE || nextY < 0 || nextY >= MAZE_SIZE;
    const hitWall = outOfBounds || grid[nextY][nextX].isWall;

    if (hitWall) {
      reward = -100;
      finalNextPos = { ...pos };
    } else if (nextX === goalPos.x && nextY === goalPos.y) {
      reward = 1000;
      reached = true;
    }

    agentRef.current.update(pos, action, reward, finalNextPos);

    agentPosInternal.current = finalNextPos;
    s.step += 1;
    s.totalReward += reward;
    s.isGoalReached = reached;
    exploredCellsInternal.current.add(`${finalNextPos.x},${finalNextPos.y}`);
  }, [startPos, goalPos]);

  useEffect(() => {
    if (!isPlaying) return;
    let interval: number;
    if (speedValue < 500) {
      const delay = Math.max(1, 500 - speedValue);
      interval = window.setInterval(() => {
        runStep();
        syncToUI();
        if (simInternalState.current.step % 10 === 0) {
          setQTableState({ ...agentRef.current.qTable });
        }
      }, delay);
    } else {
      interval = window.setInterval(() => {
        for (let i = 0; i < 30; i++) {
          runStep();
          if (
            simInternalState.current.isGoalReached ||
            simInternalState.current.step === 0
          )
            break;
        }
        syncToUI();
        setQTableState({ ...agentRef.current.qTable });
      }, 16);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speedValue, runStep, syncToUI]);

  const saveRunner = () => {
    const data = {
      grid: gridState,
      startPos,
      goalPos,
      qTable: agentRef.current.qTable,
      simState: {
        ...simInternalState.current,
        initialEpsilon: agentRef.current.initialEpsilon,
        alpha: agentRef.current.alpha,
        gamma: agentRef.current.gamma,
      },
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `runner_ep${simInternalState.current.episode}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.qTable) {
          if (data.grid) {
            gridInternal.current = data.grid;
            setGridState(data.grid);
          }
          if (data.startPos) setStartPos(data.startPos);
          if (data.goalPos) setGoalPos(data.goalPos);

          agentRef.current.setQTable(data.qTable);
          const s = data.simState;
          setAlpha(s.alpha ?? DEFAULT_ALPHA);
          setGamma(s.gamma ?? DEFAULT_GAMMA);
          setInitialEpsilon(s.initialEpsilon ?? DEFAULT_EPSILON);
          agentRef.current.alpha = s.alpha ?? DEFAULT_ALPHA;
          agentRef.current.gamma = s.gamma ?? DEFAULT_GAMMA;
          agentRef.current.initialEpsilon = s.initialEpsilon ?? DEFAULT_EPSILON;
          agentRef.current.epsilon =
            s.epsilon ?? s.initialEpsilon ?? DEFAULT_EPSILON;

          setQTableState(data.qTable);

          const activeStart = data.startPos || DEFAULT_START;
          agentPosInternal.current = { ...activeStart };
          exploredCellsInternal.current = new Set([
            `${activeStart.x},${activeStart.y}`,
          ]);

          simInternalState.current = {
            episode: s.episode || 1,
            step: 0,
            totalReward: 0,
            epsilon: agentRef.current.epsilon,
            isGoalReached: false,
            bestStepCount: s.bestStepCount ?? null,
          };
          syncToUI();
          setIsPlaying(false);
          setView("simulator");
        }
      } catch (err) {
        alert("Failed to load runner data.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  if (view === "landing") {
    return <LandingPage onNavigate={setView} />;
  }

  if (view === "designer") {
    return (
      <MazeDesigner
        initialGrid={gridState}
        initialStartPos={startPos}
        initialGoalPos={goalPos}
        onSave={(newGrid, newStart, newGoal) => {
          gridInternal.current = newGrid;
          setGridState(newGrid);
          setStartPos(newStart);
          setGoalPos(newGoal);
          resetRunner();
          setView("simulator");
        }}
        onCancel={() => setView("simulator")}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-950 text-gray-100 font-mono">
      <div className="w-full md:w-80 p-6 bg-gray-900 border-r border-gray-800 flex flex-col gap-6 shadow-2xl z-10 overflow-y-auto custom-scrollbar relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight uppercase">
              Learn A Maze
            </h1>
          </div>
          <button
            onClick={() => setView("landing")}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-all"
            title="Home"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-400 uppercase font-bold">
              <span>Runner Stats</span>
              <Activity className="w-3 h-3" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900 p-2 rounded text-center">
                <p className="text-[9px] text-gray-500 uppercase">Episode</p>
                <p className="text-lg font-bold text-cyan-400">
                  {simUIState.episode}
                </p>
              </div>
              <div
                className={`bg-gray-900 p-2 rounded text-center border-b-2 transition-colors ${
                  simUIState.step > MAX_STEPS * 0.8
                    ? "border-red-500"
                    : "border-green-500/30"
                }`}
              >
                <p className="text-[9px] text-gray-500 uppercase">Step</p>
                <p
                  className={`text-lg font-bold ${
                    simUIState.step > MAX_STEPS * 0.8
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {simUIState.step}
                </p>
              </div>
            </div>
            <div className="bg-gray-900 p-2 rounded flex justify-between items-center px-4 border border-yellow-500/20">
              <div className="flex flex-col">
                <p className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5 text-yellow-500" /> Best Path
                </p>
                <p className="text-sm font-bold text-yellow-400">
                  {simUIState.bestStepCount
                    ? `${simUIState.bestStepCount} Steps`
                    : "---"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-500 uppercase">Curiosity</p>
                <p className="text-sm font-bold text-orange-400">
                  {(simUIState.epsilon * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setIsPlaying(false);
                setView("designer");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-cyan-400 rounded-lg font-bold transition-all uppercase text-xs tracking-widest"
            >
              <Edit3 className="w-4 h-4" /> Edit Maze Layout
            </button>
          </div>

          <div
            className={`p-4 rounded-lg border transition-all relative ${
              isLocked
                ? "bg-gray-900/50 border-gray-800 opacity-80"
                : "bg-gray-800 border-cyan-900/50 shadow-inner shadow-cyan-950"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 uppercase font-bold">
                <Settings className="w-3 h-3" />
                <span>Base Traits</span>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-1 hover:text-cyan-400 focus:outline-none"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              {isLocked ? (
                <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold bg-red-950/30 px-2 py-0.5 rounded border border-red-900/50">
                  <Lock className="w-2.5 h-2.5" /> LOCKED
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold bg-green-950/30 px-2 py-0.5 rounded border border-green-900/50">
                  <Unlock className="w-2.5 h-2.5" /> OPEN
                </div>
              )}
            </div>
            {showInfo && (
              <div className="absolute inset-0 bg-gray-900 z-20 p-4 rounded-lg flex flex-col gap-3 overflow-y-auto border border-cyan-500/50 text-[10px] shadow-xl">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="font-bold text-cyan-400 uppercase">
                    Parameter Guide
                  </span>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p>
                  <b className="text-white">α (Learning Rate):</b> How much
                  experience overwrites knowledge.
                </p>
                <p>
                  <b className="text-white">γ (Memory):</b> Importance of future
                  rewards.
                </p>
                <p>
                  <b className="text-white">ε (Curiosity):</b> Chance of random
                  exploration moves.
                </p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">α</span>
                  <span className="text-cyan-400">{alpha.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  disabled={isLocked}
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-cyan-900 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">γ</span>
                  <span className="text-cyan-400">{gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  disabled={isLocked}
                  value={gamma}
                  onChange={(e) => setGamma(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-cyan-900 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">ε</span>
                  <span className="text-cyan-400">
                    {initialEpsilon.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  disabled={isLocked}
                  value={initialEpsilon}
                  onChange={(e) =>
                    setInitialEpsilon(parseFloat(e.target.value))
                  }
                  className="w-full h-1.5 bg-cyan-900 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs text-gray-400 uppercase font-bold flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Zap className="w-3 h-3" /> Speed
              </span>
              <span className="text-[10px] text-cyan-300">
                {speedValue >= 500
                  ? "WARP"
                  : `${Math.max(1, 500 - speedValue)}ms`}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="500"
              value={speedValue}
              onChange={(e) => setSpeedValue(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                isPlaying
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : "bg-cyan-600 text-white hover:bg-cyan-500"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isPlaying ? "PAUSE" : "RUN"}
            </button>
            <button
              onClick={resetRunner}
              className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors text-gray-400"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs text-gray-400 uppercase font-bold px-1 border-b border-gray-800 pb-2 flex items-center gap-2">
            <Target className="w-3 h-3" /> Setup
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={saveRunner}
              className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded bg-gray-800 border border-gray-700 text-cyan-300"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded bg-gray-800 border border-gray-700 text-green-300"
            >
              <Upload className="w-3 h-3" /> Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleLoadFile}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        <MazeScene
          grid={gridState}
          agentPos={agentPosState}
          goalPos={goalPos}
          qTable={qTableState}
          exploredCells={exploredCellsState}
        />
        {simUIState.step >= MAX_STEPS * 0.9 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-950/80 border border-red-500 rounded flex items-center gap-3 text-red-400 text-xs animate-pulse">
            <AlertTriangle className="w-4 h-4" /> Runner is lost! Resetting...
          </div>
        )}

        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur rounded text-[9px] border border-white/10 uppercase font-bold">
            <div className="w-2 h-2 bg-[#00f6ff] rounded-full" /> Runner (Start:{" "}
            {startPos.x},{startPos.y})
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur rounded text-[9px] border border-white/10 uppercase font-bold">
            <div className="w-2 h-2 bg-[#ffde00] rounded-full" /> Goal (
            {goalPos.x},{goalPos.y})
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
