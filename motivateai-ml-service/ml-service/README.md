# MotivateAI ML Service

Adds a real, trained ML layer to MotivateAI's behavior analytics, sitting
alongside (not replacing) the existing rule-based logic in
`lib/services/behaviorAnalyzer.ts`.

## What this is

- **`train_model.py`** — trains two scikit-learn models from exported session data:
  - **Completion model** (logistic regression): predicts probability a task gets completed, given duration, position in session, time of day, and rolling break-skip rate.
  - **Dropout model** (logistic regression, class-balanced): predicts probability a session ends in dropout, given task count, avg duration, break skip rate, and completion ratio so far.
- **`main.py`** — a small FastAPI service exposing `/predict/completion` and `/predict/dropout`.
- **`mlClient.ts`** — drop into `lib/services/mlClient.ts` in the Next.js app. Calls the FastAPI service with a 1.5s timeout and returns `null` on any failure — callers fall back to the original rule-based thresholds. ML is **additive**, never a hard dependency.
- **`generate_sample_data.py`** — synthetic data generator so you can test the whole pipeline before you have real user data.

## Quickstart

```bash
# 1. Install deps
pip install scikit-learn fastapi uvicorn joblib pandas

# 2. Generate sample data (or export real data — see below)
python generate_sample_data.py

# 3. Train models
python train_model.py --input sample_sessions.json --outdir ./models

# 4. Run the service
uvicorn main:app --host 0.0.0.0 --port 8000

# 5. Test it
curl http://localhost:8000/health
```

## Using real data instead of synthetic

```bash
mongoexport --uri="$MONGODB_URI" --collection=sessionlogs --out=sessions.json --jsonArray
python train_model.py --input sessions.json --outdir ./models
```

Retrain periodically (e.g. weekly cron) as more sessions accumulate, then:

```bash
curl -X POST http://localhost:8000/reload
```

to hot-swap the new models without restarting the service.

## Wiring into the Next.js app

1. Copy `mlClient.ts` to `lib/services/mlClient.ts`.
2. Add to `.env.local`:
   ```
   ML_SERVICE_URL=http://localhost:8000
   ML_ANALYTICS_ENABLED=true
   ```
3. In `behaviorAnalyzer.ts`, import `getCompletionProbability` / `getDropoutRisk`
   and use them to inform `calculateSignals()`, falling back to the existing
   threshold logic when they return `null` (service down, disabled, or model
   not yet trained — e.g. a brand-new deployment with no session history).

## Honest limitations (keep these in your pitch)

- Models are logistic regression on ~5-7 features — a solid, explainable baseline, not deep learning. That's a feature for a portfolio project (defensible, debuggable), not a weakness.
- Needs a meaningful volume of real session data before predictions beat the rule-based thresholds. Cold-start (few users, few sessions) should still lean on the rule-based fallback — this is why the client returns `null` rather than a low-confidence guess.
- The dropout model predicts *whether* a session ends in dropout, not precisely *when* — a regression model on `dropout_minutes` would be a natural next step once there's more data.
- No online/continual learning — retraining is a manual/scheduled batch job, not live updates.
