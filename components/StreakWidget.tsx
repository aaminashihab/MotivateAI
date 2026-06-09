"use client";

import React, { useState, useEffect, useRef } from 'react';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  thisWeek: boolean[];
}

export default function StreakWidget({ streak }: { streak: StreakData }) {
  const [flames, setFlames] = useState<number[]>([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (streak.currentStreak > 0) {
      setFlames(Array(Math.min(streak.currentStreak, 7)).fill(0));
    }
  }, [streak.currentStreak]);

  const getMilestoneMessage = (days: number) => {
    if (days >= 100) return '⭐ Century Champion!';
    if (days >= 30) return '👑 Month Master!';
    if (days >= 14) return '💪 Fortnight Fighter!';
    if (days >= 7) return '🎉 Week Warrior!';
    return null;
  };

  const milestone = getMilestoneMessage(streak.currentStreak);

  return (
    <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-orange-500/30 rounded-3xl p-8 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-orange-500/30 transition-all duration-500"></div>
      
      <div className="text-center relative z-10">
        {/* Main Streak Display */}
        <div className="mb-6 animate-fade-in">
          <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 mb-2 drop-shadow-lg">
            {streak.currentStreak}
          </div>
          <p className="text-3xl text-orange-400 mb-2 flex justify-center gap-1">
            {flames.map((_, i) => (
              <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>🔥</span>
            ))}
          </p>
          <p className="text-xl text-white font-bold tracking-wider uppercase">Day Streak!</p>
        </div>

        {/* Milestone Message */}
        {milestone && (
          <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-6 py-2.5 rounded-full mb-8 text-sm font-bold inline-block">
            {milestone}
          </div>
        )}

        {/* Week View */}
        <div className="mb-8 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50">
          <p className="text-orange-300 text-xs font-bold uppercase tracking-widest mb-4">This Week&apos;s Activity</p>
          <div className="flex gap-2 justify-between max-w-[280px] mx-auto">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <div key={`${day}-${idx}`} className="text-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold mb-2 transition-all duration-300 ${
                    streak.thisWeek[idx]
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 scale-110 ring-2 ring-orange-500/50'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {streak.thisWeek[idx] ? '✓' : ''}
                </div>
                <p className="text-[10px] text-slate-400 font-bold">{day}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50 transition-colors hover:border-orange-500/30">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Current</p>
            <p className="text-white font-black text-2xl">{streak.currentStreak} <span className="text-sm font-normal text-slate-400">days</span></p>
          </div>
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50 transition-colors hover:border-orange-500/30">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Best</p>
            <p className="text-white font-black text-2xl">{streak.longestStreak} <span className="text-sm font-normal text-slate-400">days</span></p>
          </div>
        </div>

        {/* Motivation Message */}
        <p className="text-sm text-orange-200 mt-8 italic font-medium">
          {streak.currentStreak === 0
            ? '🚀 Start your first session to begin your streak!'
            : `💪 Keep it up! Next goal: Day ${streak.currentStreak + 1}!`}
        </p>
      </div>
    </div>
  );
}