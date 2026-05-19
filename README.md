# MotivateAI: Your Autonomous Consistency Agent 🧠✨

An autonomous AI agent powered by **Google Gemini 2.0 Flash** and the **Model Context Protocol (MCP)** that actively builds sustainable work habits by dynamically scheduling tasks, sourcing real-world learning materials, and intelligently managing breaks.

---

## 🏆 Google Cloud Rapid Agent Hackathon Submission

**MotivateAI** was built to solve a very specific problem: task paralysis and the inability to build consistent habits, particularly for neurodivergent individuals (like those with ADHD). 

Traditional chatbots fail because they are passive—you have to tell them exactly what you need. **MotivateAI moves beyond chat.** It is an autonomous agent that proactively manages your workflow.

### 🔥 Hackathon "Superpowers" (MCP Integration)
To give MotivateAI its superpowers, we implemented a custom agentic orchestration loop in Next.js using **Gemini Function Calling** to integrate dynamically with the **official GitHub MCP server**. 

Instead of hallucinating study steps, when a user asks for help learning a new technology, the agent autonomously searches GitHub repositories and reads documentation via the MCP protocol to generate a highly accurate, real-world action plan.

---

## ✨ Key Features

1. **Autonomous Task Breakdown:** Tell the agent your goal (e.g., "I want to learn Next.js 15 routing"), and it automatically breaks it down into bite-sized, actionable tasks with realistic time estimates.
2. **GitHub MCP Integration:** The agent queries live GitHub repositories to base your tasks on real, up-to-date documentation.
3. **Smart Learning Integration:** Automatically fetches and embeds highly relevant YouTube educational videos right in the dashboard to prevent the distraction of context-switching.
4. **Proactive Break Management:** Built-in timers that detect session fatigue and suggest healthy breaks (stretching, hydrating) instead of doom-scrolling.
5. **Behavioral Adaptation Dashboard:** Tracks your completion rate, average task duration, and break-skipping habits, autonomously adjusting future session lengths and break timings to fit your unique rhythm.

---

## 🛠️ Built With

*   **Google Gemini 2.0 Flash:** For core agent reasoning, function calling, and decision-making.
*   **Model Context Protocol (MCP):** Integrated via `@modelcontextprotocol/sdk` to grant the agent live access to GitHub.
*   **Next.js 15 & React:** For a highly responsive, modern user interface.
*   **MongoDB Atlas:** To store session histories, behavioral logs, and adaptive learning profiles.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   A Google Gemini API Key
*   A GitHub Personal Access Token (for the MCP Server)
*   A MongoDB Connection String

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aaminashihab/MotivateAI-.git
   cd motivate-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
   YOUTUBE_API_KEY=your_youtube_api_key_optional
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser and start building consistency!

---

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
