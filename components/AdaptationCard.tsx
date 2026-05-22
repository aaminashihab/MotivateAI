"use client";

import React from 'react';

export interface Adaptation {
  id: string;
  type: 'task_duration' | 'break_length' | 'difficulty' | 'session_time';
  before: string;
  after: string;
  reason: string;
  impact: number;
  timestamp: Date;
  aiReasoning: string;
}

export default function AdaptationCard({ adaptation }: { adaptation: Adaptation }) {
  const icons = {
    task_duration: '⏱️',
    break_length: '☕',
    difficulty: '📈',
    session_time: '🕐',
  };

  const colors = {
    task_duration: 'from-blue-600 to-blue-500',
    break_length: 'from-emerald-600 to-emerald-500',
    difficulty: 'from-orange-600 to-orange-500',
    session_time: 'from-purple-600 to-purple-500',
  };

  return (
    <div className={`bg-gradient-to-r ${colors[adaptation.type]} p-[2px] rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
      <div className="bg-slate-900 rounded-2xl p-5 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl bg-slate-800 p-2 rounded-xl border border-slate-700/50">{icons[adaptation.type]}</span>
            <div>
              <h3 className="text-white font-bold capitalize text-lg">
                {adaptation.type.replace('_', ' ')} Optimized
              </h3>
              <p className="text-xs text-purple-300">
                {adaptation.timestamp.toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm shadow-emerald-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            +{adaptation.impact}% better
          </span>
        </div>

        {/* Before/After */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">Before</p>
            <p className="text-slate-300 font-mono text-sm">{adaptation.before}</p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full"></div>
            <p className="text-xs text-emerald-400 mb-1 font-medium uppercase tracking-wider">After</p>
            <p className="text-white font-mono text-sm font-bold">{adaptation.after}</p>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🤖</span>
            <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">AI Reasoning</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {adaptation.aiReasoning}
          </p>
        </div>

        {/* Simple explanation summary */}
        <div className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-purple-300 italic">
            {adaptation.reason}
          </p>
        </div>
      </div>
    </div>
  );
}
