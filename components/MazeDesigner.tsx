
import React, { useState, useCallback, useMemo } from 'react';
import { MazeCell, Position } from '../types';
import { MousePointer2, Flag, Target, Eraser, CheckCircle2, Info, Trash2, XCircle, AlertTriangle } from 'lucide-react';

interface MazeDesignerProps {
  initialGrid: MazeCell[][];
  initialStartPos: Position;
  initialGoalPos: Position;
  onSave: (grid: MazeCell[][], start: Position, goal: Position) => void;
  onCancel: () => void;
}

type Tool = 'wall' | 'start' | 'goal' | 'eraser';
type PendingAction = 'clear' | 'cancel' | null;

export const MazeDesigner: React.FC<MazeDesignerProps> = ({
  initialGrid,
  initialStartPos,
  initialGoalPos,
  onSave,
  onCancel
}) => {
  const [grid, setGrid] = useState<MazeCell[][]>(() => 
    initialGrid.map(row => row.map(cell => ({ ...cell })))
  );
  const [startPos, setStartPos] = useState<Position>({ ...initialStartPos });
  const [goalPos, setGoalPos] = useState<Position>({ ...initialGoalPos });
  
  const [activeTool, setActiveTool] = useState<Tool>('wall');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Optimized change tracking
  const hasChanges = useMemo(() => {
    // Check if grid structure differs
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].isWall !== initialGrid[y][x].isWall) return true;
      }
    }
    // Check start/goal positions
    if (startPos.x !== initialStartPos.x || startPos.y !== initialStartPos.y) return true;
    if (goalPos.x !== initialGoalPos.x || goalPos.y !== initialGoalPos.y) return true;
    
    return false;
  }, [grid, startPos, goalPos, initialGrid, initialStartPos, initialGoalPos]);

  const handleCellAction = useCallback((x: number, y: number) => {
    if (activeTool === 'start') {
      setStartPos({ x, y });
      setGrid(currentGrid => 
        currentGrid.map((row, ry) => 
          row.map((cell, cx) => 
            (cx === x && ry === y) ? { ...cell, isWall: false } : cell
          )
        )
      );
    } else if (activeTool === 'goal') {
      setGoalPos({ x, y });
      setGrid(currentGrid => 
        currentGrid.map((row, ry) => 
          row.map((cell, cx) => 
            (cx === x && ry === y) ? { ...cell, isWall: false } : cell
          )
        )
      );
    } else {
      setGrid(currentGrid => {
        const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
        if (activeTool === 'wall') {
          if ((x === startPos.x && y === startPos.y) || (x === goalPos.x && y === goalPos.y)) {
            return currentGrid;
          }
          newGrid[y][x].isWall = true;
        } else if (activeTool === 'eraser') {
          newGrid[y][x].isWall = false;
        }
        return newGrid;
      });
    }
  }, [activeTool, startPos, goalPos]);

  const confirmAction = () => {
    if (pendingAction === 'clear') {
      setGrid(currentGrid => 
        currentGrid.map(row => 
          row.map(cell => ({ ...cell, isWall: false }))
        )
      );
    } else if (pendingAction === 'cancel') {
      onCancel();
    }
    setPendingAction(null);
  };

  const handleClearRequest = () => {
    setPendingAction('clear');
  };
  
  const handleCancelRequest = () => {
    if (hasChanges) {
      setPendingAction('cancel');
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-950 p-8 overflow-auto relative">
      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-6">
            <div className={`p-4 rounded-full ${pendingAction === 'clear' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
              <AlertTriangle className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                {pendingAction === 'clear' ? 'Confirm Reset' : 'Discard Changes?'}
              </h3>
              <p className="text-gray-400 text-sm">
                {pendingAction === 'clear' 
                  ? "Are you sure you want to clear all walls? This action cannot be undone." 
                  : "You have unsaved edits to your maze. Exit anyway and discard all changes?"}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={() => setPendingAction(null)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={confirmAction}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-white ${pendingAction === 'clear' ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20' : 'bg-yellow-600 hover:bg-yellow-500 shadow-lg shadow-yellow-900/20'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-tighter">Maze Architect</h2>
            <p className="text-gray-400 text-xs mt-1 uppercase">Draw your environment. Define the challenge.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleCancelRequest}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition-all uppercase text-sm tracking-widest border border-gray-700"
            >
              <XCircle className="w-5 h-5" /> Cancel
            </button>
            <button 
              type="button"
              onClick={() => onSave(grid, startPos, goalPos)}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-cyan-900/20 uppercase text-sm tracking-widest"
            >
              <CheckCircle2 className="w-5 h-5" /> Done & Simulate
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex lg:flex-col gap-2 p-4 bg-gray-900 border border-gray-800 rounded-xl shadow-lg h-fit">
            <ToolButton 
              active={activeTool === 'wall'} 
              onClick={() => setActiveTool('wall')} 
              icon={<MousePointer2 className="w-5 h-5" />} 
              label="Wall" 
              color="bg-gray-600"
            />
            <ToolButton 
              active={activeTool === 'eraser'} 
              onClick={() => setActiveTool('eraser')} 
              icon={<Eraser className="w-5 h-5" />} 
              label="Eraser" 
              color="bg-gray-400"
            />
            <div className="hidden lg:block h-px bg-gray-800 my-2" />
            <ToolButton 
              active={activeTool === 'start'} 
              onClick={() => setActiveTool('start')} 
              icon={<Flag className="w-5 h-5" />} 
              label="Start" 
              color="bg-cyan-500"
            />
            <ToolButton 
              active={activeTool === 'goal'} 
              onClick={() => setActiveTool('goal')} 
              icon={<Target className="w-5 h-5" />} 
              label="Goal" 
              color="bg-yellow-500"
            />
            <div className="hidden lg:block h-px bg-gray-800 my-2" />
            <button 
              type="button"
              onClick={handleClearRequest}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all border-2 bg-red-950/20 text-red-400 border-red-900/50 hover:bg-red-900/40 w-full"
            >
              <Trash2 className="w-5 h-5" />
              <span className="uppercase tracking-widest text-[10px]">Clear All</span>
            </button>
          </div>

          <div 
            className="flex-1 bg-gray-900 p-4 border border-gray-800 rounded-xl shadow-2xl overflow-hidden select-none"
            onMouseLeave={() => setIsMouseDown(false)}
          >
            <div 
              className="grid gap-px bg-gray-800 border border-gray-800"
              style={{ 
                gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
                aspectRatio: '1/1'
              }}
            >
              {grid.map((row, y) => row.map((cell, x) => {
                const isStart = x === startPos.x && y === startPos.y;
                const isGoal = x === goalPos.x && y === goalPos.y;
                
                return (
                  <div 
                    key={`${x}-${y}`}
                    className={`relative cursor-crosshair transition-colors duration-75 ${
                      cell.isWall ? 'bg-gray-600' : 'bg-gray-900'
                    } hover:brightness-125`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsMouseDown(true);
                      handleCellAction(x, y);
                    }}
                    onMouseEnter={() => {
                      if (isMouseDown && (activeTool === 'wall' || activeTool === 'eraser')) {
                        handleCellAction(x, y);
                      }
                    }}
                    onMouseUp={() => setIsMouseDown(false)}
                  >
                    {isStart && (
                      <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/30">
                        <Flag className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                      </div>
                    )}
                    {isGoal && (
                      <div className="absolute inset-0 flex items-center justify-center bg-yellow-500/30">
                        <Target className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 border-[0.5px] border-white/5 pointer-events-none" />
                  </div>
                );
              }))}
            </div>
          </div>

          <div className="lg:w-64 flex flex-col gap-4 text-xs">
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-3 shadow-lg">
              <h4 className="font-bold text-gray-400 uppercase flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> Instructions
              </h4>
              <ul className="space-y-2 text-gray-500 leading-relaxed">
                <li>• Use <span className="text-gray-300 font-bold">Wall tool</span> to click and drag to draw boundaries.</li>
                <li>• Set the <span className="text-cyan-400 font-bold">Start</span> where the Runner begins its journey.</li>
                <li>• Place the <span className="text-yellow-400 font-bold">Goal</span> to define the reward.</li>
                <li>• <span className="text-red-400 font-bold">Clear All</span> removes all current wall cells.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  color: string;
}> = ({ active, onClick, icon, label, color }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all border-2 ${
      active 
        ? `${color} text-white border-white/20 shadow-lg w-full` 
        : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-800 hover:text-gray-300 w-full'
    }`}
  >
    {icon}
    <span className="uppercase tracking-widest text-[10px]">{label}</span>
  </button>
);