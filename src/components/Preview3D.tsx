import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, PerspectiveCamera, Environment, ContactShadows, Center } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';
import { Download, Box } from 'lucide-react';
import { PreviewObject } from '../types';

interface PreviewProps {
  objects: PreviewObject[];
  title?: string;
  scadCode?: string;
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

export const Preview3D: React.FC<PreviewProps> = ({ objects, title = 'model', scadCode }) => {
  const modelGroupRef = useRef<THREE.Group>(null);
  const [isConverting, setIsConverting] = React.useState(false);

  const exportSTL = () => {
    if (!modelGroupRef.current) return;

    const exporter = new STLExporter();
    const result = exporter.parse(modelGroupRef.current, { binary: true });
    
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_preview.stl`;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const exportFullSCAD = async () => {
    if (!scadCode) return;
    setIsConverting(true);
    try {
      const response = await fetch('/api/convert-to-stl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scadCode, title }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_full.stl`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        alert(data.message || data.error || "Failed to convert SCAD to STL");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to conversion service");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700 relative group/view">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-mono">
          Initializing 3D Space...
        </div>
      }>
        <Canvas shadows camera={{ position: [30, -30, 30], fov: 45, up: [0, 0, 1] }}>
          <color attach="background" args={['#0f172a']} />
          <Stage environment="city" intensity={0.5} shadows={{ type: 'contact', opacity: 0.4, blur: 2 }} adjustCamera={false}>
             <Center>
                <group ref={modelGroupRef} rotation={[0, 0, 0]}>
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

      {objects.length > 0 && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={exportFullSCAD}
            disabled={isConverting}
            className="bg-indigo-600/90 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all border border-indigo-400/30 backdrop-blur-sm opacity-0 group-hover/view:opacity-100 shadow-xl disabled:opacity-50"
            title="Convert full SCAD script to STL (Server-side)"
          >
            {isConverting ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Box size={14} />
            )}
            Export Full STL
          </button>
          <button
            onClick={exportSTL}
            className="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all border border-slate-700 hover:border-slate-600 backdrop-blur-sm opacity-0 group-hover/view:opacity-100 shadow-xl"
            title="Export current preview as STL (Quick)"
          >
            <Download size={14} /> Preview STL
          </button>
        </div>
      )}
      
      {objects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm italic">
          No preview geometry available
        </div>
      )}
    </div>
  );
};
