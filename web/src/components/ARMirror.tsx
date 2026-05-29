"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Video, Loader2 } from "lucide-react";
import { useDigitalTwinStore } from "@/store/digitalTwinStore";

export default function ARMirror() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const setPoseLandmarks = useDigitalTwinStore((state) => state.setPoseLandmarks);

  useEffect(() => {
    let camera: Camera | null = null;
    let pose: Pose | null = null;
    let isMounted = true;

    if (isActive && videoRef.current && canvasRef.current) {
      setIsInitializing(true);
      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: Results) => {
        if (!isMounted) return;
        setIsInitializing(false);
        if (!canvasCtx || !canvasElement || !videoElement) return;
        
        // Pass normalized 2D screen landmarks for accurate WebGL overlay mapping
        if (results.poseLandmarks) {
           setPoseLandmarks(results.poseLandmarks);
        } else {
           setPoseLandmarks(null);
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // Draw video frame
        canvasCtx.globalCompositeOperation = "source-over";
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);


        // Draw Pose Landmarks
        if (results.poseLandmarks) {
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: "#6366f1",
            lineWidth: 4,
          });
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: "#f43f5e",
            lineWidth: 2,
            radius: 4,
          });
        }
        canvasCtx.restore();
      });

      camera = new Camera(videoElement, {
        onFrame: async () => {
          // Strict check to prevent passing to a closed Wasm object
          if (isMounted && videoElement && pose) {
            try {
              await pose.send({ image: videoElement });
            } catch (e) {
              console.error("Pose send error ignored during unmount:", e);
            }
          }
        },
        width: 1280,
        height: 720,
      });

      camera.start();
    }

    return () => {
      isMounted = false;
      if (camera) {
        camera.stop();
      }
      if (pose) {
        pose.close();
      }
    };
  }, [isActive]);

  if (!isActive) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center space-y-4">
        <Video className="h-16 w-16 text-slate-800" />
        <h3 className="font-semibold text-lg text-slate-300">Real-Time AR Telepresence</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Activate your webcam to overlay 3D garments onto your movements in real-time using MediaPipe skeletal tracking.
        </p>
        <button 
          onClick={() => setIsActive(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all uppercase tracking-widest"
        >
          Activate AR Mirror
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black rounded-2xl overflow-hidden flex items-center justify-center">
      {/* Hidden raw video element */}
      <video ref={videoRef} className="hidden" playsInline></video>
      
      {/* The output AR canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover"
        width={1280} 
        height={720}
      ></canvas>

      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm space-y-3 z-10">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Loading MediaPipe Models...</span>
        </div>
      )}

      {/* Close button overlay */}
      <button 
        onClick={() => setIsActive(false)}
        className="absolute top-4 right-4 bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg z-20 uppercase tracking-widest backdrop-blur-sm"
      >
        Stop Camera
      </button>

      {/* Status Overlay */}
      <div className="absolute bottom-4 left-4 z-20 space-y-1 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isInitializing ? 'bg-yellow-500' : 'bg-green-500 animate-ping'}`}></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
            {isInitializing ? "INITIALIZING" : "AR TRACKING ACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
