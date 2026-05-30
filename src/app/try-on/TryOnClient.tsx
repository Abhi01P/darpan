"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const WearableAR = dynamic(() => import("@/components/wardrobe/WearableAR"), { ssr: false });

export default function TryOnClient() {
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<"url" | "upload">("url");
  const [mode, setMode] = useState("2D");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAROpen, setIsAROpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImageFile(e.target.files[0]);
  };

  const handleUserPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setUserImageFile(e.target.files[0]);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleTryOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputType === "url" && !url) return alert("Please provide a product link.");
    if (inputType === "upload" && !imageFile) return alert("Please upload a garment image.");
    if (!userImageFile) return alert("Please upload your photo for try-on.");

    setIsProcessing(true);
    setErrorMsg(null);
    setResultImage(null);

    if (mode === "AR") {
      setIsProcessing(false);
      setIsAROpen(true);
      return;
    }

    try {
      let garmentImageUrl: string;

      if (inputType === "url") {
        setProcessingStage("Extracting product data...");
        const scrapeRes = await fetch("/api/scrape-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const scrapeData = await scrapeRes.json();
        if (scrapeData.error) throw new Error(scrapeData.error);
        garmentImageUrl = scrapeData.imageUrl;
      } else {
        garmentImageUrl = await fileToBase64(imageFile!);
      }

      setProcessingStage("Preparing your photo...");
      const userImageUrl = await fileToBase64(userImageFile);

      setProcessingStage("AI is generating your virtual try-on...");
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImageUrl, garmentImageUrl }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResultImage(data.resultUrl);
      setProcessingStage("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Try-on failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ background: "var(--bg, #b8a8b0)", minHeight: "100vh", fontFamily: "'Jost', sans-serif", display: "flex", flexDirection: "column", position: "relative", overflow: isMenuOpen ? "hidden" : "auto" }}>

      {/* HEADER */}
      <div style={{ background: "var(--nav-bg, #2a1f28)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/wardrobe" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, letterSpacing: 4, color: "var(--text-inv, #e8dce0)", textTransform: "uppercase", textDecoration: "none" }}>
          Darpan
        </Link>
        <button onClick={() => setIsMenuOpen(true)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ width: 24, height: 1.5, background: "var(--text-inv)", transition: "all .3s" }}></div>
          <div style={{ width: 24, height: 1.5, background: "var(--text-inv)", transition: "all .3s" }}></div>
          <div style={{ width: 16, height: 1.5, background: "var(--text-inv)", transition: "all .3s", alignSelf: "flex-end" }}></div>
        </button>
      </div>

      {/* FULL SCREEN MENU */}
      <div style={{ position: "fixed", inset: 0, background: "var(--sidebar-bg, #1e1620)", zIndex: 200, display: "flex", flexDirection: "column", opacity: isMenuOpen ? 1 : 0, pointerEvents: isMenuOpen ? "auto" : "none", transition: "opacity .4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div style={{ padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, letterSpacing: 4, color: "var(--text-inv, #e8dce0)", textTransform: "uppercase" }}>Darpan</div>
          <button onClick={() => setIsMenuOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-inv)", fontSize: 32, fontWeight: 300 }}>×</button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 32 }}>
          {[
            { name: "My Wardrobe", href: "/wardrobe" },
            { name: "Try On", href: "/try-on" },
            { name: "AI Stylist", href: "/ai-chat" },
            { name: "My Model", href: "/profile/my-model" },
          ].map((item, i) => (
            <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--text-inv)", textDecoration: "none", fontStyle: item.name === "Try On" ? "italic" : "normal", opacity: item.name === "Try On" ? 1 : 0.6, transition: "opacity .2s", transform: isMenuOpen ? "translateY(0)" : "translateY(20px)", transitionDelay: (i * 0.05) + "s" }}>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
        {/* LEFT: Result or Aesthetic */}
        <div style={{ flex: "1 1 400px", position: "relative", minHeight: "30vh", overflow: "hidden" }}>
          {resultImage ? (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1018", padding: 20 }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 500, aspectRatio: "3/4" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultImage} alt="Virtual try-on result" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }} />
                <div style={{ position: "absolute", top: 12, left: 12, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--pink-nav)", background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: 4, backdropFilter: "blur(8px)" }}>
                  ✨ Virtual Mirror
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, background: "url('https://images.unsplash.com/photo-1618932260643-ee4625b59a6e?auto=format&fit=crop&q=80&w=1000') center/cover" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.8))" }}></div>
              </div>
              <div style={{ position: "absolute", bottom: 60, left: 60, color: "#fff", maxWidth: 400 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "var(--pink-nav)", marginBottom: 16 }}>Powered by Gemini AI</div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, lineHeight: 1.1, marginBottom: 16, fontStyle: "italic", fontWeight: 300 }}>Virtual<br />Try-On.</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontWeight: 300 }}>Upload your photo and a garment image. Our AI will generate a photorealistic try-on while preserving your identity.</p>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Form */}
        <div style={{ flex: "1 1 400px", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>

            {errorMsg && (
              <div style={{ background: "rgba(232, 64, 112, 0.1)", borderLeft: "3px solid #e84070", padding: "12px 16px", marginBottom: 24, fontSize: 12, color: "#e84070", lineHeight: 1.5 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTryOn} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {/* YOUR PHOTO */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--pink-nav)", marginBottom: 12 }}>Step 1: Your Photo</div>
                <div style={{ border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 8, padding: 24, textAlign: "center", background: userImageFile ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.4)", position: "relative", transition: "all .2s" }}>
                  <input type="file" accept="image/*" onChange={handleUserPhotoChange} disabled={isProcessing}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                  <div style={{ pointerEvents: "none", color: "var(--text)" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{userImageFile ? "✅" : "🤳"}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{userImageFile ? userImageFile.name : "Upload your photo"}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Full body photo works best</div>
                  </div>
                </div>
              </div>

              {/* GARMENT */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--pink-nav)", marginBottom: 12 }}>Step 2: Provide Garment</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <button type="button" onClick={() => setInputType("url")} style={{ background: "none", border: "none", fontSize: 13, fontWeight: inputType === "url" ? 600 : 400, color: inputType === "url" ? "var(--text)" : "var(--muted)", cursor: "pointer", padding: "0 0 4px 0", borderBottom: "2px solid " + (inputType === "url" ? "var(--text)" : "transparent") }}>
                    Paste Link
                  </button>
                  <button type="button" onClick={() => setInputType("upload")} style={{ background: "none", border: "none", fontSize: 13, fontWeight: inputType === "upload" ? 600 : 400, color: inputType === "upload" ? "var(--text)" : "var(--muted)", cursor: "pointer", padding: "0 0 4px 0", borderBottom: "2px solid " + (inputType === "upload" ? "var(--text)" : "transparent") }}>
                    Upload Photo
                  </button>
                </div>
                {inputType === "url" ? (
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://zara.com/product/..." disabled={isProcessing}
                    style={{ width: "100%", padding: "16px 20px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)", color: "var(--text)", fontSize: 13, borderRadius: 8, outline: "none" }} />
                ) : (
                  <div style={{ border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 8, padding: 24, textAlign: "center", background: "rgba(255,255,255,0.4)", position: "relative" }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} disabled={isProcessing}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                    <div style={{ pointerEvents: "none", color: "var(--text)" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{imageFile ? "✅" : "👕"}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{imageFile ? imageFile.name : "Upload garment image"}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* MODE */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--pink-nav)", marginBottom: 16 }}>Step 3: Try-On Mode</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {["2D", "3D", "AR"].map(m => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      style={{ flex: 1, padding: "16px 0", cursor: "pointer", fontSize: 12, fontWeight: 600, letterSpacing: 1,
                        background: mode === m ? "var(--text)" : "rgba(255,255,255,0.4)",
                        color: mode === m ? "var(--text-inv)" : "var(--muted)",
                        border: "1px solid " + (mode === m ? "transparent" : "rgba(0,0,0,0.05)"), borderRadius: 8, transition: "all .2s",
                        boxShadow: mode === m ? "0 4px 12px rgba(0,0,0,0.15)" : "none" }}>
                      {m}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, lineHeight: 1.5 }}>
                  {mode === "2D" && "AI-powered photorealistic try-on generated by Gemini."}
                  {mode === "3D" && "Interactive 360° model (coming soon)."}
                  {mode === "AR" && "Live webcam overlay (no photo required)."}
                </div>
              </div>

              {/* SUBMIT */}
              <button type="submit" disabled={isProcessing}
                style={{ padding: 20, background: "var(--text)", color: "var(--text-inv)", border: "none", borderRadius: 8,
                  fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
                  opacity: isProcessing ? 0.7 : 1, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", marginTop: 8 }}>
                {isProcessing ? processingStage || "Processing..." : "Generate Try-On"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {isAROpen && (
        <WearableAR modelUrl="https://modelviewer.dev/shared-assets/models/Astronaut.glb" onClose={() => setIsAROpen(false)} />
      )}
    </div>
  );
}
