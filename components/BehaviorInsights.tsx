'use client';

import { UserProfile } from '@/lib/types/sessionLog';

interface BehaviorInsightsProps {
  profile: UserProfile;
}

export default function BehaviorInsights({ profile }: BehaviorInsightsProps) {
  return (
    <div className="glass-panel relative overflow-hidden group">
      {/* Background neon glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      
      <div className="relative">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-3xl">🧠</span> Your Learning Profile
        </h2>

        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Completion Rate"
            value={`${profile.overallCompletionRate.toFixed(0)}%`}
            icon="✅"
            insight={
              profile.overallCompletionRate > 80
                ? 'Excellent consistency!'
                : 'Keep pushing! You\'re getting there.'
            }
            colorClass="from-emerald-600 to-emerald-400"
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
            colorClass="from-blue-600 to-blue-400"
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
            colorClass="from-orange-600 to-orange-400"
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
            colorClass="from-purple-600 to-purple-400"
          />
        </div>

        {/* Adaptations applied */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Inferred Preferences</h3>
          <div className="flex flex-col gap-3">
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
               <p className="text-slate-400 italic">More data needed for specific adaptations.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Consistency timeline */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">📈 Consistency Trend</h3>
            <div className="flex flex-col gap-2">
              <div className="w-full bg-slate-800/50 h-3 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 ease-out"
                  style={{ width: `${profile.signals.consistencyScore}%` }}
                />
              </div>
              <p className="text-sm text-purple-300">
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
            <h3 className="text-xl font-bold text-white mb-4">💪 Total Invested</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {profile.totalHoursInvested.toFixed(1)}h 
              </span>
              <span className="text-slate-400">across {profile.recentSessions} recent sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, insight, colorClass }: { label: string; value: string; icon: string; insight: string; colorClass: string; }) {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 shadow-lg relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${colorClass} rounded-bl-full opacity-20 group-hover:opacity-40 transition-opacity`}></div>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-white my-1">{value}</div>
      <div className="text-xs text-purple-300 font-medium">{insight}</div>
    </div>
  );
}

function AdaptationBadge({ text, reason }: { text: string; reason: string; }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-purple-900/20 border border-purple-500/20 p-4 rounded-xl hover:bg-purple-900/30 transition-colors">
      <div className="font-bold text-purple-100 flex items-center gap-2">
        <span className="text-purple-400">✨</span> {text}
      </div>
      <div className="text-sm text-purple-300 italic sm:ml-auto">
        {reason}
      </div>
    </div>
  );
}

function getTrendColor(score: number): string {
  if (score > 75) return '#10b981'; // green
  if (score > 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}
