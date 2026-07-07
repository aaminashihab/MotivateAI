"""
MotivateAI ML Service
=====================
Small FastAPI service exposing the trained completion-probability and
dropout-risk models. Run this alongside the Next.js app:

    uvicorn main:app --host 0.0.0.0 --port 8000

The Next.js app calls this at ML_SERVICE_URL (see lib/services/mlClient.ts).
If this service is down or ML_ANALYTICS_ENABLED=false, the app falls back
to the original rule-based logic in behaviorAnalyzer.ts — this service is
additive, never a hard dependency.
"""

import os

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="MotivateAI ML Service")

MODEL_DIR = os.environ.get("MODEL_DIR", "./models")

_completion_bundle = None
_dropout_bundle = None


def _load_models():
    global _completion_bundle, _dropout_bundle
    try:
        _completion_bundle = joblib.load(f"{MODEL_DIR}/completion_model.joblib")
    except FileNotFoundError:
        _completion_bundle = None
    try:
        _dropout_bundle = joblib.load(f"{MODEL_DIR}/dropout_model.joblib")
    except FileNotFoundError:
        _dropout_bundle = None


_load_models()


class CompletionRequest(BaseModel):
    estimated_duration: int
    task_position: int
    session_task_count: int
    hour_of_day: int
    break_skip_rate_so_far: float
    difficulty: str = "just_right"  # easy | just_right | hard


class DropoutRequest(BaseModel):
    task_count: int
    avg_estimated_duration: float
    break_skip_rate: float
    completed_ratio: float
    estimated_session_time: float


def _hour_bucket(hour: int) -> str:
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    return "evening"


@app.get("/health")
def health():
    return {
        "status": "ok",
        "completion_model_loaded": _completion_bundle is not None,
        "dropout_model_loaded": _dropout_bundle is not None,
    }


@app.post("/predict/completion")
def predict_completion(req: CompletionRequest):
    if _completion_bundle is None:
        raise HTTPException(status_code=503, detail="completion_model not trained yet")

    row = {
        "estimated_duration": req.estimated_duration,
        "task_position": req.task_position,
        "session_task_count": req.session_task_count,
        "hour_of_day": req.hour_of_day,
        "break_skip_rate_so_far": req.break_skip_rate_so_far,
        "time_bucket": _hour_bucket(req.hour_of_day),
        "difficulty": req.difficulty,
    }
    df = pd.DataFrame([row])
    df = pd.get_dummies(df, columns=["time_bucket", "difficulty"])

    # Align columns with training-time schema (fills missing dummy cols with 0)
    feature_cols = _completion_bundle["feature_columns"]
    df = df.reindex(columns=feature_cols, fill_value=0)

    prob = _completion_bundle["pipeline"].predict_proba(df)[0][1]
    return {"completion_probability": round(float(prob), 4)}


@app.post("/predict/dropout")
def predict_dropout(req: DropoutRequest):
    if _dropout_bundle is None:
        raise HTTPException(status_code=503, detail="dropout_model not trained yet")

    row = {
        "task_count": req.task_count,
        "avg_estimated_duration": req.avg_estimated_duration,
        "break_skip_rate": req.break_skip_rate,
        "completed_ratio": req.completed_ratio,
        "estimated_session_time": req.estimated_session_time,
    }
    df = pd.DataFrame([row])[_dropout_bundle["feature_columns"]]

    prob = _dropout_bundle["pipeline"].predict_proba(df)[0][1]
    return {"dropout_risk": round(float(prob), 4)}


@app.post("/reload")
def reload_models():
    """Call after retraining to hot-swap models without restarting the service."""
    _load_models()
    return {"reloaded": True}
