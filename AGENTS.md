
# Agent Architecture

MotivateAI uses Google Gemini 2.5 Flash as its core AI agent via a multi-turn 
tool-calling loop. The agent:

- Reads the user's last 30 sessions from MongoDB
- Generates an optimized study plan with task breakdown
- Sources YouTube tutorials via the YouTube Data API
- Runs behavioral optimization analysis on break patterns and drop-off signals
- Writes updated preferences back to the user profile

All agentic behavior is implemented via Gemini's native function-calling API 
(`@google/generative-ai` SDK)
