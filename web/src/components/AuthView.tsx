"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Mail, Lock, User, Sparkles } from "lucide-react";

export default function AuthView() {
  const { login, signup, error, isLoading, clearError } = useAuthStore();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);
      await login(formData);
    } else {
      await signup({ email, name, password });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-slate-500 text-sm text-center">
            {isLoginMode
              ? "Access your digital fitting room and saved outfits."
              : "Generate your digital twin and try on the internet."}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Alex Mercer"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="you@domain.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span className="border-2 border-white/20 border-t-white rounded-full w-5 h-5 animate-spin"></span>
            ) : (
              <span>{isLoginMode ? "Sign In" : "Register"}</span>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              clearError();
            }}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            {isLoginMode
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
