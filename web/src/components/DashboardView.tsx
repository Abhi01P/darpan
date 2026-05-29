"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDigitalTwinStore } from "@/store/digitalTwinStore";
import { Sparkles, Send, Ruler, Eye, Upload } from "lucide-react";
import { api } from "@/services/api";

interface DashboardViewProps {
  initialGarmentImage?: string | null;
}

export default function DashboardView({ initialGarmentImage = null }: DashboardViewProps) {
  const { 
    progress, 
    extractedTitle,
    recommendedGarmentId,
    recommendedGarmentImageUrl,
    chatHistory,
    isLoading, 
    startTryOnWorkflow,
    swipeGarment,
    cleanup,
  } = useDigitalTwinStore();

  const [userQuery, setUserQuery] = useState("");
  const [personImage, setPersonImage] = useState("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop");
  const [garmentImage, setGarmentImage] = useState(initialGarmentImage || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Clean up polling intervals when unmounting
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Update garment image if selected from wardrobe
  useEffect(() => {
    if (initialGarmentImage) {
      setGarmentImage(initialGarmentImage);
    }
  }, [initialGarmentImage]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personImage) return;

    const currentQuery = userQuery;
    setUserQuery("");

    await startTryOnWorkflow({
      user_image_url: personImage,
      garment_image_url: garmentImage || undefined,
      user_query: currentQuery || undefined
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setPersonImage(res.data.url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Make sure it's a valid image file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSwipeDislike = () => {
    if (!recommendedGarmentId) return;
    swipeGarment(recommendedGarmentId, "dislike");
    const syntheticQuery = "I don't like that one, show me something else.";
    
    startTryOnWorkflow({
      user_image_url: personImage,
      user_query: syntheticQuery,
    });
  };

  const handleSwipeLike = () => {
    if (!recommendedGarmentId) return;
    swipeGarment(recommendedGarmentId, "like");
    useDigitalTwinStore.setState({ recommendedGarmentId: null });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: 2D Try-On Viewer (Takes 7 Cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex">
          <div className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white shadow-md">
            <Eye className="h-4 w-4" />
            <span>2D Photorealistic Try-On Mirror</span>
          </div>
        </div>

        <div className="flex-1 aspect-square md:aspect-auto md:h-[500px] rounded-2xl relative border border-slate-800 overflow-hidden bg-slate-950">
            <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center space-y-4 relative">
              {progress.tryonStatus === "PROCESSING" ? (
                <div className="flex flex-col items-center space-y-4">
                  <span className="border-4 border-indigo-500/20 border-t-indigo-500 rounded-full w-12 h-12 animate-spin"></span>
                  <div className="font-mono text-xs text-indigo-400 animate-pulse uppercase tracking-wider">
                    Orchestrating AI Pipeline... Generating Composite
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs">
                    The backend is running the diffusion model tasks (simulated queue takes ~8s).
                  </p>
                </div>
              ) : progress.tryonStatus === "SUCCESS" && progress.tryonResult ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-950 relative">
                  <img
                    src={progress.tryonResult.result_image_url}
                    alt="Try-on Result"
                    className="w-full h-full object-contain rounded-2xl"
                  />
                  <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-widest text-indigo-400 shadow-xl">
                    ✓ SYNTHESIS SUCCESSFUL
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-sm space-y-4">
                  <Eye className="h-16 w-16 text-slate-800" />
                  <h3 className="font-semibold text-lg text-slate-300">Awaiting Try-On Trigger</h3>
                  <p className="text-xs text-slate-500">
                    Upload your photo on the right, select a garment from your wardrobe, and initiate the workflow to see the results.
                  </p>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Stylist & Control Center (Takes 5 Cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-6">
        
        {/* Step 1: User Photo Selection */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-md">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Ruler className="h-4 w-4 text-indigo-500" />
            <span>Digital Twin Base</span>
          </h3>
          <div className="flex items-center space-x-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="relative">
              <img 
                src={personImage} 
                alt="My Avatar Base" 
                className="w-12 h-12 rounded-lg object-cover border border-slate-800"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold">User Photo</div>
              <p className="text-[10px] text-slate-500">Used as the base for AI generation</p>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-400 border border-indigo-900 font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Upload className="h-3 w-3" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Step 2: Custom Stylist Prompter & Chat */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex-1 flex flex-col shadow-md max-h-[600px]">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-400 flex items-center space-x-2 mb-4 shrink-0">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>AI Stylist Chat</span>
          </h3>

          {/* Chat Window */}
          <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-y-auto space-y-4 mb-4 flex flex-col">
            {chatHistory.length === 0 ? (
              <p className="text-slate-500 italic text-xs text-center my-auto">
                Start a conversation! Describe an occasion (e.g. &quot;outfit for summer brunch&quot;).
              </p>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {/* Tinder Card for Recommendation */}
            {recommendedGarmentId && (
              <div className="mt-4 bg-slate-900 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/10 mx-auto w-full max-w-[280px]">
                <div className="aspect-square bg-slate-950 relative">
                  <img 
                    src={recommendedGarmentImageUrl || progress.tryonResult?.garment_image || "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=600&auto=format&fit=crop"} 
                    alt="Recommendation" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent p-4 pt-12">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{extractedTitle || "Recommended Item"}</h4>
                  </div>
                </div>
                <div className="flex border-t border-slate-800 divide-x divide-slate-800">
                  <button 
                    onClick={handleSwipeDislike}
                    className="flex-1 py-3 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-colors font-bold text-xl"
                  >
                    ✕
                  </button>
                  <button 
                    onClick={handleSwipeLike}
                    className="flex-1 py-3 hover:bg-green-950/30 text-slate-400 hover:text-green-400 transition-colors font-bold text-xl"
                  >
                    ♥
                  </button>
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-2 border border-slate-700 flex space-x-1">
                   <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                   <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                 </div>
              </div>
            )}
            <div className="text-[9px] font-mono text-slate-600 text-right">
              Task Status: {progress.tryonStatus}
            </div>
            {/* Invisible anchor to auto-scroll to */}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleStartWorkflow} className="space-y-3 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Chat with your stylist..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-4 pr-12 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !personImage || !userQuery}
                className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-500 p-2 rounded-lg text-white transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
