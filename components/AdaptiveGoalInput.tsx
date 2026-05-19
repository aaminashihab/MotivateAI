'use client';

import { useState } from 'react';
import { AdaptiveSessionPlan } from '@/lib/services/adaptiveSessionGenerator';

interface AdaptiveGoalInputProps {
  userId: string;
  onSessionGenerated: (plan: AdaptiveSessionPlan) => void;
  isLoading?: boolean;
}

export default function AdaptiveGoalInput({
  userId,
  onSessionGenerated,
  isLoading = false,
}: AdaptiveGoalInputProps) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goal.trim()) {
      setError('Please enter a goal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/session/generate-adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate session');
      }

      const sessionPlan: AdaptiveSessionPlan = await response.json();

      setGoal('');
      onSessionGenerated(sessionPlan);
    } catch (err: any) {
      console.error('Session generation failed:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>What do you want to accomplish today?</h2>
      <form onSubmit={handleGenerateSession}>
        <div className="input-group">
          <input
            type="text"
            placeholder="e.g., I want to learn Python basics"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={loading || isLoading}
          />
          <button type="submit" disabled={loading || isLoading || !goal}>
            {(loading || isLoading) ? <span className="loader"></span> : 'Start'}
          </button>
        </div>

        {error && <p style={{ color: 'var(--success)', marginTop: '1rem' }}>{error}</p>}

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>
          💡 MotivateAI is learning your study style and will personalize
          future sessions for maximum completion!
        </p>
      </form>
    </div>
  );
}
