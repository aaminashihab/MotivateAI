"use client";
import { useState, useEffect } from 'react';

export default function BreakManager({ 
  initialMinutes, 
  taskIndex,
  onComplete 
}: { 
  initialMinutes: number, 
  taskIndex: number,
  onComplete: () => void 
}) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreakMode, setIsBreakMode] = useState(false);
  const [activityIndex, setActivityIndex] = useState(0);

  const ACTIVITIES = [
    "💧 Time to hydrate! Grab a glass of water.",
    "🫁 Take 3 deep breaths. Inhale... Exhale...",
    "🌟 'Small daily improvements over time lead to stunning results.'",
    "🚶‍♂️ Stand up and stretch your legs for a moment."
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('motivateai_timer_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.taskIndex === taskIndex) {
            setTimeLeft(parsed.timeLeft);
            setIsBreakMode(parsed.isBreakMode || false);
            setActivityIndex(parsed.activityIndex || Math.floor(Math.random() * ACTIVITIES.length));
            setIsActive(false);
            return;
          }
        } catch (e) {}
      }
    }
    setTimeLeft(initialMinutes * 60);
    setIsBreakMode(false);
    setIsActive(false);
    setActivityIndex(Math.floor(Math.random() * ACTIVITIES.length));
  }, [initialMinutes, taskIndex]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('motivateai_timer_state', JSON.stringify({
        taskIndex,
        timeLeft,
        isBreakMode,
        activityIndex
      }));
    }
  }, [timeLeft, taskIndex, isBreakMode, activityIndex]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (isBreakMode) {
        onComplete();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete, isBreakMode]);

  const toggleTimer = () => setIsActive(!isActive);

  const handleMarkDone = () => {
    if (!isBreakMode) {
      setIsBreakMode(true);
      setTimeLeft(5 * 60); // 5 min break
      setIsActive(true); // Auto-start break timer
    }
  };

  const handleSkipBreak = () => {
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isBreakMode) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--success)' }}>
        <h2>Break Time (5 Min)</h2>
        <p style={{ margin: '1rem 0', color: 'var(--success)' }}>{ACTIVITIES[activityIndex]}</p>
        <div className="timer-display" style={{ background: 'linear-gradient(135deg, #10b981, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {formatTime(timeLeft)}
        </div>
        <div className="controls">
          <button onClick={toggleTimer}>{isActive ? 'Pause' : 'Resume'}</button>
          <button onClick={handleSkipBreak} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--text-secondary)' }}>
            Skip Break
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <h2>Current Task Timer</h2>
      <div className="timer-display">{formatTime(timeLeft)}</div>
      <div className="controls">
        <button onClick={toggleTimer}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button 
          onClick={handleMarkDone} 
          style={{ background: 'var(--success)' }}
        >
          Mark Done
        </button>
      </div>
    </div>
  );
}
