# MotivateAI 🔥
### Your Autonomous AI Agent for Building Consistency

> **Built for the Google Gemini Hackathon** — An AI-powered learning coach that actively builds sustainable work habits by dynamically scheduling tasks, sourcing real-world learning materials, and intelligently managing breaks.

[![Live Demo](https://img.shields.io/badge/Live-Demo-purple?style=for-the-badge)](https://motivateai-471444428139.europe-west1.run.app)
[![GitHub](https://img.shields.io/badge/GitHub-aaminashihab/MotivateAI-black?style=for-the-badge&logo=github)](https://github.com/aaminashihab/MotivateAI)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-API-blue?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 🚨 Honest Dev Note (Read This First)

Most of the data you see in the UI right now is **dummy/hardcoded**. This README is your guide to replacing every fake number with real, dynamic, Gemini-powered data.

The bones are solid. The AI logic is partially real. But the Profile page analytics, the "How We've Optimized for You" cards, the consistency trend chart — those are currently seeded with static values.

**This README tells you exactly what's fake, where it lives, and how to make it real.**

---

## 📸 What's Currently Built

| Page | Status | Notes |
|------|--------|-------|
| Dashboard (streak, weekly activity) | ✅ Partial | Streak is real, activity dots are hardcoded |
| AI Coach Check-in banner | ✅ Real | Gemini generates this message |
| "What do you want to accomplish?" | ✅ Real | User input → Gemini → session plan |
| Session flow (timer, tasks, video) | ✅ Real | YouTube search is live, timer is real |
| Profile → Learning stats (90% completion, HIGH engagement) | ❌ Fake | Hardcoded in component |
| Profile → Consistency Trend chart | ❌ Fake | Static data array |
| Profile → Peak Performance Times chart | ❌ Fake | Hardcoded hours |
| Profile → "How We've Optimized for You" cards | ❌ Fake | Seeded optimization history |
| Profile → Weekly Stats (12 sessions, 18.5h) | ❌ Fake | Hardcoded numbers |
| Settings → Save preferences | ✅ Real | Saves to Firestore/localStorage |

---

## 🏗️ Project Structure

```
MotivateAI/
├── app/
│   ├── page.tsx                    # Dashboard (main entry)
│   ├── profile/
│   │   └── page.tsx                # Learning profile + analytics
│   ├── settings/
│   │   └── page.tsx                # User preferences
│   └── api/
│       ├── generate-session/
│       │   └── route.ts            # Gemini: generates session plan from user goal
│       ├── coach-checkin/
│       │   └── route.ts            # Gemini: daily check-in message
│       ├── youtube-search/
│       │   └── route.ts            # YouTube Data API: finds learning resource
│       └── optimize-profile/
│           └── route.ts            # Gemini: analyzes sessions → optimization cards
│
├── components/
│   ├── Dashboard/
│   │   ├── StreakCard.tsx           # 🔥 streak display
│   │   ├── WeeklyActivity.tsx       # 7-day activity dots
│   │   ├── CoachCheckin.tsx         # AI coach banner
│   │   ├── GoalInput.tsx            # "What do you want to accomplish?"
│   │   └── SessionView.tsx          # Timer + task list + YouTube embed
│   │
│   └── Profile/
│       ├── LearningStats.tsx        # ❌ FAKE — completion rate, engagement etc
│       ├── ConsistencyChart.tsx     # ❌ FAKE — recharts line graph
│       ├── PeakPerformance.tsx      # ❌ FAKE — bar chart by time of day
│       ├── OptimizationHistory.tsx  # ❌ FAKE — before/after cards
│       ├── TaskDifficulty.tsx       # ❌ FAKE — donut chart
│       └── WeeklyStats.tsx          # ❌ FAKE — sessions/hours/avg
│
├── lib/
│   ├── gemini.ts                   # Gemini API client + prompt functions
│   ├── session-store.ts            # ❌ NEEDS WORK — session persistence
│   └── user-store.ts               # ❌ NEEDS WORK — user data persistence
│
└── public/
    └── ...
```

---

## ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/aaminashihab/MotivateAI.git
cd MotivateAI

# 2. Install
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your keys (see Environment Variables section below)

# 4. Run locally
npm run dev

# App runs at http://localhost:3000
```

---

## 🔑 Environment Variables

Create a `.env.local` file:

```env
# Gemini API (Required — everything AI runs on this)
GEMINI_API_KEY=your_gemini_api_key_here

# YouTube Data API v3 (Required — learning resource search)
YOUTUBE_API_KEY=your_youtube_api_key_here

# MongoDB (Required for session persistence and tracking)
MONGODB_URI=your_mongodb_connection_string_here

# Optional: If you add auth later
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

**Where to get keys:**
- Gemini API → [aistudio.google.com](https://aistudio.google.com/app/apikey)
- YouTube Data API → [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → YouTube Data API v3
- MongoDB → [mongodb.com](https://www.mongodb.com)

---

## 🧠 How the Real AI Works (What's Actually Gemini)

### 1. Session Generation (`/api/generate-session`)

When the user types their goal (e.g., "oop concept") and hits Start, this fires:

```typescript
// lib/gemini.ts
export async function generateSessionPlan(
  goal: string,
  userPreferences: UserPreferences,
  sessionHistory: Session[]
) {
  const prompt = `
    You are an AI learning coach. Generate a focused study session plan.
    
    User's goal: "${goal}"
    Learning style: ${userPreferences.learningStyle}
    Preferred session length: ${userPreferences.maxSession} minutes
    Difficulty level: ${userPreferences.difficultyLevel}
    
    Recent session history (last 5):
    ${sessionHistory.slice(-5).map(s => 
      `- ${s.topic}: ${s.completionRate}% completion, ${s.duration}min`
    ).join('\n')}
    
    Generate a session plan with 4 tasks. Return JSON:
    {
      "tasks": [
        {
          "id": 1,
          "title": "Introduction & Setup",
          "duration": 15,
          "description": "What to focus on in this task"
        }
      ],
      "searchQuery": "best youtube video for learning [topic] beginners",
      "estimatedDifficulty": "beginner|intermediate|expert"
    }
    
    Return ONLY valid JSON, no markdown.
  `
  
  const result = await model.generateContent(prompt)
  return JSON.parse(result.response.text())
}
```

**This is already working.** The tasks you see (Introduction & Setup, Core Concepts, etc.) are real Gemini output.

### 2. Daily Coach Check-in (`/api/coach-checkin`)

Runs on dashboard load. Gemini writes a personalized message based on streak + last session:

```typescript
export async function generateCoachCheckin(
  streak: number,
  lastSessionTopic: string,
  lastSessionCompletion: number,
  daysSinceLastSession: number
) {
  const prompt = `
    You are a supportive AI learning coach. Write ONE short check-in message (max 15 words).
    
    User stats:
    - Current streak: ${streak} days
    - Last studied: ${lastSessionTopic}
    - Last completion rate: ${lastSessionCompletion}%
    - Days since last session: ${daysSinceLastSession}
    
    Rules:
    - If daysSinceLastSession > 2: gently acknowledge the gap, invite them back
    - If completion < 60%: encourage without guilt
    - If streak > 7: celebrate
    - Always end with a question or action
    - Sound human, not robotic
    
    Return ONLY the message text, no quotes.
  `
  
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
```

**This is real.** "Keep up the great work! Ready for another session today?" — that's Gemini.

---

## ❌ What's Fake + How to Fix It

### Fix 1: Learning Stats (Completion Rate, Engagement, etc.)

**Currently:** Hardcoded `90%`, `HIGH`, `15 min`, `0% skip rate`

**File:** `components/Profile/LearningStats.tsx`

```typescript
// ❌ CURRENT (fake)
const stats = {
  completionRate: 90,
  avgTaskDuration: 15,
  engagementLevel: "HIGH",
  breakSkipRate: 0
}

// ✅ REPLACE WITH: Calculate from real session history
export async function calculateLearningStats(userId: string) {
  const sessions = await getSessionHistory(userId, 30) // last 30 sessions
  
  const completionRate = Math.round(
    sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length
  )
  
  const avgTaskDuration = Math.round(
    sessions.reduce((sum, s) => sum + s.avgTaskDuration, 0) / sessions.length
  )
  
  const breakSkipRate = Math.round(
    (sessions.filter(s => s.skippedBreak).length / sessions.length) * 100
  )
  
  const engagementLevel = completionRate >= 80 ? "HIGH" 
    : completionRate >= 60 ? "MEDIUM" 
    : "LOW"
  
  return { completionRate, avgTaskDuration, engagementLevel, breakSkipRate }
}
```

**Session schema you need to store:**
```typescript
interface Session {
  id: string
  userId: string
  topic: string
  goal: string
  startedAt: Date
  completedAt: Date | null
  tasks: Task[]
  completionRate: number      // 0-100: % of tasks marked done
  avgTaskDuration: number     // minutes per task
  skippedBreak: boolean
  difficultyRating: number    // 1-5 (ask user at end)
  timeOfDay: string           // "6-8 AM", "8-10 AM", etc.
}
```

---

### Fix 2: Consistency Trend Chart

**Currently:** Static array `[{day: 'Mon', completion: 60, engagement: 47}, ...]`

**File:** `components/Profile/ConsistencyChart.tsx`

```typescript
// ❌ CURRENT (fake)
const data = [
  { day: 'Mon', completion: 60, engagement: 47 },
  { day: 'Tue', completion: 65, engagement: 50 },
  // ... hardcoded
]

// ✅ REPLACE WITH: Real 7-day aggregation
export async function getWeeklyTrend(userId: string) {
  const last7Days = getLast7Days() // ['Mon', 'Tue', ..., 'Sun']
  
  return Promise.all(last7Days.map(async (day) => {
    const sessions = await getSessionsForDay(userId, day.date)
    
    if (sessions.length === 0) {
      return { day: day.label, completion: 0, engagement: 0 }
    }
    
    const avgCompletion = Math.round(
      sessions.reduce((sum, s) => sum + s.completionRate, 0) / sessions.length
    )
    
    // Engagement score: weighted combo of completion + time spent + no skips
    const avgEngagement = Math.round(
      sessions.reduce((sum, s) => {
        const timeScore = Math.min((s.duration / s.expectedDuration) * 100, 100)
        const skipPenalty = s.skippedBreak ? 15 : 0
        return sum + ((s.completionRate * 0.6) + (timeScore * 0.4) - skipPenalty)
      }, 0) / sessions.length
    )
    
    return { day: day.label, completion: avgCompletion, engagement: avgEngagement }
  }))
}
```

---

### Fix 3: Peak Performance Times

**Currently:** Hardcoded bar chart showing 6-8AM and 8-10AM as "best"

**File:** `components/Profile/PeakPerformance.tsx`

```typescript
// ❌ CURRENT (fake)
const timeSlots = [
  { slot: '6-8 AM', performance: 95, color: 'green' },
  { slot: '8-10 AM', performance: 93, color: 'green' },
  // ...hardcoded
]

// ✅ REPLACE WITH: Group sessions by time of day
export async function getPeakPerformanceTimes(userId: string) {
  const sessions = await getSessionHistory(userId, 30)
  
  const timeSlots = {
    '6-8 AM':   { total: 0, count: 0 },
    '8-10 AM':  { total: 0, count: 0 },
    '10-12 PM': { total: 0, count: 0 },
    '2-4 PM':   { total: 0, count: 0 },
    '6-8 PM':   { total: 0, count: 0 },
  }
  
  sessions.forEach(session => {
    const hour = new Date(session.startedAt).getHours()
    const slot = getTimeSlot(hour) // maps hour → slot string
    
    if (slot && timeSlots[slot]) {
      timeSlots[slot].total += session.completionRate
      timeSlots[slot].count++
    }
  })
  
  return Object.entries(timeSlots).map(([slot, data]) => ({
    slot,
    performance: data.count > 0 ? Math.round(data.total / data.count) : 0,
    sessionCount: data.count
  }))
}

function getTimeSlot(hour: number): string {
  if (hour >= 6 && hour < 8)   return '6-8 AM'
  if (hour >= 8 && hour < 10)  return '8-10 AM'
  if (hour >= 10 && hour < 12) return '10-12 PM'
  if (hour >= 14 && hour < 16) return '2-4 PM'
  if (hour >= 18 && hour < 20) return '6-8 PM'
  return 'Other'
}
```

---

### Fix 4: "How We've Optimized for You" Cards ⭐ (Most Important)

This is the most impressive feature in the product. Currently **completely fake**. Here's how to make it real with Gemini:

**File:** `components/Profile/OptimizationHistory.tsx`

```typescript
// ❌ CURRENT (fake)
const optimizations = [
  {
    title: "Break Length Optimized",
    date: "5/20/2026",
    improvement: "+23% better",
    before: "2 min breaks",
    after: "5 min breaks",
    reasoning: "Analysis shows your engagement drops 40% after 30 minutes..."
  }
  // ... all fake
]

// ✅ REPLACE WITH: Gemini analyzes real session data
// Run this in /api/optimize-profile/route.ts (weekly cron or on-demand)

export async function generateOptimizations(
  userId: string,
  currentPreferences: UserPreferences,
  sessionHistory: Session[]
) {
  // Prepare analytics summary for Gemini
  const analytics = {
    avgCompletionByBreakLength: groupBy(sessionHistory, 'breakLength')
      .map(g => ({ breakLength: g.key, avgCompletion: average(g.sessions, 'completionRate') })),
    
    avgCompletionByTimeOfDay: groupBy(sessionHistory, 'timeOfDay')
      .map(g => ({ time: g.key, avgCompletion: average(g.sessions, 'completionRate') })),
    
    avgCompletionByTaskDuration: groupBy(sessionHistory, 'avgTaskDuration')
      .map(g => ({ duration: g.key, avgCompletion: average(g.sessions, 'completionRate') })),
    
    skipRateByDifficulty: groupBy(sessionHistory, 'difficulty')
      .map(g => ({ difficulty: g.key, skipRate: skipRate(g.sessions) })),
  }
  
  const prompt = `
    You are an AI learning coach analyzing a user's learning patterns.
    
    Current preferences:
    - Break length: ${currentPreferences.breakLength} minutes
    - Session time: ${currentPreferences.preferredSessionTime}
    - Task duration: ${currentPreferences.maxSession} minutes
    - Difficulty: ${currentPreferences.difficultyLevel}
    
    Analytics from last 30 sessions:
    ${JSON.stringify(analytics, null, 2)}
    
    Identify 2-3 specific optimizations that would improve performance.
    For each, provide a BEFORE/AFTER comparison with a percentage improvement estimate.
    
    Return JSON array:
    [
      {
        "title": "Break Length Optimized",
        "category": "break|time|duration|difficulty|focus",
        "before": "2 min breaks",
        "after": "5 min breaks",
        "improvementPercent": 23,
        "reasoning": "Your engagement drops measurably after 30 min of continuous work. Longer breaks maintain peak focus.",
        "dataPoint": "You were skipping breaks, causing focus drops after 30 min",
        "newPreferences": { "breakLength": 5 }
      }
    ]
    
    Return ONLY valid JSON array.
  `
  
  const result = await model.generateContent(prompt)
  const optimizations = JSON.parse(result.response.text())
  
  // Apply the new preferences automatically
  for (const opt of optimizations) {
    if (opt.newPreferences) {
      await updateUserPreferences(userId, opt.newPreferences)
    }
    
    // Store in DB so the UI can show history
    await saveOptimization(userId, {
      ...opt,
      date: new Date(),
      applied: true
    })
  }
  
  return optimizations
}
```

**Trigger this function:**
```typescript
// Option A: Run weekly via cron
// vercel.json
{
  "crons": [
    {
      "path": "/api/optimize-profile",
      "schedule": "0 9 * * 1"  // Every Monday at 9 AM
    }
  ]
}

// Option B: Run after every 5th session
// In your session completion handler:
const sessionCount = await getSessionCount(userId)
if (sessionCount % 5 === 0) {
  await generateOptimizations(userId, prefs, history)
}
```

---

### Fix 5: Weekly Stats

**Currently:** `12 sessions, 18.5h, 1h 32m avg, 7 streak`

**File:** `components/Profile/WeeklyStats.tsx`

```typescript
// ❌ CURRENT (fake)
const stats = {
  totalSessions: 12,
  totalHours: 18.5,
  avgPerSession: "1h 32m",
  streakDays: 7
}

// ✅ REPLACE WITH:
export async function getWeeklyStats(userId: string) {
  const sessions = await getSessionsThisWeek(userId)
  const streak = await getCurrentStreak(userId)
  
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const avgMinutes = sessions.length > 0 
    ? Math.round(totalMinutes / sessions.length) 
    : 0
  
  return {
    totalSessions: sessions.length,
    totalHours: parseFloat((totalMinutes / 60).toFixed(1)),
    avgPerSession: formatDuration(avgMinutes), // "1h 32m"
    streakDays: streak
  }
}
```

---

## 💾 Data Layer: What You Need to Store

Right now the app has almost no persistence. To make everything real, you need to store sessions. Here's the minimum schema:

### Database Architecture (MongoDB)

```typescript
// lib/types/sessionLog.ts

// Collection: sessions
interface StoredSession {
  id: string
  topic: string
  goal: string
  startedAt: Timestamp
  completedAt: Timestamp | null
  durationMinutes: number
  tasks: {
    id: number
    title: string
    durationMin: number
    completedAt: Timestamp | null
    skipped: boolean
  }[]
  completionRate: number        // 0-100
  breaksTaken: number
  breaksSkipped: number
  timeOfDay: string             // '8-10 AM'
  difficultyLevel: string       // 'beginner' | 'intermediate' | 'expert'
  youtubeVideoId: string | null
  userRating: number | null     // 1-5 stars (ask at end of session)
}

// Collection: users/{userId}
interface UserProfile {
  createdAt: Timestamp
  streak: number
  lastSessionDate: string       // 'YYYY-MM-DD'
  totalSessions: number
  preferences: UserPreferences
  optimizations: Optimization[] // history of AI-applied changes
}

// How to save a session:
export async function saveSession(userId: string, session: StoredSession) {
  const db = getFirestore()
  
  // Save session
  await addDoc(collection(db, 'users', userId, 'sessions'), session)
  
  // Update user profile
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    totalSessions: increment(1),
    lastSessionDate: format(new Date(), 'yyyy-MM-dd'),
    streak: await calculateStreak(userId)
  })
}
```

### Option B: localStorage (For hackathon demo, no backend needed)

```typescript
// lib/session-store.ts
const SESSIONS_KEY = 'motivateai_sessions'
const USER_KEY = 'motivateai_user'

export function saveSession(session: StoredSession) {
  const sessions = getSessions()
  sessions.push(session)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getSessions(): StoredSession[] {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export function getSessionsLast30Days(): StoredSession[] {
  const cutoff = subDays(new Date(), 30)
  return getSessions().filter(s => 
    new Date(s.startedAt) > cutoff
  )
}
```

---

## 🎯 Session Completion Flow (Critical Missing Piece)

Right now when a user finishes a session, nothing is saved. Add this:

```typescript
// components/Dashboard/SessionView.tsx

async function handleSessionComplete() {
  const endTime = new Date()
  const completedTaskCount = tasks.filter(t => t.completed).length
  
  const sessionData: StoredSession = {
    id: crypto.randomUUID(),
    topic: currentGoal,
    goal: currentGoal,
    startedAt: sessionStartTime,
    completedAt: endTime,
    durationMinutes: Math.round((endTime - sessionStartTime) / 60000),
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      durationMin: t.duration,
      completedAt: t.completedAt || null,
      skipped: t.skipped || false
    })),
    completionRate: Math.round((completedTaskCount / tasks.length) * 100),
    breaksTaken: breaksTaken,
    breaksSkipped: breaksSkipped,
    timeOfDay: getTimeSlot(new Date(sessionStartTime).getHours()),
    difficultyLevel: userPreferences.difficultyLevel,
    youtubeVideoId: currentVideoId,
    userRating: null // prompt user to rate
  }
  
  // Save it
  await saveSession(userId, sessionData)
  
  // Update streak
  await updateStreak(userId)
  
  // Show completion screen
  setSessionComplete(true)
  
  // Ask for rating (optional but valuable)
  setShowRatingPrompt(true)
}
```

---

## 🤖 Gemini Prompts Cheat Sheet

All the prompts that power the app, ready to copy-paste:

```typescript
// lib/gemini.ts

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// 1. Generate session plan
export const SESSION_PROMPT = (goal, prefs, history) => `...` // see above

// 2. Daily coach check-in  
export const CHECKIN_PROMPT = (streak, lastTopic, daysSince) => `
  Write a 1-sentence check-in for a user studying ${lastTopic}.
  Streak: ${streak} days. Days since last session: ${daysSince}.
  ${daysSince > 2 ? 'They missed some days - be understanding, not guilt-trippy.' : ''}
  ${streak > 7 ? 'Celebrate their streak!' : ''}
  Max 15 words. End with a question.
`

// 3. Generate optimizations (weekly)
export const OPTIMIZE_PROMPT = (prefs, analytics) => `...` // see above

// 4. Post-session reflection (new feature idea)
export const REFLECTION_PROMPT = (session) => `
  The user just completed a session on "${session.topic}".
  Completion rate: ${session.completionRate}%.
  Duration: ${session.durationMinutes} minutes.
  
  Write 2-3 bullet points:
  1. What they likely learned
  2. A specific follow-up question to test their understanding
  3. What to tackle next session
  
  Keep it encouraging and specific.
`

// 5. Smart resource search query
export const YOUTUBE_QUERY_PROMPT = (goal, level) => `
  Generate the best YouTube search query to find a tutorial for: "${goal}"
  User level: ${level}
  
  Return ONLY the search query string, no explanation.
  Example output: "python list comprehensions tutorial for beginners freeCodeCamp"
`
```

---

## 🚀 Deployment (Google Cloud Run)

The app deploys via Cloud Build trigger on push to `main`.

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '--no-cache', '-t', 'europe-west1-docker.pkg.dev/$PROJECT_ID/motivateai/motivateai:latest', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'europe-west1-docker.pkg.dev/$PROJECT_ID/motivateai/motivateai:latest']
  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'services'
      - 'update'
      - 'motivateai'
      - '--image=europe-west1-docker.pkg.dev/$PROJECT_ID/motivateai/motivateai:latest'
      - '--region=europe-west1'
```

**Set env vars in Cloud Run:**
```bash
gcloud run services update motivateai \
  --set-env-vars GEMINI_API_KEY=xxx,YOUTUBE_API_KEY=xxx \
  --region europe-west1
```

---

## 🗺️ Vibe Coding Priorities

If you're picking this up to make it production-ready, attack in this order:

### Day 1: Data Foundation
- [x] Set up MongoDB sessions
- [ ] Add session save on completion (`handleSessionComplete`)
- [ ] Store `startedAt`, `completedAt`, `completionRate`, `timeOfDay` per session
- [ ] Wire streak to real session dates (not hardcoded)

### Day 2: Real Profile Analytics
- [ ] Replace hardcoded stats with `calculateLearningStats(sessions)`
- [ ] Build real consistency trend from last 7 days of sessions
- [ ] Build real peak performance from session `timeOfDay` field
- [ ] Weekly stats from actual data

### Day 3: Make Optimizations Real ⭐
- [ ] Build `generateOptimizations()` using Gemini + real session data
- [ ] Run it after every 5th session completion
- [ ] Show real before/after with real percentages
- [ ] Apply the new preferences automatically

### Day 4: Polish
- [ ] Add rating prompt after session complete (1-5 stars)
- [ ] Add post-session reflection (Gemini writes it)
- [ ] Fix the "Patterns still forming" empty state — show something useful even with 1-2 sessions
- [ ] Mobile responsive fixes

### Day 5: Ship
- [ ] Fix Cloud Build Docker error (check build logs for exact error)
- [ ] Add error boundaries so API failures don't crash the UI
- [ ] Test full flow: goal → session → complete → profile updates

---

## 🐛 Known Issues

1. **Cloud Build failing** — Docker build step exits with non-zero status. Check the full build log in Cloud Run → Logs Explorer. Likely a missing env var or node version mismatch in Dockerfile.

2. **Profile data doesn't update** — Because sessions aren't being saved. Fix session persistence first (Day 1 above).

3. **Streak resets** — Streak logic needs to compare `lastSessionDate` with today's date and increment/reset accordingly. Currently may be recalculating wrong.

4. **YouTube embed CORS** — Sometimes the embed fails due to YouTube's iframe policies. Fall back to a "Watch on YouTube" link if embed fails.

5. **Gemini rate limits** — If generating session plans for many users simultaneously, you'll hit rate limits on the free tier. Implement request queuing or upgrade to paid.

---

## 🤝 Contributing

This was built solo for a hackathon. If you're picking it up:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/real-analytics`)
3. Follow the "Vibe Coding Priorities" order above
4. PR back to main

The code is intentionally lean — no over-engineering. Keep it that way.

---

## 📄 License

MIT — do whatever you want with it.

---

*Built with Next.js, Tailwind, Gemini API, YouTube Data API, and a lot of caffeine.*  
*Deployed on Google Cloud Run.*
