"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useDigitalTwinStore } from "@/store/digitalTwinStore";

function Real3DGarment({ isARMode, textureUrl }: { isARMode: boolean, textureUrl?: string }) {
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Load the downloaded GLB model
  const { scene } = useGLTF("/models/tshirt.glb");
  
  // Clone the scene so we can mutate materials safely
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Load the proxy texture
  const texture = useMemo(() => {
    if (!textureUrl) return null;
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(textureUrl)}`;
    const loader = new THREE.TextureLoader();
    try {
      const tex = loader.load(proxyUrl);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      
      // Because we are wrapping a square 2D image onto a complex 3D object, 
      // the UV mapping will be inherently imperfect on this generic model.
      tex.repeat.set(2, 2); 
      return tex;
    } catch (e) {
      console.error("Failed to load garment texture", e);
      return null;
    }
  }, [textureUrl]);

  // Apply the custom texture to the loaded model
  useEffect(() => {
    if (clonedScene && texture) {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.6,
            metalness: 0.1,
          });
        }
      });
    }
  }, [clonedScene, texture]);

  useFrame(() => {
    if (!isARMode || !groupRef.current) return;
    
    const landmarks = useDigitalTwinStore.getState().poseLandmarks;
    if (landmarks && landmarks.length > 24) {
      
      // Calculate Torso Center (average of shoulders and hips)
      const cx = (landmarks[11].x + landmarks[12].x + landmarks[23].x + landmarks[24].x) / 4;
      const cy = (landmarks[11].y + landmarks[12].y + landmarks[23].y + landmarks[24].y) / 4;

      // Map the entire 3D model to the center of the torso
      // The AdrianHajdin shirt needs a slight downward Y offset and specific scaling to match a human torso
      groupRef.current.position.set(
        -(cx - 0.5) * viewport.width, // INVERT X
        -(cy - 0.5) * viewport.height - 0.5, // Offset down slightly
        0
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, isARMode ? 0 : 0.0, isARMode ? 0.1 : 0]}>
      {/* This specific shirt model is quite small, scale it up to fit the mannequin/AR view */}
      <primitive object={clonedScene} scale={isARMode ? 3.5 : 3.0} />
    </group>
  );
}

function MannequinModel({ isARMode }: { isARMode: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  const headRef = useRef<THREE.Mesh>(null);
  const leftShoulderRef = useRef<THREE.Mesh>(null);
  const rightShoulderRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current && !isARMode) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    }
    
    if (isARMode && groupRef.current) {
      const landmarks = useDigitalTwinStore.getState().poseLandmarks;
      groupRef.current.rotation.y = 0;
      
      if (landmarks && landmarks.length > 24) {
        
        // To perfectly align the WebGL meshes with the mirrored webcam video feed:
        // We must INVERT the X-axis calculation. MediaPipe landmarks are 0 (left) to 1 (right)
        // on the original camera frame. But because the user sees a mirrored video feed,
        // we have to mirror the 3D space projection.
        const applyPos = (meshRef: React.RefObject<THREE.Mesh>, landmarkIndex: number) => {
          if (meshRef.current && landmarks[landmarkIndex]) {
            const lm = landmarks[landmarkIndex];
            meshRef.current.position.set(
              -(lm.x - 0.5) * viewport.width, // INVERTED X for mirrored webcam
              -(lm.y - 0.5) * viewport.height, // Y is inverted because 3D Y is up, Video Y is down
              0
            );
          }
        };

        applyPos(headRef, 0);
        applyPos(leftShoulderRef, 11);
        applyPos(rightShoulderRef, 12);
        applyPos(leftArmRef, 13);
        applyPos(rightArmRef, 14);
        
        // Approximate torso center
        if (torsoRef.current && landmarks[11] && landmarks[12] && landmarks[23] && landmarks[24]) {
           const cx = (landmarks[11].x + landmarks[12].x + landmarks[23].x + landmarks[24].x) / 4;
           const cy = (landmarks[11].y + landmarks[12].y + landmarks[23].y + landmarks[24].y) / 4;
           torsoRef.current.position.set(
             -(cx - 0.5) * viewport.width, // INVERTED X
             -(cy - 0.5) * viewport.height,
             0
           );
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, isARMode ? 0 : -1, 0]}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshPhysicalMaterial color="#818cf8" wireframe emissive="#4338ca" emissiveIntensity={1.5} />
      </mesh>

      {/* Torso */}
      {!isARMode && (
        <mesh ref={torsoRef} position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.35, 0.25, 1.0, 32]} />
          <meshPhysicalMaterial color="#818cf8" roughness={0.1} metalness={0.1} clearcoat={1.0} transmission={0.6} thickness={1.2} emissive="#312e81" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Shoulders */}
      <mesh ref={leftShoulderRef} position={[-0.4, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshPhysicalMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={rightShoulderRef} position={[0.4, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshPhysicalMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.5} />
      </mesh>

      {/* Elbows */}
      <mesh ref={leftArmRef} position={[-0.5, 1.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhysicalMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.5, 1.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhysicalMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Hips */}
      {!isARMode && (
        <mesh position={[0, 0.65, 0]}>
          <sphereGeometry args={[0.27, 32, 16]} />
          <meshPhysicalMaterial color="#818cf8" roughness={0.1} metalness={0.1} clearcoat={1.0} transmission={0.6} thickness={1.2}/>
        </mesh>
      )}
    </group>
  );
}

interface DigitalTwinProps {
  isARMode?: boolean;
  garmentImage?: string | null;
}

export default function DigitalTwin3D({ isARMode = false, garmentImage = null }: DigitalTwinProps) {
  return (
    <div className="w-full h-full min-h-[400px] bg-transparent rounded-2xl relative overflow-hidden">
      {!isARMode && (
        <div className="absolute top-4 left-4 z-10 space-y-1 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">DIGITAL TWIN CONNECTED</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">SMPL-X MODEL v2.6.4_MOCK</p>
        </div>
      )}

      <Canvas camera={{ position: [0, isARMode ? 0 : 1.5, 3.5], fov: 60 }} style={{ pointerEvents: isARMode ? 'none' : 'auto' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={2.0} />
        <pointLight position={[-5, 5, -5]} intensity={1.0} color="#f43f5e" />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#6366f1" />

        <MannequinModel isARMode={isARMode} />
        
        {garmentImage && <Real3DGarment isARMode={isARMode} textureUrl={garmentImage} />}

        {!isARMode && (
          <Grid 
            renderOrder={-1} 
            position={[0, -1, 0]} 
            args={[10.5, 10.5]} 
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#334155"
            sectionSize={2.0}
            sectionColor="#4f46e5"
            fadeDistance={30}
          />
        )}

        {!isARMode && (
          <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 + 0.1}
            minDistance={1.5}
            maxDistance={6.0}
          />
        )}
      </Canvas>
    </div>
  );
}

