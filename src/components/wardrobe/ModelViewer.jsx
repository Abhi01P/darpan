"use client";

import { useEffect, useState } from "react";

export default function ModelViewerComponent({ modelUrl, onClose }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only import model-viewer on the client side to avoid SSR errors
    import("@google/model-viewer").then(() => {
      setIsMounted(true);
    });
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <div 
        className="dw-panel-overlay" 
        onClick={onClose} 
        style={{ zIndex: 2000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }} 
      />
      
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2001,
          width: "90%",
          maxWidth: "800px",
          height: "80vh",
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "fade-in .3s ease-out",
        }}
      >
        <button 
          onClick={onClose} 
          style={{ 
            alignSelf: "flex-end", 
            background: "var(--pink-nav)", 
            color: "#fff", 
            border: "none", 
            borderRadius: "50%", 
            width: 40, 
            height: 40, 
            fontSize: 20,
            cursor: "pointer",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(232, 64, 112, 0.4)"
          }}
        >
          ×
        </button>

        <div style={{ flex: 1, width: "100%", borderRadius: 24, overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
          {/* @ts-ignore */}
          <model-viewer
            src={modelUrl}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            environment-image="neutral"
            style={{ width: "100%", height: "100%", outline: "none" }}
          >
            <div slot="poster" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>
              Loading 3D Model...
            </div>
            
            <button 
              slot="ar-button" 
              style={{
                background: "linear-gradient(135deg, #e8a0b0 0%, #c86080 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                position: "absolute",
                bottom: "32px",
                left: "50%",
                transform: "translateX(-50%)",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(232, 64, 112, 0.35)",
              }}
            >
              Start AR Try-On
            </button>
          </model-viewer>
        </div>
      </div>
    </>
  );
}
