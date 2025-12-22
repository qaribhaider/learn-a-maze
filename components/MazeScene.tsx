
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MazeCell, Position, QTable } from '../types';

// Register OrbitControls for use in JSX
extend({ OrbitControls });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface MazeSceneProps {
  grid: MazeCell[][];
  agentPos: Position;
  goalPos: Position;
  qTable: QTable;
  exploredCells: Set<string>;
}

const WALL_COLOR = '#666666';
const FLOOR_BASE_COLOR = '#1e1e1e';
const AGENT_COLOR = '#00f6ff';
const GOAL_COLOR = '#ffde00';
const EXPLORED_INDICATOR_COLOR = '#ffffff';

// Center the 15x15 maze (indices 0-14) at world (0,0,0)
const MAZE_SIZE = 15;
const OFFSET = (MAZE_SIZE - 1) / 2; // = 7

const ExploredIndicator: React.FC<{ x: number, y: number }> = ({ x, y }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={meshRef} position={[x - OFFSET, 0.12, y - OFFSET]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.35, 16]} />
      <meshBasicMaterial color={EXPLORED_INDICATOR_COLOR} transparent opacity={0.6} />
    </mesh>
  );
};

const Cell: React.FC<{ 
  cell: MazeCell; 
  maxQValue: number; 
  globalMaxQ: number;
  isExplored: boolean;
}> = ({ cell, maxQValue, globalMaxQ, isExplored }) => {
  const color = useMemo(() => {
    if (cell.isWall) return WALL_COLOR;
    if (globalMaxQ <= 0) return FLOOR_BASE_COLOR;
    
    const intensity = Math.min(1, Math.max(0, maxQValue / globalMaxQ));
    const c = new THREE.Color(FLOOR_BASE_COLOR);
    const heat = new THREE.Color('#00ff44');
    return c.lerp(heat, intensity);
  }, [cell.isWall, maxQValue, globalMaxQ]);

  return (
    <group>
      <mesh position={[cell.x - OFFSET, cell.isWall ? 0.5 : 0, cell.y - OFFSET]} receiveShadow castShadow={cell.isWall}>
        {cell.isWall ? (
          <boxGeometry args={[0.95, 1, 0.95]} />
        ) : (
          <boxGeometry args={[1, 0.1, 1]} />
        )}
        <meshStandardMaterial 
          color={color} 
          roughness={0.4} 
          metalness={0.2} 
          emissive={isExplored && !cell.isWall ? color : '#000000'}
          emissiveIntensity={isExplored ? 0.4 : 0}
        />
      </mesh>
      {isExplored && !cell.isWall && (
        <ExploredIndicator x={cell.x} y={cell.y} />
      )}
    </group>
  );
};

const SceneControls = () => {
  const { camera, gl: { domElement } } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  return (
    <orbitControls 
      args={[camera, domElement]} 
      enablePan={true} 
      enableRotate={true} 
      enableZoom={true} 
      target={target}
      makeDefault
    />
  );
};

export const MazeScene: React.FC<MazeSceneProps> = ({ grid, agentPos, goalPos, qTable, exploredCells }) => {
  const globalMaxQ = useMemo(() => {
    let max = 0.0001;
    const values = Object.values(qTable) as number[][];
    values.forEach(qs => {
      if (Array.isArray(qs)) {
        qs.forEach(q => { if (q > max) max = q; });
      }
    });
    return max;
  }, [qTable]);

  return (
    <Canvas 
      shadows 
      dpr={[1, 2]}
      camera={{
        position: [80, 80, 80], 
        zoom: 10,               
        near: 0.1,
        far: 10000,
        type: 'OrthographicCamera'
      }}
      style={{ background: '#060609' }}
    >
      <SceneControls />

      {/* Balanced global lighting: In-between versions */}
      <hemisphereLight intensity={1.8} color="#ffffff" groundColor="#111122" />
      <ambientLight intensity={0.8} />
      
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={3.0} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Subtle secondary fill light */}
      <directionalLight 
        position={[-50, 40, -50]} 
        intensity={0.4} 
        color="#aaccff"
      />
      
      <group>
        {/* Maze Grid */}
        {grid.map((row, y) => 
          row.map((cell, x) => {
            const key = `${x},${y}`;
            const qValues = qTable[key] || [0, 0, 0, 0];
            const maxQValue = Math.max(...qValues);
            const isExplored = exploredCells.has(key);
            return (
              <Cell 
                key={key} 
                cell={cell} 
                maxQValue={maxQValue} 
                globalMaxQ={globalMaxQ} 
                isExplored={isExplored}
              />
            );
          })
        )}

        {/* Agent Character */}
        <mesh position={[agentPos.x - OFFSET, 0.6, agentPos.y - OFFSET]} castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial 
            color={AGENT_COLOR} 
            emissive={AGENT_COLOR} 
            emissiveIntensity={2} 
            roughness={0}
            metalness={0.8}
          />
        </mesh>

        {/* Goal Indicator */}
        <mesh position={[goalPos.x - OFFSET, 0.5, goalPos.y - OFFSET]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.15, 32]} />
          <meshStandardMaterial 
            color={GOAL_COLOR} 
            emissive={GOAL_COLOR} 
            emissiveIntensity={3.0} 
          />
        </mesh>
        
        {/* Dynamic Lights for Runner and Goal */}
        <pointLight position={[agentPos.x - OFFSET, 2, agentPos.y - OFFSET]} color={AGENT_COLOR} intensity={15} distance={10} />
        <pointLight position={[goalPos.x - OFFSET, 2, goalPos.y - OFFSET]} color={GOAL_COLOR} intensity={20} distance={12} />
      </group>

      {/* Balanced Extended Floor Design */}
      <group position={[0, -0.15, 0]}>
        {/* Base Floor Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#0b0b0f" roughness={0.75} metalness={0.1} />
        </mesh>
        
        {/* Decorative huge grid lines */}
        <gridHelper args={[500, 25, '#20202a', '#101018']} position={[0, 0.01, 0]} />
        
        {/* Finer grid lines near the maze */}
        <gridHelper args={[100, 20, '#2a2a3d', '#14141d']} position={[0, 0.02, 0]} />
        
        {/* Tight grid that fits exactly under the maze cells */}
        <gridHelper args={[15, 15, '#444466', '#222233']} position={[0, 0.03, 0]} />
        
        {/* Glowing border ring around the maze area */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11, 11.2, 64]} />
          <meshBasicMaterial color="#00f6ff" transparent opacity={0.2} />
        </mesh>

        {/* Secondary subtle outer ring */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[25, 25.3, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
        </mesh>
      </group>
    </Canvas>
  );
};
