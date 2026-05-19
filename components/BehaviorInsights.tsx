'use client';

import { UserProfile } from '@/lib/types/sessionLog';

interface BehaviorInsightsProps {
  profile: UserProfile;
}

export default function BehaviorInsights({ profile }: BehaviorInsightsProps) {
  return (
    <div className="glass-panel" style={{ marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>🧠 Your Learning Profile</h2>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard
          label="Completion Rate"
          value={`${profile.overallCompletionRate.toFixed(0)}%`}
          icon="✅"
          insight={
            profile.overallCompletionRate > 80
              ? 'Excellent consistency!'
              : 'Keep pushing! You\'re getting there.'
          }
        />
        <MetricCard
          label="Avg Task Duration"
          value={`${profile.avgTaskDuration.toFixed(0)} min`}
          icon="⏱️"
          insight={
            profile.signals.prefersShortTasks
              ? 'You excel at quick bursts'
              : 'Medium-length tasks work best for you'
          }
        />
        <MetricCard
          label="Engagement Level"
          value={profile.signals.engagementLevel.toUpperCase()}
          icon="🔥"
          insight={
            profile.signals.engagementLevel === 'high'
              ? 'You\'re crushing it!'
              : 'Let\'s find your rhythm'
          }
        />
        <MetricCard
          label="Break Pattern"
          value={`${profile.averageBreakSkipRate.toFixed(0)}% skip rate`}
          icon="☕"
          insight={
            profile.signals.skipsBreaks
              ? 'We\'ll insert breaks earlier for you'
              : 'You take healthy breaks 💪'
          }
        />
      </div>

      {/* Adaptations applied */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🎯 Adaptations Applied</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {profile.signals.prefersShortTasks && (
            <AdaptationBadge
              text="Short tasks optimized (10-15 min)"
              reason="Based on your completion patterns"
            />
          )}
          {profile.signals.skipsBreaks && (
            <AdaptationBadge
              text={`Breaks moved to ${profile.optimalBreakTiming} min mark`}
              reason="You tend to skip longer task sequences"
            />
          )}
          {profile.signals.dropoutAfterMinutes && (
            <AdaptationBadge
              text={`Sessions capped at ~${Math.max(30, profile.signals.dropoutAfterMinutes - 10)} min`}
              reason={`You've historically disengaged after ${profile.signals.dropoutAfterMinutes} min`}
            />
          )}
          {profile.signals.bestTimeOfDay && (
            <AdaptationBadge
              text={`Peak productivity: ${profile.signals.bestTimeOfDay}`}
              reason="Schedule sessions when you're most focused"
            />
          )}
          {profile.signals.highVariance && (
            <AdaptationBadge
              text="Variable task lengths (10, 18, 20 min)"
              reason="Your focus varies day-to-day"
            />
          )}
          {!profile.signals.prefersShortTasks && !profile.signals.skipsBreaks && !profile.signals.dropoutAfterMinutes && !profile.signals.bestTimeOfDay && !profile.signals.highVariance && (
             <p style={{ color: 'var(--text-secondary)' }}>More data needed for specific adaptations.</p>
          )}
        </div>
      </div>

      {/* Consistency timeline */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📈 Consistency Trend</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${profile.signals.consistencyScore}%`,
                backgroundColor: getTrendColor(profile.signals.consistencyScore),
              }}
            />
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', minWidth: '200px' }}>
            {profile.sessionConsistency === 'very_consistent'
              ? '🌟 Very consistent!'
              : profile.sessionConsistency === 'somewhat_consistent'
              ? '📊 Getting more consistent.'
              : '🌀 Patterns still forming.'}
          </p>
        </div>
      </div>

      {/* Total investment */}
      <div>
        <h3 style={{ marginBottom: '1rem' }}>💪 Total Invested</h3>
        <div>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{profile.totalHoursInvested.toFixed(1)}h </span>
          <span style={{ color: 'var(--text-secondary)' }}>across {profile.recentSessions} recent sessions</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, insight }: { label: string; value: string; icon: string; insight: string; }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.2rem 0' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{insight}</div>
    </div>
  );
}

function AdaptationBadge({ text, reason }: { text: string; reason: string; }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.8rem 1rem', borderRadius: '8px' }}>
      <div style={{ fontWeight: '600' }}>✨ {text}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{reason}</div>
    </div>
  );
}

function getTrendColor(score: number): string {
  if (score > 75) return '#10b981'; // green
  if (score > 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}
