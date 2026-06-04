"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // In a real application, you would fetch these from your database
  // For now, we'll use local state to mock the presence of 2D/3D replicas
  const [has2DImage, setHas2DImage] = useState(false);
  const [has3DReplica, setHas3DReplica] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
          Your Profile
        </h1>
        <p className="text-white/60 text-lg">
          Manage your account details and digital replicas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md">
            <h2 className="text-2xl font-semibold text-white mb-6">Account</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Name
                </label>
                <div className="text-lg text-white font-medium">
                  {user.user_metadata?.full_name || user.user_metadata?.name || "User"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Email
                </label>
                <div className="text-lg text-white font-medium">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20 disabled:opacity-50"
              >
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>

        {/* Digital Replicas */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Digital Replicas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2D Image Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-medium text-white">2D Avatar</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${has2DImage ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60'}`}>
                  {has2DImage ? 'Ready' : 'Not Setup'}
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] mb-8 bg-black/40 rounded-xl border border-white/5 overflow-hidden relative">
                {has2DImage ? (
                  <div className="text-blue-400 text-6xl">👤</div> // Placeholder for actual image
                ) : (
                  <div className="text-center p-6">
                    <div className="text-white/20 text-6xl mb-4">🖼️</div>
                    <p className="text-white/60 text-sm">Upload a photo to create your 2D avatar for basic try-ons.</p>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                {has2DImage ? (
                  <button
                    onClick={() => setHas2DImage(false)}
                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
                  >
                    Modify 2D Avatar
                  </button>
                ) : (
                  <button
                    onClick={() => setHas2DImage(true)}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                  >
                    Build 2D Avatar
                  </button>
                )}
              </div>
            </div>

            {/* 3D Replica Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-medium text-white">3D Replica</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${has3DReplica ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60'}`}>
                  {has3DReplica ? 'Ready' : 'Not Setup'}
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] mb-8 bg-black/40 rounded-xl border border-white/5 overflow-hidden relative">
                {has3DReplica ? (
                  <div className="text-blue-400 text-6xl">🧍</div> // Placeholder for 3D model viewer
                ) : (
                  <div className="text-center p-6">
                    <div className="text-white/20 text-6xl mb-4">🧊</div>
                    <p className="text-white/60 text-sm">Generate a highly accurate 3D model for premium virtual try-ons.</p>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                {has3DReplica ? (
                  <button
                    onClick={() => setHas3DReplica(false)}
                    className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors border border-white/20"
                  >
                    Modify 3D Replica
                  </button>
                ) : (
                  <Link
                    href="/profile/my-model"
                    className="block text-center w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                  >
                    Build 3D Replica
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
