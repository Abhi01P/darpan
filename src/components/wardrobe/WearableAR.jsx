"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

// The 3D Garment Component
function Garment({ modelUrl, poseData }) {
  const { scene } = useGLTF(modelUrl);
  const meshRef = useRef();
  const { viewport } = useThree();

  useFrame(() => {
    if (!poseData || !meshRef.current || poseData.length === 0) return;

    const keypoints = poseData[0].keypoints;
    const leftShoulder = keypoints.find((k) => k.name === "left_shoulder");
    const rightShoulder = keypoints.find((k) => k.name === "right_shoulder");

    if (leftShoulder && rightShoulder && leftShoulder.score > 0.4 && rightShoulder.score > 0.4) {
      // Calculate midpoint in pixel coordinates
      const midX = (leftShoulder.x + rightShoulder.x) / 2;
      const midY = (leftShoulder.y + rightShoulder.y) / 2;

      // Calculate distance between shoulders in pixels for scaling
      const shoulderDist = Math.abs(leftShoulder.x - rightShoulder.x);

      // Convert pixel coordinates (0 to 640) to Three.js viewport coordinates
      // Video is 640x480. We need to map [0, 640] -> [-viewport.width/2, viewport.width/2]
      const x = (midX / 640) * viewport.width - viewport.width / 2;
      
      // Y is inverted in Three.js compared to DOM
      const y = -(midY / 480) * viewport.height + viewport.height / 2;

      // Base scale adjustment (will need tweaking depending on the specific GLB model's base size)
      // Usually, shoulder distance of 150px might mean a scale of 1.
      const scaleFactor = (shoulderDist / 150) * 1.5;

      // Lerp for smooth movement instead of snapping instantly
      meshRef.current.position.lerp(new THREE.Vector3(x, y - (viewport.height * 0.1), 0), 0.2); // Offset Y slightly so it sits on shoulders
      
      // Target scale
      const targetScale = new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor);
      meshRef.current.scale.lerp(targetScale, 0.2);
    }
  });

  return <primitive object={scene} ref={meshRef} />;
}


export default function WearableAR({ modelUrl, onClose }) {
  const webcamRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [poseData, setPoseData] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const requestRef = useRef();

  useEffect(() => {
    async function initTF() {
      await tf.ready();
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
      const createdDetector = await poseDetection.createDetector(model, detectorConfig);
      setDetector(createdDetector);
    }
    initTF();
  }, []);

  const detectPose = async () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4 &&
      detector
    ) {
      const video = webcamRef.current.video;
      const poses = await detector.estimatePoses(video);
      setPoseData(poses);
      if (!isReady) setIsReady(true);
    }
    requestRef.current = requestAnimationFrame(detectPose);
  };

  useEffect(() => {
    if (detector) {
      requestRef.current = requestAnimationFrame(detectPose);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [detector]);

  return (
    <>
      <div 
        className="dw-panel-overlay" 
        style={{ zIndex: 3000, background: "#000" }} 
      />
      
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 3001,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          background: "#000"
        }}
      >
        <div style={{ position: "absolute", top: 32, left: 32, zIndex: 3002 }}>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>Real-Time AR VTO</div>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Powered by TensorFlow & React Three Fiber</div>
        </div>

        <button 
          onClick={onClose} 
          style={{ 
            position: "absolute",
            top: 32,
            right: 32,
            background: "rgba(255,255,255,0.1)", 
            color: "#fff", 
            border: "none", 
            borderRadius: "50%", 
            width: 48, 
            height: 48, 
            fontSize: 24,
            cursor: "pointer",
            zIndex: 3002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}
        >
          ×
        </button>

        {!isReady && (
          <div style={{ position: "absolute", color: "#fff", zIndex: 3003, fontSize: 18, background: "rgba(0,0,0,0.5)", padding: "12px 24px", borderRadius: 30 }}>
            Initializing AI Models & Camera...
          </div>
        )}

        <div style={{ position: "relative", width: 640, height: 480, borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 64px rgba(232, 64, 112, 0.2)" }}>
          <Webcam
            ref={webcamRef}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 1,
              width: 640,
              height: 480,
              objectFit: "cover",
              transform: "scaleX(-1)" // Mirror webcam
            }}
          />

          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2 }}>
            <Canvas orthographic camera={{ position: [0, 0, 100], zoom: 1 }}>
              <ambientLight intensity={1} />
              <directionalLight position={[10, 10, 5]} intensity={1.5} />
              <Environment preset="city" />
              {/* Only render garment if we have model and pose */}
              {modelUrl && poseData && <Garment modelUrl={modelUrl} poseData={poseData} />}
            </Canvas>
          </div>
        </div>
        
        <div style={{ marginTop: 32, color: "var(--muted)", maxWidth: 400, textAlign: "center", fontSize: 12, lineHeight: 1.5 }}>
          Stand back so your shoulders are visible. The machine learning model will track your body and anchor the 3D model in real-time. Note: Camera feed is mirrored.
        </div>
      </div>
    </>
  );
}
