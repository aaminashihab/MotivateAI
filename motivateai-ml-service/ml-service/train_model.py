"""
MotivateAI - ML Training Script
=================================
Trains two models from exported SessionLog data (MongoDB -> JSON export):

1. Completion Model: predicts P(task will be completed) given task/session
   features. Replaces the static `avgTaskDuration < 18` style thresholds in
   behaviorAnalyzer.ts with a learned probability.

2. Dropout Model: predicts P(user drops out) at a given point in a session,
   given elapsed minutes, task position, and rolling behavior features.

Usage:
    1. Export session logs from MongoDB to sessions.json:
       mongoexport --collection=sessionlogs --out=sessions.json --jsonArray

    2. Run training:
       python train_model.py --input sessions.json --outdir ./models

    3. Two files are produced:
       models/completion_model.joblib
       models/dropout_model.joblib

Each model bundle includes the fitted sklearn Pipeline (scaler + logistic
regression) plus the exact feature column order, so main.py doesn't have to
guess at preprocessing.
"""

import argparse
import json
import sys
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score


def hour_bucket(hour: int) -> str:
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    return "evening"


def build_task_rows(sessions: list[dict]) -> pd.DataFrame:
    """
    Flatten sessions -> one row per task, with features known at the moment
    the task *starts* (no leakage from its own outcome).
    """
    rows = []
    for s in sessions:
        user_id = s.get("userId")
        started_at = s.get("startedAt")
        session_hour = None
        if started_at:
            try:
                session_hour = datetime.fromisoformat(
                    started_at.replace("Z", "+00:00")
                ).hour
            except Exception:
                session_hour = None

        breaks = s.get("breaks", [])
        break_skip_rate = (
            sum(1 for b in breaks if b.get("skipped")) / len(breaks)
            if breaks
            else 0.0
        )

        tasks = s.get("tasks", [])
        for i, t in enumerate(tasks):
            rows.append(
                {
                    "userId": user_id,
                    "estimated_duration": t.get("estimatedDuration", 20),
                    "task_position": i,  # 0-indexed position in session
                    "session_task_count": len(tasks),
                    "hour_of_day": session_hour if session_hour is not None else 12,
                    "time_bucket": hour_bucket(session_hour if session_hour is not None else 12),
                    "break_skip_rate_so_far": break_skip_rate,
                    "difficulty": t.get("userDifficulty", "just_right"),
                    # Label: did this task get completed?
                    "completed": int(bool(t.get("completed", False))),
                }
            )
    return pd.DataFrame(rows)


def build_dropout_rows(sessions: list[dict]) -> pd.DataFrame:
    """
    One row per session: features describing the session up to a checkpoint,
    label = whether a dropout occurred (and roughly when).
    """
    rows = []
    for s in sessions:
        tasks = s.get("tasks", [])
        breaks = s.get("breaks", [])
        dropout = s.get("dropoutPoint")

        completed_count = sum(1 for t in tasks if t.get("completed"))
        avg_estimated = (
            np.mean([t.get("estimatedDuration", 20) for t in tasks]) if tasks else 20
        )
        break_skip_rate = (
            sum(1 for b in breaks if b.get("skipped")) / len(breaks)
            if breaks
            else 0.0
        )

        rows.append(
            {
                "userId": s.get("userId"),
                "task_count": len(tasks),
                "avg_estimated_duration": avg_estimated,
                "break_skip_rate": break_skip_rate,
                "completed_ratio": completed_count / len(tasks) if tasks else 0,
                "estimated_session_time": s.get("estimatedSessionTime", 0),
                # Label: 1 if a dropout was recorded for this session
                "dropped_out": int(dropout is not None),
                # Auxiliary target (not modeled directly here, but useful to export
                # for a future regression model on "minutes into session"):
                "dropout_minutes": dropout.get("minutesInto") if dropout else None,
            }
        )
    return pd.DataFrame(rows)


def train_completion_model(df: pd.DataFrame, outdir: str):
    if df.empty or df["completed"].nunique() < 2:
        print("[completion_model] Not enough varied data to train — skipping.")
        return

    feature_cols_numeric = [
        "estimated_duration",
        "task_position",
        "session_task_count",
        "hour_of_day",
        "break_skip_rate_so_far",
    ]
    feature_cols_categorical = ["time_bucket", "difficulty"]

    X = pd.get_dummies(df[feature_cols_numeric + feature_cols_categorical], columns=feature_cols_categorical)
    y = df["completed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if y.nunique() > 1 else None
    )

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    print("\n=== Completion Model ===")
    print(classification_report(y_test, preds))
    try:
        auc = roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])
        print(f"ROC AUC: {auc:.3f}")
    except Exception:
        pass

    joblib.dump(
        {"pipeline": pipe, "feature_columns": list(X.columns)},
        f"{outdir}/completion_model.joblib",
    )
    print(f"Saved -> {outdir}/completion_model.joblib")


def train_dropout_model(df: pd.DataFrame, outdir: str):
    if df.empty or df["dropped_out"].nunique() < 2:
        print("[dropout_model] Not enough varied data to train — skipping.")
        return

    feature_cols = [
        "task_count",
        "avg_estimated_duration",
        "break_skip_rate",
        "completed_ratio",
        "estimated_session_time",
    ]
    X = df[feature_cols]
    y = df["dropped_out"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if y.nunique() > 1 else None
    )

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])
    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    print("\n=== Dropout Model ===")
    print(classification_report(y_test, preds))
    try:
        auc = roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])
        print(f"ROC AUC: {auc:.3f}")
    except Exception:
        pass

    joblib.dump(
        {"pipeline": pipe, "feature_columns": feature_cols},
        f"{outdir}/dropout_model.joblib",
    )
    print(f"Saved -> {outdir}/dropout_model.joblib")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to exported sessions.json")
    parser.add_argument("--outdir", default="./models", help="Where to save trained models")
    args = parser.parse_args()

    import os
    os.makedirs(args.outdir, exist_ok=True)

    with open(args.input) as f:
        sessions = json.load(f)

    if not sessions:
        print("No sessions found in input file.")
        sys.exit(1)

    print(f"Loaded {len(sessions)} sessions.")

    task_df = build_task_rows(sessions)
    dropout_df = build_dropout_rows(sessions)

    train_completion_model(task_df, args.outdir)
    train_dropout_model(dropout_df, args.outdir)


if __name__ == "__main__":
    main()
