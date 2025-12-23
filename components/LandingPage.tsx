import React, { useEffect, useState, useRef } from "react";
import {
  Brain,
  Zap,
  Target,
  Edit3,
  ChevronRight,
  Play,
  Cpu,
  Layers,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { MazeScene } from "./MazeScene";
import { MazeGenerator } from "../services/MazeGenerator";
import { QLearningAgent } from "../services/QLearningAgent";
import { MazeCell, Position, Action, View } from "../types";

interface LandingPageProps {
  onNavigate: (view: View) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // Mini simulation for the Hero animation
  const [heroGrid, setHeroGrid] = useState<MazeCell[][]>([]);
  const [heroPos, setHeroPos] = useState<Position>({ x: 0, y: 0 });
  const [heroQ, setHeroQ] = useState<Record<string, number[]>>({});
  const agentRef = useRef(new QLearningAgent(0.1, 0.9, 0.1));

  useEffect(() => {
    const gen = new MazeGenerator(15, 15);
    const grid = gen.generate();
    setHeroGrid(grid);

    let currentPos = { x: 0, y: 0 };
    const interval = setInterval(() => {
      const action = agentRef.current.chooseAction(currentPos);
      let nextX = currentPos.x;
      let nextY = currentPos.y;
      if (action === Action.UP) nextY -= 1;
      else if (action === Action.RIGHT) nextX += 1;
      else if (action === Action.DOWN) nextY += 1;
      else if (action === Action.LEFT) nextX -= 1;

      const out = nextX < 0 || nextX >= 15 || nextY < 0 || nextY >= 15;
      if (out || grid[nextY][nextX].isWall) {
        agentRef.current.update(currentPos, action, -100, currentPos);
      } else {
        const reached = nextX === 14 && nextY === 14;
        agentRef.current.update(currentPos, action, reached ? 1000 : -1, {
          x: nextX,
          y: nextY,
        });
        currentPos = reached ? { x: 0, y: 0 } : { x: nextX, y: nextY };
        if (reached) agentRef.current.decayCuriosity();
      }
      setHeroPos({ ...currentPos });
      if (Math.random() > 0.8) setHeroQ({ ...agentRef.current.qTable });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#060609] text-white overflow-x-hidden selection:bg-cyan-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-gradient-to-b from-[#060609] to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Brain className="w-6 h-6 text-cyan-400" />
          </div>
          <span className="text-xl font-black uppercase tracking-tighter">
            Learn a Maze
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate("simulator")}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20"
          >
            Launch App
          </button>
          <a
            href="https://github.com/qaribhaider/learn-a-maze"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gray-600 hover:bg-cyan-500 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col lg:flex-row items-center justify-center px-8 lg:px-24 pt-20 overflow-hidden">
        <div className="flex-1 z-10 space-y-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
            <Zap className="w-3 h-3" /> Reinforcement Learning Visualization
          </div>
          <h1 className="text-6xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter">
            Where{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              AI
            </span>{" "}
            learns to <br />
            <span className="italic">navigate.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
            Watch an agent evolve from random exploration to perfect efficiency.
            An interactive educational sandbox built on Q-Learning and the
            Bellman Equation.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => onNavigate("simulator")}
              className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95"
            >
              Start Learning <Play className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => onNavigate("designer")}
              className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white border border-gray-800 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Build Maze <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full h-[500px] lg:h-full relative opacity-50 lg:opacity-100">
          <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-l from-[#060609] via-transparent to-transparent hidden lg:block" />
          <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-t from-[#060609] via-transparent to-transparent" />
          <div className="w-full h-full scale-125 lg:scale-100">
            <MazeScene
              grid={heroGrid}
              agentPos={heroPos}
              goalPos={{ x: 14, y: 14 }}
              qTable={heroQ}
              exploredCells={new Set()}
            />
          </div>
        </div>
      </section>

      {/* Logic & Algorithm Section */}
      <section className="py-32 px-8 lg:px-24 bg-[#08080c] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">
                  The Science of <br />
                  Rewards
                </h2>
                <div className="w-20 h-1.5 bg-cyan-500 rounded-full" />
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                The agent operates on <b>Temporal Difference Learning</b>. It
                has no map. It only knows its current state (X, Y) and what it
                can do (Up, Down, Left, Right). Through thousands of trials, it
                builds a <b>Q-Table</b>—a matrix of confidence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-cyan-500/30 transition-all group">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="font-bold text-white uppercase tracking-wider mb-2">
                    Policy Optimization
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Balanced ε-greedy strategy ensuring the agent explores new
                    paths while exploiting known rewards.
                  </p>
                </div>
                <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-yellow-500/30 transition-all group">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h4 className="font-bold text-white uppercase tracking-wider mb-2">
                    Bellman Equation
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Calculating the expected future discounted reward to find
                    the optimal path to the goal.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-8 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Cpu className="w-40 h-40 text-cyan-400" />
              </div>
              <code className="text-xs sm:text-sm text-cyan-300 font-mono space-y-2 block">
                <p className="text-gray-600">// The Core Bellman Update</p>
                <p>Q[s][a] = Q[s][a] + α * (</p>
                <p className="pl-6">reward + γ * max(Q[s'][a']) - Q[s][a]</p>
                <p>);</p>
                <div className="pt-6 text-gray-400">
                  <p className="text-white font-bold mb-2">Key Variables:</p>
                  <p>
                    • <span className="text-white">α (Alpha):</span> Learning
                    Rate
                  </p>
                  <p>
                    • <span className="text-white">γ (Gamma):</span> Discount
                    Factor
                  </p>
                  <p>
                    • <span className="text-white">ε (Epsilon):</span>{" "}
                    Exploration vs Exploitation
                  </p>
                </div>
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="py-32 px-8 lg:px-24">
        <div className="max-w-7xl mx-auto text-center mb-20 space-y-4">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter">
            Choose Your Mode
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Whether you want to witness AI solve a procedurally generated puzzle
            or craft your own impossible labyrinth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Path 1: Simulator */}
          <div
            onClick={() => onNavigate("simulator")}
            className="group relative h-[450px] p-10 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all hover:-translate-y-2 shadow-xl"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 group-hover:opacity-20 transition-opacity bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">
                  AI Simulator
                </h3>
                <p className="text-gray-400">
                  Launch the default environment. Adjust learning speed, tweak
                  parameters in real-time, and watch the Q-Table evolve.
                </p>
              </div>
              <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-cyan-400 group-hover:gap-4 transition-all">
                Enter Simulation <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
          </div>

          {/* Path 2: Designer */}
          <div
            onClick={() => onNavigate("designer")}
            className="group relative h-[450px] p-10 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 overflow-hidden cursor-pointer hover:border-yellow-500/50 transition-all hover:-translate-y-2 shadow-xl"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 group-hover:opacity-20 transition-opacity bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                  <Edit3 className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">
                  Maze Architect
                </h3>
                <p className="text-gray-400">
                  Paint custom walls, set difficult start/end points, and
                  challenge the AI with your own logic. Test the limits of
                  reinforcement learning.
                </p>
              </div>
              <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-yellow-400 group-hover:gap-4 transition-all">
                Design Maze <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-gray-900 text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 grayscale opacity-50">
            <Brain className="w-6 h-6 text-cyan-400" />
            <span className="text-lg font-black uppercase tracking-tighter">
              Learn a Maze
            </span>
          </div>
          <p className="text-gray-600 text-sm max-w-md">
            An educational project exploring the intersections of Game Design
            and Reinforcement Learning. Built for curious minds.
          </p>
        </div>
        <div className="text-[10px] text-gray-700 uppercase tracking-widest">
          © {new Date().getFullYear()} LEARN A MAZE • MACBOOK M1 OPTIMIZED
        </div>
      </footer>
    </div>
  );
};
