# Google Cloud Run Deployment - Final Steps

Because of a strict Docker naming rule (image names cannot end with a hyphen), the Google Cloud Build crashed when trying to use your repository name (`MotivateAI-`).

When you return tomorrow, just follow these two quick steps to fix it and get your app live!

### Step 1: Rename the GitHub Repository
1. Go to your GitHub repository in your browser: `https://github.com/aaminashihab/MotivateAI-`
2. Click on the **Settings** tab (the gear icon near the top right).
3. Under the "General" section at the very top, you'll see the **Repository name**.
4. Change it from `MotivateAI-` to `MotivateAI` (or `motivate-ai` - just make sure there is no hyphen at the very end).
5. Click **Rename**.

### Step 2: Restart the Google Cloud Deployment
1. Go back to the [Google Cloud Run Console](https://console.cloud.google.com/run).
2. Delete the current `motivate-ai` service that failed (click on it and hit the Delete icon/trash can at the top).
3. Click **Create Service** again.
4. Select **"Continuously deploy new revisions from a source repository"** and click **Set up with Cloud Build**.
5. When selecting your repository, select the newly named `MotivateAI` repository.
6. Make sure your variables are set in the "Variables & Secrets" section (`MONGODB_URI`, `GEMINI_API_KEY`, `GITHUB_PERSONAL_ACCESS_TOKEN`).
7. Make sure "Allow unauthenticated invocations" is checked.
8. Click **Create**.

Your build will now succeed and you'll have a live URL for your hackathon submission! Good luck! 🚀
