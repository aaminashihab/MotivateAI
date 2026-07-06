# MotivateAI

MotivateAI is an intelligent learning companion designed to combat the 95% dropout rate in self-directed learning. It uses AI, behavioral analytics, and personalized task scheduling to help you stay consistent.

## Features
- **Adaptive Session Generation**: Break large goals down into actionable, 10-30 minute micro-tasks powered by Gemini 2.5 Flash.
- **Behavioral Analytics**: Tracks your completion rate, break patterns, and engagement to adapt future sessions to your true working style.
- **YouTube Integration**: Automatically suggests short, targeted tutorials for specific tasks.
- **Secure Authentication**: JWT-based authentication with Edge Middleware for IDOR protection.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB
- **Authentication:** `jose` (JWT), `bcryptjs`
- **AI Core:** `@google/generative-ai` (Gemini 2.5 Flash)

## Setup
1. Clone the repository
2. `npm install`
3. Set up your `.env.local` based on `.env.example`
4. `npm run dev`

## Known Limitations & Security Notes
As this is a portfolio project designed to demonstrate core feature velocity and basic security competence, there are a few architectural tradeoffs made for the sake of simplicity:

- **In-Memory Rate Limiting**: The `/api/youtube` and AI routes use a simple in-memory `Map` to rate-limit requests. In a real-world serverless deployment (e.g., Vercel), this state resets per lambda cold-start and does not share across instances. For production scale, this would be swapped out for a centralized store like **Upstash Redis**.
- **MCP Prompt Injection Defenses**: The agent routes (`/api/agent` and adaptive session generators) use basic regex filtering (e.g., stripping "ignore previous instructions") to mitigate prompt injection. A production-grade defense would require output-side validation, LLM-as-a-judge classifiers, and strictly scoped read-only database roles, rather than just input sanitization.
- **Password Reset Flow**: The password reset endpoints currently log the reset link to the console for demonstration purposes, and store the reset token in plaintext. In a live environment, this would integrate with an email provider (like Resend or SendGrid) and mathematically hash the tokens before storing them in MongoDB.

*(Note: JWT secrets are strictly enforced; the app is configured to fail and crash on startup if `JWT_SECRET` is missing in production, avoiding dangerous fallback defaults).*
