"use client";

import { useState, useEffect } from 'react';

interface CoachMessageProps {
  userId: string;
}

export default function CoachMessage({ userId }: CoachMessageProps) {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoachMessage = async () => {
      if (!userId) return;

      // Check if we have a cached message for today
      const today = new Date().toDateString();
      const cached = localStorage.getItem('motivateai_daily_coach_msg');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === today && parsed.message) {
            setMessage(parsed.message);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      // If no valid cached message, fetch from API
      try {
        const res = await fetch(`/api/user/${userId}/coach`);
        if (res.ok) {
          const data = await res.json();
          if (data.message) {
            setMessage(data.message);
            // Cache it
            localStorage.setItem('motivateai_daily_coach_msg', JSON.stringify({
              date: today,
              message: data.message
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch coach message", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoachMessage();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 mb-8 flex items-center gap-4 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex-shrink-0"></div>
        <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-slate-900/40 border border-purple-500/30 rounded-xl p-5 mb-8 shadow-lg shadow-purple-900/20 flex items-start sm:items-center gap-4 animate-fade-in relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-400 to-fuchsia-500"></div>
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-inner text-2xl border-2 border-white/10 group-hover:scale-105 transition-transform">
        🤖
      </div>
      <div>
        <p className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-1">AI Coach Check-in</p>
        <p className="text-white text-lg font-medium leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
