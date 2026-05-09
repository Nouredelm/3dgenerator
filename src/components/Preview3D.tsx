import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, PerspectiveCamera, Environment, ContactShadows, Center } from '@react-three/drei';
import { PreviewObject } from '../types';

interface PreviewProps {
  objects: PreviewObject[];
}

const ModelObject: React.FC<{ object: PreviewObject }> = ({ object }) => {
  const { type, args, position, rotation, color = '#6366f1' } = object;

  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      {type === 'box' && <boxGeometry args={args as [number, number, number]} />}
      {type === 'cylinder' && <cylinderGeometry args={[args[0], args[1], args[2], 32]} />}
      {type === 'sphere' && <sphereGeometry args={[args[0], 32, 32]} />}
      {type === 'torus' && <torusGeometry args={[args[0], args[1], 16, 100]} />}
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
    </mesh>
  );
};

export const Preview3D: React.FC<PreviewProps> = ({ objects }) => {
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700 relative">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-mono">
          Initializing 3D Space...
        </div>
      }>
        <Canvas shadows camera={{ position: [30, -30, 30], fov: 45, up: [0, 0, 1] }}>
          <color attach="background" args={['#0f172a']} />
          <Stage environment="city" intensity={0.5} shadows={{ type: 'contact', opacity: 0.4, blur: 2 }} adjustCamera={false}>
             <Center>
                <group rotation={[0, 0, 0]}>
                  {objects.map((obj, i) => (
                    <ModelObject key={i} object={obj} />
                  ))}
                </group>
             </Center>
          </Stage>
          <OrbitControls makeDefault />
          <Grid 
            infiniteGrid 
            fadeDistance={100} 
            sectionSize={10} 
            cellSize={5} 
            sectionThickness={1} 
            cellThickness={0.5} 
            cellColor="#334155" 
            sectionColor="#475569"
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, -0.01]}
          />
        </Canvas>
      </Suspense>
      
      {objects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm italic">
          No preview geometry available
        </div>
      )}
    </div>
  );
};
